import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TranslateRequest, TranslateResponse, ErrorResponse } from '../types';
import { OpenAIService } from '../services/openai';

const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLanguage: z.string().min(2).max(5), // ISO language code
});

export async function translateRoutes(fastify: FastifyInstance, openAIService: OpenAIService) {
  fastify.post<{ Body: TranslateRequest }>('/translate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validationResult = TranslateRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')}`,
          },
        };
        return reply.code(400).send(error);
      }

      const { text, targetLanguage } = validationResult.data;

      const translatedText = await openAIService.translate(text, targetLanguage);

      const response: TranslateResponse = {
        translated_text: translatedText,
        source_language: 'auto', // Could detect this if needed
        target_language: targetLanguage,
      };

      return reply.send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ error: errorMessage }, 'Translation failed');
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
