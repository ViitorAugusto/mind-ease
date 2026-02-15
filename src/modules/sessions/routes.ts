import { FastifyInstance } from "fastify";
import { sessionsService } from "./service";
import { startSessionSchema, finishSessionSchema } from "./schemas";
import { authGuard } from "../../shared/middleware/auth";

export async function sessionsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/pomodoro/sessions/start",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Sessions"],
        description:
          "Iniciar nova sessão (foco ou descanso). Apenas 1 sessão ativa por vez.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type"],
          properties: {
            type: {
              type: "string",
              enum: ["FOCUS", "SHORT_BREAK", "LONG_BREAK"],
            },
            taskId: {
              type: "string",
              format: "uuid",
              description: "ID da tarefa (opcional)",
            },
          },
        },
        response: {
          201: {
            description: "Sessão iniciada",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              taskId: { type: "string", format: "uuid", nullable: true },
              type: {
                type: "string",
                enum: ["FOCUS", "SHORT_BREAK", "LONG_BREAK"],
              },
              status: {
                type: "string",
                enum: ["COMPLETED", "CANCELED", "EXPIRED"],
              },
              startedAt: { type: "string", format: "date-time" },
              endedAt: { type: "string", format: "date-time", nullable: true },
              plannedDurationSeconds: {
                type: "number",
                description: "Duração planejada (ex: 25min = 1500s)",
              },
              actualDurationSeconds: { type: "number", nullable: true },
            },
          },
          400: {
            description: "Erro: já existe sessão ativa",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = startSessionSchema.parse(request.body);
        const session = await sessionsService.startSession(
          request.user.userId,
          data,
        );
        return reply.status(201).send(session);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.post(
    "/pomodoro/sessions/:id/finish",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Sessions"],
        description: "Finalizar sessão ativa",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "ID da sessão" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["COMPLETED", "CANCELED", "EXPIRED"],
            },
            endedAt: {
              type: "string",
              format: "date-time",
              description: "Data/hora de término (opcional, padrão: agora)",
            },
          },
        },
        response: {
          200: {
            description: "Sessão finalizada",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              type: { type: "string" },
              status: { type: "string" },
              startedAt: { type: "string", format: "date-time" },
              endedAt: { type: "string", format: "date-time" },
              plannedDurationSeconds: { type: "number" },
              actualDurationSeconds: {
                type: "number",
                description: "Duração real em segundos",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = finishSessionSchema.parse(request.body);
        const session = await sessionsService.finishSession(
          request.user.userId,
          id,
          data,
        );
        return reply.send(session);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/pomodoro/sessions/active",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Sessions"],
        description:
          "Obter sessão ativa do usuário com tempo restante calculado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Sessão ativa",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              type: {
                type: "string",
                enum: ["FOCUS", "SHORT_BREAK", "LONG_BREAK"],
              },
              status: { type: "string" },
              startedAt: { type: "string", format: "date-time" },
              plannedDurationSeconds: { type: "number" },
              elapsedSeconds: {
                type: "number",
                description: "Tempo decorrido",
              },
              remainingSeconds: {
                type: "number",
                description: "Tempo restante",
              },
            },
          },
          404: {
            description: "Nenhuma sessão ativa",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const session = await sessionsService.getActiveSession(
          request.user.userId,
        );

        if (!session) {
          return reply.status(404).send({ error: "Nenhuma sessao ativa" });
        }

        return reply.send(session);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );
}
