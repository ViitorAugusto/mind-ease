import { FastifyInstance } from "fastify";
import { pomodoroSettingsService } from "./service";
import { updateSettingsSchema } from "./schemas";
import { authGuard } from "../../shared/middleware/auth";

export async function pomodoroRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/pomodoro/settings",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Settings"],
        description: "Obter configurações do Pomodoro do usuário",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Configurações do usuário",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              focusMinutes: { type: "number" },
              shortBreakMinutes: { type: "number" },
              longBreakMinutes: { type: "number" },
              longBreakEvery: {
                type: "number",
                description: "A cada quantas sessões de foco",
              },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const settings = await pomodoroSettingsService.getSettings(
          request.user.userId,
        );
        return reply.send(settings);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.put(
    "/pomodoro/settings",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Settings"],
        description: "Atualizar configurações do Pomodoro",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            focusMinutes: {
              type: "number",
              minimum: 1,
              maximum: 120,
            },
            shortBreakMinutes: {
              type: "number",
              minimum: 1,
              maximum: 60,
            },
            longBreakMinutes: {
              type: "number",
              minimum: 1,
              maximum: 120,
            },
            longBreakEvery: {
              type: "number",
              minimum: 1,
              maximum: 20,
            },
          },
        },
        response: {
          200: {
            description: "Configurações atualizadas",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              focusMinutes: { type: "number" },
              shortBreakMinutes: { type: "number" },
              longBreakMinutes: { type: "number" },
              longBreakEvery: { type: "number" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = updateSettingsSchema.parse(request.body);
        const settings = await pomodoroSettingsService.updateSettings(
          request.user.userId,
          data,
        );
        return reply.send(settings);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );
}
