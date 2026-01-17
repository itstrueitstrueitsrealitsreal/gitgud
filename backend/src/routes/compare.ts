import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CompareRequest, CompareResponse, ErrorResponse } from '../types';
import { GitHubService } from '../services/github';
import { OpenAIService } from '../services/openai';
import { GitHubCache, OpenAIResultCache } from '../utils/cache';
import { LeaderboardService } from '../services/leaderboard';

const CompareRequestSchema = z.object({
  username1: z.string().min(1).max(39),
  username2: z.string().min(1).max(39),
  language: z.string().optional().default('en'),
});

export async function compareRoutes(
  fastify: FastifyInstance,
  githubService: GitHubService,
  openAIService: OpenAIService,
  githubCache: GitHubCache,
  openAICache: OpenAIResultCache,
  leaderboardService: LeaderboardService
) {
  fastify.post<{ Body: CompareRequest }>('/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = CompareRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')}`,
          },
        };
        return reply.code(400).send(error);
      }

      const { username1, username2, language } = validationResult.data;

      if (username1 === username2) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: 'Cannot compare a user with themselves',
          },
        };
        return reply.code(400).send(error);
      }

      fastify.log.info({ requestId, username1, username2, language }, 'Compare request received');

      // Fetch and roast both users in parallel
      const maxRepos = 5;
      const intensity = 'medium';

      const [signals1, signals2] = await Promise.all([
        (async () => {
          let signals = githubCache.get(username1, maxRepos, false);
          if (!signals) {
            signals = await githubService.getSignals(username1, maxRepos, false);
            githubCache.set(username1, maxRepos, false, signals);
          }
          return signals;
        })(),
        (async () => {
          let signals = githubCache.get(username2, maxRepos, false);
          if (!signals) {
            signals = await githubService.getSignals(username2, maxRepos, false);
            githubCache.set(username2, maxRepos, false, signals);
          }
          return signals;
        })(),
      ]);

      // Generate roasts for both users
      const [roast1, roast2] = await Promise.all([
        (async () => {
          let roast = openAICache.get(username1, intensity);
          if (!roast) {
            roast = await openAIService.generateRoast(signals1, intensity);
            openAICache.set(username1, intensity, roast);
          }
          return roast;
        })(),
        (async () => {
          let roast = openAICache.get(username2, intensity);
          if (!roast) {
            roast = await openAIService.generateRoast(signals2, intensity);
            openAICache.set(username2, intensity, roast);
          }
          return roast;
        })(),
      ]);

      // Generate comparison verdict
      const verdict = await openAIService.compareUsers(
        { username: username1, signals: signals1, roast: roast1 },
        { username: username2, signals: signals2, roast: roast2 },
        language
      );

      // Update leaderboard
      if (verdict.winner !== 'tie') {
        const winner = verdict.winner === 'user1' ? username1 : username2;
        const loser = verdict.winner === 'user1' ? username2 : username1;
        leaderboardService.recordMatch(winner, loser);
      }

      const totalTime = Date.now() - startTime;
      fastify.log.info({ requestId, totalTime }, 'Compare request completed');

      const response: CompareResponse = {
        request_id: requestId,
        user1: {
          username: username1,
          signals: signals1,
          roast: roast1,
        },
        user2: {
          username: username2,
          signals: signals2,
          roast: roast2,
        },
        verdict,
      };

      return reply.send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ requestId, error: errorMessage }, 'Compare request failed');
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      };
      return reply.code(500).send(errorResponse);
    }
  });
}
