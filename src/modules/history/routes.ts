import { FastifyInstance } from "fastify";
import { historyService } from "./service";
import { historyQuerySchema } from "./schemas";
import { authGuard } from "../../shared/middleware/auth";

export async function historyRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/pomodoro/history",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["History"],
        description: "Listar todas as sessões por período",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            from: {
              type: "string",
              format: "date",
              description: "Data inicial (YYYY-MM-DD)",
            },
            to: {
              type: "string",
              format: "date",
              description: "Data final (YYYY-MM-DD)",
            },
          },
        },
        response: {
          200: {
            description: "Lista de sessões",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                userId: { type: "string", format: "uuid" },
                type: { type: "string" },
                status: { type: "string" },
                startedAt: { type: "string", format: "date-time" },
                endedAt: {
                  type: "string",
                  format: "date-time",
                  nullable: true,
                },
                plannedDurationSeconds: { type: "number" },
                actualDurationSeconds: { type: "number", nullable: true },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { from, to } = historyQuerySchema.parse(request.query);
        const history = await historyService.getHistory(
          request.user.userId,
          from,
          to,
        );
        return reply.send(history);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/pomodoro/summary",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["History"],
        description:
          "Obter estatísticas agregadas (total focado, média, streak)",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
          },
        },
        response: {
          200: {
            description: "Estatísticas do período",
            type: "object",
            properties: {
              totalSessions: {
                type: "number",
                description: "Total de sessões",
              },
              completedSessions: {
                type: "number",
                description: "Sessões completadas",
              },
              canceledSessions: {
                type: "number",
                description: "Sessões canceladas",
              },
              totalFocusSessions: {
                type: "number",
                description: "Total sessões de foco",
              },
              completedFocusSessions: {
                type: "number",
                description: "Sessões foco completadas",
              },
              totalFocusMinutes: {
                type: "number",
                description: "Total minutos focados",
              },
              totalBreakMinutes: {
                type: "number",
                description: "Total minutos de descanso",
              },
              averageFocusMinutes: {
                type: "number",
                description: "Média de minutos por sessão foco",
              },
              streak: {
                type: "number",
                description: "Dias consecutivos com pelo menos 1 foco",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { from, to } = historyQuerySchema.parse(request.query);
        const summary = await historyService.getSummary(
          request.user.userId,
          from,
          to,
        );
        return reply.send(summary);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );
}
