// Load environment variables from .env file FIRST
import dotenv from "dotenv";
import { resolve } from "path";

// Explicitly load .env from project root (works regardless of where script is run from)
// process.cwd() returns the current working directory when the process was started
dotenv.config({ path: resolve(process.cwd(), ".env") });

import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import cors from "@fastify/cors";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";
import fastifyOauth2 from "@fastify/oauth2";
import { join } from "path";
import { GitHubService } from "./services/github";
import { OpenAIService } from "./services/openai";
import { ElevenLabsService } from "./services/elevenlabs";
import { GitHubCache, OpenAIResultCache } from "./utils/cache";
import { RateLimiter } from "./utils/rateLimiter";
import { roastRoutes } from "./routes/roast";
import { ttsRoutes } from "./routes/tts";
import { compareRoutes } from "./routes/compare";
import { translateRoutes } from "./routes/translate";
import { leaderboardRoutes } from "./routes/leaderboard";
import { authRoutes } from "./routes/auth";
import { pvpRoutes } from "./routes/pvp";
import { LeaderboardService } from "./services/leaderboard";
import { PVPService } from "./services/pvp";

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "change-me-in-production-use-random-string";
const PORT = parseInt(process.env.PORT || "3000", 10);
// Default allowed origins for development
const DEFAULT_ORIGINS = [
  "http://localhost",
  "http://localhost:80",
  "http://localhost:5173",
  "http://127.0.0.1",
  "http://127.0.0.1:80",
  "http://127.0.0.1:5173",
];
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",").filter(Boolean) || DEFAULT_ORIGINS;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Validate required environment variables
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is required");
  process.exit(1);
}

if (!ELEVENLABS_API_KEY) {
  console.error("ERROR: ELEVENLABS_API_KEY is required");
  process.exit(1);
}

// Initialize services
// Only use GITHUB_TOKEN if it's set and not a placeholder
const githubToken =
  GITHUB_TOKEN &&
  !GITHUB_TOKEN.includes("your_github") &&
  GITHUB_TOKEN.length > 10
    ? GITHUB_TOKEN
    : undefined;
const githubService = new GitHubService(githubToken);
const openAIService = new OpenAIService(OPENAI_API_KEY, OPENAI_MODEL);
const elevenLabsService = new ElevenLabsService(ELEVENLABS_API_KEY);
const leaderboardService = new LeaderboardService();
const pvpService = new PVPService();

// Initialize caches
const githubCache = new GitHubCache(5 * 60 * 1000); // 5 minutes
const openAICache = new OpenAIResultCache(10 * 60 * 1000); // 10 minutes

// Initialize rate limiter - increased for PVP polling
const rateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
  trustProxy: true, // For getting real IP behind proxy
});

// Register cookie plugin (required for session)
// @fastify/session requires secret to be at least 32 characters
const sessionSecret =
  SESSION_SECRET.length >= 32
    ? SESSION_SECRET
    : SESSION_SECRET.padEnd(32, "0").slice(0, 32);

fastify.register(fastifyCookie, {
  secret: sessionSecret,
});

// Register session plugin
fastify.register(fastifySession, {
  secret: sessionSecret,
  cookie: {
    path: "/",
    httpOnly: true,
    secure: false, // Set to false for local development with Docker
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  saveUninitialized: false,
  rolling: true,
});

// Register CORS
fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) {
      callback(null, true);
      return;
    }

    // Always allow localhost origins (for local development/testing)
    if (
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1")
    ) {
      callback(null, true);
      return;
    }

    // In production, also check against ALLOWED_ORIGINS
    if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }

    // Reject in production if not in allowed list
    callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Register GitHub OAuth (if credentials provided)
// Must be registered before auth routes
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  fastify.register(fastifyOauth2, {
    name: "githubOAuth2",
    credentials: {
      client: {
        id: GITHUB_CLIENT_ID,
        secret: GITHUB_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GITHUB_CONFIGURATION,
    },
    startRedirectPath: "/auth/github",
    callbackUri: `${process.env.BACKEND_URL || `http://localhost:${PORT}`}/auth/github/callback`,
    scope: ["read:user"],
  });
} else {
  console.warn(
    "⚠️  GitHub OAuth credentials not provided. PVP mode will not work.",
  );
  // Provide a helpful error route if OAuth is not configured
  fastify.get(
    "/auth/github",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(500).send({
        error: {
          code: "OAUTH_NOT_CONFIGURED",
          message:
            "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.",
          instructions: [
            "1. Go to https://github.com/settings/developers",
            '2. Click "New OAuth App"',
            "3. Set Authorization callback URL to: http://localhost:3000/auth/github/callback",
            "4. Copy the Client ID and Client Secret",
            "5. Add them to your .env file as GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET",
          ],
        },
      });
    },
  );
}

// Rate limiting middleware
fastify.addHook(
  "onRequest",
  async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting for health check and static endpoints
    const exemptPaths = ["/health", "/favicon.ico", "/"];
    if (exemptPaths.includes(request.url)) {
      return;
    }

    const ip = request.ip || "unknown";
    const check = rateLimiter.check(ip);

    if (!check.allowed) {
      reply.code(429).send({
        error: {
          code: "RATE_LIMIT",
          message: `Rate limit exceeded. Try again after ${new Date(check.resetAt).toISOString()}`,
        },
      });
      return;
    }

    reply.header("X-RateLimit-Remaining", check.remaining.toString());
    reply.header("X-RateLimit-Reset", check.resetAt.toString());
  },
);

// Root endpoint - API information
fastify.get("/", async () => {
  return {
    name: "GitGud Backend API",
    version: "2.0.0",
    description:
      "Backend API for GitGud - GitHub Developer Comparison Platform",
    endpoints: {
      "GET /": "API information (this endpoint)",
      "GET /health": "Health check endpoint",
      "POST /roast":
        "Generate roast, advice, and personality profile for a GitHub user",
      "POST /tts": "Convert text to speech using ElevenLabs",
      "POST /compare": "Compare two GitHub users and determine winner",
      "POST /translate": "Translate text to target language",
      "GET /leaderboard": "Get leaderboard of top developers",
      "GET /leaderboard/:username": "Get stats for a specific user",
      "GET /auth/github": "Start GitHub OAuth flow",
      "GET /auth/github/callback": "GitHub OAuth callback",
      "GET /auth/me": "Get current user session",
      "POST /auth/logout": "Logout user",
      "POST /pvp/create": "Create a new PVP match",
      "POST /pvp/join": "Join an existing PVP match",
      "GET /pvp/match/:matchId": "Get match status",
      "POST /pvp/ready/:matchId": "Mark player as ready",
      "GET /pvp/my-match": "Get current user's match",
    },
    timestamp: new Date().toISOString(),
  };
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Serve static files for frontend (built React app)
import fastifyStatic from "@fastify/static";
fastify.register(fastifyStatic, {
  root: join(__dirname, "../../frontend/dist"),
  prefix: "/",
});

// Fallback to index.html for client-side routing
fastify.setNotFoundHandler((request, reply) => {
  if (
    request.url.startsWith("/api") ||
    request.url.startsWith("/compare") ||
    request.url.startsWith("/translate") ||
    request.url.startsWith("/leaderboard") ||
    request.url.startsWith("/roast") ||
    request.url.startsWith("/tts") ||
    request.url.startsWith("/health") ||
    request.url.startsWith("/auth") ||
    request.url.startsWith("/pvp")
  ) {
    reply.code(404).send({ error: "Not found" });
  } else {
    reply.sendFile("index.html");
  }
});

// Register routes
fastify.register(async (fastify: FastifyInstance) => {
  await roastRoutes(
    fastify,
    githubService,
    openAIService,
    githubCache,
    openAICache,
  );
});

fastify.register(async (fastify: FastifyInstance) => {
  await ttsRoutes(fastify, elevenLabsService);
});

fastify.register(async (fastify: FastifyInstance) => {
  await compareRoutes(
    fastify,
    githubService,
    openAIService,
    githubCache,
    openAICache,
    leaderboardService,
  );
});

fastify.register(async (fastify: FastifyInstance) => {
  await translateRoutes(fastify, openAIService);
});

fastify.register(async (fastify: FastifyInstance) => {
  await leaderboardRoutes(fastify, leaderboardService);
});

// Auth routes must be registered after OAuth plugin
fastify.register(async (fastify: FastifyInstance) => {
  await authRoutes(fastify);
});

fastify.register(async (fastify: FastifyInstance) => {
  await pvpRoutes(
    fastify,
    pvpService,
    githubService,
    openAIService,
    githubCache,
    openAICache,
    leaderboardService,
  );
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 GitGud backend server listening on port ${PORT}`);
    console.log(`📝 OpenAI model: ${OPENAI_MODEL}`);
    console.log(
      `🔒 CORS: ${ALLOWED_ORIGINS.length > 0 ? `Restricted to ${ALLOWED_ORIGINS.length} origin(s)` : "Allowing all origins (development mode)"}`,
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
