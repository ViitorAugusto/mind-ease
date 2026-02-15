import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./shared/config";
import { authRoutes } from "./modules/auth/routes";
import { pomodoroRoutes } from "./modules/pomodoro/routes";
import { sessionsRoutes } from "./modules/sessions/routes";
import { historyRoutes } from "./modules/history/routes";
import { boardsRoutes } from "./modules/boards/routes";
import { tasksRoutes } from "./modules/tasks/routes";

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === "development" ? "info" : "error",
    },
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Mind Ease - Pomodoro API",
        description:
          "API para gerenciamento de sessões Pomodoro com autenticação JWT",
        version: "1.0.0",
      },
      servers: [
        {
          url:
            config.nodeEnv === "development"
              ? `http://localhost:${config.port}`
              : "https://mind-ease-7ky3.onrender.com",
          description:
            config.nodeEnv === "development"
              ? "Development server"
              : "Production",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      tags: [
        { name: "Auth", description: "Autenticação e autorização" },
        { name: "Settings", description: "Configurações do Pomodoro" },
        { name: "Sessions", description: "Gerenciamento de sessões" },
        { name: "History", description: "Histórico e estatísticas" },
        { name: "Boards", description: "Boards do usuario" },
        { name: "Tasks", description: "Tasks do usuario" },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/swagger",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await fastify.register(authRoutes);
  await fastify.register(pomodoroRoutes);
  await fastify.register(sessionsRoutes);
  await fastify.register(historyRoutes);
  await fastify.register(boardsRoutes);
  await fastify.register(tasksRoutes);

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      error: error.message || "Erro interno do servidor",
    });
  });

  return fastify;
}
