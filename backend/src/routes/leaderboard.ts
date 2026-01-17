import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LeaderboardResponse, ErrorResponse } from '../types';
import { LeaderboardService } from '../services/leaderboard';

export async function leaderboardRoutes(fastify: FastifyInstance, leaderboardService: LeaderboardService) {
  fastify.get('/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const limit = parseInt((request.query as { limit?: string })?.limit || '50', 10);
      const entries = leaderboardService.getLeaderboard(Math.min(limit, 100)); // Max 100

      const response: LeaderboardResponse = {
        entries,
        total_entries: entries.length,
      };

      return reply.send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ error: errorMessage }, 'Leaderboard fetch failed');
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      };
      return reply.code(500).send(errorResponse);
    }
  });

  fastify.get('/leaderboard/:username', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const username = (request.params as { username: string }).username;
      const stats = leaderboardService.getUserStats(username);

      if (!stats) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: 'User not found in leaderboard',
          },
        };
        return reply.code(404).send(error);
      }

      return reply.send(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ error: errorMessage }, 'User stats fetch failed');
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
