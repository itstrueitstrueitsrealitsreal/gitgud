import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ErrorResponse, UserSession } from "../types";

// Extend FastifyInstance to include OAuth2 plugin
declare module "fastify" {
  interface FastifyInstance {
    githubOAuth2?: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: FastifyRequest,
      ) => Promise<{ token: { access_token: string } }>;
    };
  }
}

export async function authRoutes(fastify: FastifyInstance) {
  // GitHub OAuth callback
  fastify.get(
    "/auth/github/callback",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!fastify.githubOAuth2) {
          throw new Error("GitHub OAuth is not configured");
        }

        const { token } =
          await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(
            request,
          );

        // Fetch user info from GitHub
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "User-Agent": "GitGud-Backend/1.0",
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user from GitHub");
        }

        const user = (await userResponse.json()) as {
          id: number;
          login: string;
          avatar_url?: string;
        };

        // Store session
        const userSession: UserSession = {
          githubId: user.id.toString(),
          username: user.login,
          accessToken: token.access_token,
          avatarUrl: user.avatar_url,
        };
        (request.session as any).user = userSession;

        // Save session explicitly before redirecting
        await new Promise<void>((resolve, reject) => {
          request.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return reply.redirect(`${frontendUrl}/pvp?auth=success`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed";
        fastify.log.error({ error: errorMessage }, "GitHub OAuth error");
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return reply.redirect(
          `${frontendUrl}/pvp?auth=error&message=${encodeURIComponent(errorMessage)}`,
        );
      }
    },
  );

  // Get current user session
  fastify.get(
    "/auth/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request.session as any).user as UserSession | undefined;
      if (!user) {
        const error: ErrorResponse = {
          error: {
            code: "BAD_REQUEST",
            message: "Not authenticated",
          },
        };
        return reply.code(401).send(error);
      }
      return reply.send({ user });
    },
  );

  // Logout
  fastify.post(
    "/auth/logout",
    async (request: FastifyRequest, reply: FastifyReply) => {
      request.session.destroy(() => {});
      return reply.send({ success: true });
    },
  );
}
