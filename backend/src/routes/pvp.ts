import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  CreateMatchRequest,
  JoinMatchRequest,
  MatchResponse,
  ErrorResponse,
} from "../types";
import { PVPService } from "../services/pvp";
import { GitHubService } from "../services/github";
import { OpenAIService } from "../services/openai";
import { GitHubCache, OpenAIResultCache } from "../utils/cache";
import { LeaderboardService } from "../services/leaderboard";

const CreateMatchSchema = z.object({
  username: z.string().min(1).max(39),
});

const JoinMatchSchema = z.object({
  matchId: z.string().uuid(),
  username: z.string().min(1).max(39),
});

export async function pvpRoutes(
  fastify: FastifyInstance,
  pvpService: PVPService,
  githubService: GitHubService,
  openAIService: OpenAIService,
  githubCache: GitHubCache,
  openAICache: OpenAIResultCache,
  leaderboardService: LeaderboardService,
) {
  // Helper to get authenticated user
  const getAuthenticatedUser = (request: FastifyRequest) => {
    const user = (request.session as any).user;
    if (!user) {
      throw new Error("Not authenticated");
    }
    return user as {
      githubId: string;
      username: string;
      accessToken: string;
      avatarUrl?: string;
    };
  };

  // Create a new PVP match
  fastify.post<{ Body: CreateMatchRequest }>(
    "/pvp/create",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = getAuthenticatedUser(request);
        const validationResult = CreateMatchSchema.safeParse(request.body);

        if (!validationResult.success) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(", ")}`,
            },
          };
          return reply.code(400).send(error);
        }

        const { username } = validationResult.data;

        // Check if user already has an active match
        const existingMatch = pvpService.getUserMatch(user.githubId);
        if (existingMatch && existingMatch.status !== "completed") {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "You already have an active match",
            },
          };
          return reply.code(400).send(error);
        }

        const match = pvpService.createMatch(username, user.githubId);

        const response: MatchResponse = { match };
        return reply.send(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        if (errorMessage === "Not authenticated") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Not authenticated",
            },
          };
          return reply.code(401).send(errorResponse);
        }
        fastify.log.error({ error: errorMessage }, "Create match failed");
        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    },
  );

  // Join an existing match
  fastify.post<{ Body: JoinMatchRequest }>(
    "/pvp/join",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = getAuthenticatedUser(request);
        const validationResult = JoinMatchSchema.safeParse(request.body);

        if (!validationResult.success) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(", ")}`,
            },
          };
          return reply.code(400).send(error);
        }

        const { matchId, username } = validationResult.data;

        const match = pvpService.joinMatch(matchId, username, user.githubId);

        if (!match) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Match not found",
            },
          };
          return reply.code(404).send(error);
        }

        const response: MatchResponse = { match };
        return reply.send(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        if (errorMessage === "Not authenticated") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Not authenticated",
            },
          };
          return reply.code(401).send(errorResponse);
        }
        if (
          errorMessage.includes("Cannot join") ||
          errorMessage.includes("already full")
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: errorMessage,
            },
          };
          return reply.code(400).send(errorResponse);
        }
        fastify.log.error({ error: errorMessage }, "Join match failed");
        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    },
  );

  // Get match status
  fastify.get(
    "/pvp/match/:matchId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const matchId = (request.params as { matchId: string }).matchId;
        const match = pvpService.getMatch(matchId);

        if (!match) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Match not found",
            },
          };
          return reply.code(404).send(error);
        }

        const response: MatchResponse = { match };
        return reply.send(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        fastify.log.error({ error: errorMessage }, "Get match failed");
        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    },
  );

  // Set player ready
  fastify.post(
    "/pvp/ready/:matchId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = getAuthenticatedUser(request);
        const matchId = (request.params as { matchId: string }).matchId;

        const match = pvpService.setReady(matchId, user.githubId);

        if (!match) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Match not found or you are not a player in this match",
            },
          };
          return reply.code(404).send(error);
        }

        // If both players are ready, start the comparison
        if (match.status === "in_progress" && match.player1 && match.player2) {
          // Run comparison in background
          (async () => {
            try {
              const maxRepos = 5;
              const intensity = "medium";
              const language = "en";

              const [signals1, signals2] = await Promise.all([
                (async () => {
                  let signals = githubCache.get(
                    match.player1!.username,
                    maxRepos,
                    false,
                  );
                  if (!signals) {
                    signals = await githubService.getSignals(
                      match.player1!.username,
                      maxRepos,
                      false,
                    );
                    githubCache.set(
                      match.player1!.username,
                      maxRepos,
                      false,
                      signals,
                    );
                  }
                  return signals;
                })(),
                (async () => {
                  let signals = githubCache.get(
                    match.player2!.username,
                    maxRepos,
                    false,
                  );
                  if (!signals) {
                    signals = await githubService.getSignals(
                      match.player2!.username,
                      maxRepos,
                      false,
                    );
                    githubCache.set(
                      match.player2!.username,
                      maxRepos,
                      false,
                      signals,
                    );
                  }
                  return signals;
                })(),
              ]);

              const [roast1, roast2] = await Promise.all([
                (async () => {
                  let roast = openAICache.get(
                    match.player1!.username,
                    intensity,
                  );
                  if (!roast) {
                    roast = await openAIService.generateRoast(
                      signals1,
                      intensity,
                    );
                    openAICache.set(match.player1!.username, intensity, roast);
                  }
                  return roast;
                })(),
                (async () => {
                  let roast = openAICache.get(
                    match.player2!.username,
                    intensity,
                  );
                  if (!roast) {
                    roast = await openAIService.generateRoast(
                      signals2,
                      intensity,
                    );
                    openAICache.set(match.player2!.username, intensity, roast);
                  }
                  return roast;
                })(),
              ]);

              const verdict = await openAIService.compareUsers(
                {
                  username: match.player1!.username,
                  signals: signals1,
                  roast: roast1,
                },
                {
                  username: match.player2!.username,
                  signals: signals2,
                  roast: roast2,
                },
                language,
              );

              const result = {
                request_id: `pvp-${matchId}`,
                user1: {
                  username: match.player1!.username,
                  signals: signals1,
                  roast: roast1,
                },
                user2: {
                  username: match.player2!.username,
                  signals: signals2,
                  roast: roast2,
                },
                verdict,
              };

              pvpService.setMatchResult(matchId, result);

              // Update leaderboard
              if (verdict.winner !== "tie") {
                const winner =
                  verdict.winner === "user1"
                    ? match.player1!.username
                    : match.player2!.username;
                const loser =
                  verdict.winner === "user1"
                    ? match.player2!.username
                    : match.player1!.username;
                leaderboardService.recordMatch(winner, loser);
              }
            } catch (error) {
              fastify.log.error(
                { matchId, error },
                "PVP match comparison failed",
              );
            }
          })();
        }

        const response: MatchResponse = { match };
        return reply.send(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        if (errorMessage === "Not authenticated") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Not authenticated",
            },
          };
          return reply.code(401).send(errorResponse);
        }
        fastify.log.error({ error: errorMessage }, "Set ready failed");
        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    },
  );

  // Get user's current match
  fastify.get(
    "/pvp/my-match",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = getAuthenticatedUser(request);
        const match = pvpService.getUserMatch(user.githubId);

        if (!match) {
          const error: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "No active match found",
            },
          };
          return reply.code(404).send(error);
        }

        const response: MatchResponse = { match };
        return reply.send(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        if (errorMessage === "Not authenticated") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "BAD_REQUEST",
              message: "Not authenticated",
            },
          };
          return reply.code(401).send(errorResponse);
        }
        fastify.log.error({ error: errorMessage }, "Get my match failed");
        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    },
  );

  // TEST ONLY: Auto-join and ready a dummy player 2
  fastify.post(
    "/pvp/test-join/:matchId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { matchId } = request.params as { matchId: string };
        const { username } = request.body as { username: string };

        if (!username) {
          return reply.code(400).send({
            error: {
              code: "BAD_REQUEST",
              message: "username is required in body",
            },
          });
        }

        // Create a dummy GitHub ID for testing
        const dummyGithubId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Join the match
        const match = pvpService.joinMatch(matchId, username, dummyGithubId);

        if (!match) {
          return reply.code(404).send({
            error: {
              code: "BAD_REQUEST",
              message: "Match not found",
            },
          });
        }

        // Automatically set ready
        const readyMatch = pvpService.setReady(matchId, dummyGithubId);

        // If both players are ready, start the comparison
        if (
          readyMatch &&
          readyMatch.status === "in_progress" &&
          readyMatch.player1 &&
          readyMatch.player2
        ) {
          // Run comparison in background
          (async () => {
            try {
              const maxRepos = 5;
              const intensity = "medium";
              const language = "en";

              const [signals1, signals2] = await Promise.all([
                (async () => {
                  let signals = githubCache.get(
                    readyMatch.player1!.username,
                    maxRepos,
                    false,
                  );
                  if (!signals) {
                    signals = await githubService.getSignals(
                      readyMatch.player1!.username,
                      maxRepos,
                      false,
                    );
                    githubCache.set(
                      readyMatch.player1!.username,
                      maxRepos,
                      false,
                      signals,
                    );
                  }
                  return signals;
                })(),
                (async () => {
                  let signals = githubCache.get(
                    readyMatch.player2!.username,
                    maxRepos,
                    false,
                  );
                  if (!signals) {
                    signals = await githubService.getSignals(
                      readyMatch.player2!.username,
                      maxRepos,
                      false,
                    );
                    githubCache.set(
                      readyMatch.player2!.username,
                      maxRepos,
                      false,
                      signals,
                    );
                  }
                  return signals;
                })(),
              ]);

              const [roast1, roast2] = await Promise.all([
                (async () => {
                  let roast = openAICache.get(
                    readyMatch.player1!.username,
                    intensity,
                  );
                  if (!roast) {
                    roast = await openAIService.generateRoast(
                      signals1,
                      intensity,
                    );
                    openAICache.set(
                      readyMatch.player1!.username,
                      intensity,
                      roast,
                    );
                  }
                  return roast;
                })(),
                (async () => {
                  let roast = openAICache.get(
                    readyMatch.player2!.username,
                    intensity,
                  );
                  if (!roast) {
                    roast = await openAIService.generateRoast(
                      signals2,
                      intensity,
                    );
                    openAICache.set(
                      readyMatch.player2!.username,
                      intensity,
                      roast,
                    );
                  }
                  return roast;
                })(),
              ]);

              const verdict = await openAIService.compareUsers(
                {
                  username: readyMatch.player1!.username,
                  signals: signals1,
                  roast: roast1,
                },
                {
                  username: readyMatch.player2!.username,
                  signals: signals2,
                  roast: roast2,
                },
                language,
              );

              const result = {
                request_id: `pvp-${matchId}`,
                user1: {
                  username: readyMatch.player1!.username,
                  signals: signals1,
                  roast: roast1,
                },
                user2: {
                  username: readyMatch.player2!.username,
                  signals: signals2,
                  roast: roast2,
                },
                verdict,
              };

              pvpService.setMatchResult(matchId, result);

              // Update leaderboard
              if (verdict.winner !== "tie") {
                const winner =
                  verdict.winner === "user1"
                    ? readyMatch.player1!.username
                    : readyMatch.player2!.username;
                const loser =
                  verdict.winner === "user1"
                    ? readyMatch.player2!.username
                    : readyMatch.player1!.username;
                leaderboardService.recordMatch(winner, loser);
              }
            } catch (error) {
              fastify.log.error(
                { matchId, error },
                "PVP test match comparison failed",
              );
            }
          })();
        }

        return reply.send({
          match: readyMatch,
          message: "Test player joined and marked ready",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Internal server error";
        fastify.log.error({ error: errorMessage }, "Test join failed");
        return reply.code(500).send({
          error: {
            code: "INTERNAL_ERROR",
            message: errorMessage,
          },
        });
      }
    },
  );
}
