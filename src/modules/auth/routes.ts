import { FastifyInstance } from "fastify";
import { authService } from "./service";
import { registerSchema, loginSchema, refreshTokenSchema } from "./schemas";
import { authGuard } from "../../shared/middleware/auth";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/auth/register",
    {
      schema: {
        tags: ["Auth"],
        description: "Registrar novo usuário e criar configurações padrão",
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
            },
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
              minLength: 6,
              maxLength: 100,
            },
          },
        },
        response: {
          201: {
            description: "Usuário criado com sucesso",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                  email: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              accessToken: {
                type: "string",
                description: "JWT access token (válido por 15 min)",
              },
              refreshToken: {
                type: "string",
                description: "Refresh token (válido por 7 dias)",
              },
            },
          },
          400: {
            description: "Erro de validação ou usuário já existe",
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
        const data = registerSchema.parse(request.body);
        const user = await authService.register(data);

        const accessToken = fastify.jwt.sign({
          userId: user.id,
          email: user.email,
        });
        const refreshToken = await authService.createRefreshToken(user.id);

        return reply.status(201).send({
          user,
          accessToken,
          refreshToken,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.post(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        description: "Fazer login e receber tokens JWT",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
            },
            password: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Login realizado com sucesso",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  userId: { type: "string", format: "uuid" },
                  email: { type: "string" },
                  name: { type: "string" },
                },
              },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
          401: {
            description: "Credenciais inválidas",
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
        const data = loginSchema.parse(request.body);
        const user = await authService.login(data);

        const accessToken = fastify.jwt.sign({
          userId: user.userId,
          email: user.email,
        });
        const refreshToken = await authService.createRefreshToken(user.userId);

        return reply.send({
          user,
          accessToken,
          refreshToken,
        });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    },
  );

  fastify.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        description: "Renovar access token usando refresh token",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Novo access token gerado",
            type: "object",
            properties: {
              accessToken: { type: "string" },
            },
          },
          401: {
            description: "Refresh token inválido ou expirado",
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
        const { refreshToken } = refreshTokenSchema.parse(request.body);
        const user = await authService.validateRefreshToken(refreshToken);

        const accessToken = fastify.jwt.sign({
          userId: user.userId,
          email: user.email,
        });

        return reply.send({
          accessToken,
        });
      } catch (error: any) {
        return reply.status(401).send({ error: error.message });
      }
    },
  );

  fastify.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        description: "Fazer logout revogando o refresh token",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Logout realizado com sucesso",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { refreshToken } = refreshTokenSchema.parse(request.body);
        await authService.revokeRefreshToken(refreshToken);

        return reply.send({ message: "Logged out successfully" });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/me",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Auth"],
        description: "Obter dados do usuário autenticado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Dados do usuário",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          401: {
            description: "Não autenticado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            description: "Usuário não encontrado",
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
        const user = await authService.getMe(request.user.userId);
        return reply.send(user);
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    },
  );
}
