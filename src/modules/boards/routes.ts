import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth";
import {
  boardIdParamSchema,
  createBoardSchema,
  updateBoardSchema,
} from "./schemas";
import { boardsService } from "./service";

const boardSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    color: { type: "string" },
    tasksCount: { type: "number" },
    totalHours: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

function getBoardErrorStatus(error: Error) {
  if (error.message === "Board nao encontrado") {
    return 404;
  }

  return 400;
}

export async function boardsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/boards",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Boards"],
        description: "Criar novo board",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            description: { type: "string", maxLength: 1000, nullable: true },
            color: {
              type: "string",
              pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$",
            },
          },
        },
        response: {
          201: {
            description: "Board criado",
            ...boardSchema,
          },
          400: {
            description: "Erro de validacao",
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
        const data = createBoardSchema.parse(request.body);
        const board = await boardsService.create(request.user.userId, data);
        return reply.status(201).send(board);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/boards",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Boards"],
        description: "Listar todos os boards do usuario autenticado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de boards",
            type: "array",
            items: boardSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const boards = await boardsService.getAll(request.user.userId);
        return reply.send(boards);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/boards/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Boards"],
        description: "Buscar board por ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Detalhes do board",
            ...boardSchema,
          },
          404: {
            description: "Board nao encontrado",
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
        const { id } = boardIdParamSchema.parse(request.params);
        const board = await boardsService.getById(request.user.userId, id);
        return reply.send(board);
      } catch (error: any) {
        const status = getBoardErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.put(
    "/boards/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Boards"],
        description: "Atualizar board por ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            description: { type: "string", maxLength: 1000, nullable: true },
            color: {
              type: "string",
              pattern: "^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$",
            },
          },
        },
        response: {
          200: {
            description: "Board atualizado",
            ...boardSchema,
          },
          404: {
            description: "Board nao encontrado",
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
        const { id } = boardIdParamSchema.parse(request.params);
        const data = updateBoardSchema.parse(request.body);
        const board = await boardsService.update(request.user.userId, id, data);
        return reply.send(board);
      } catch (error: any) {
        const status = getBoardErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.delete(
    "/boards/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Boards"],
        description: "Excluir board por ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            description: "Board excluido",
            type: "null",
          },
          404: {
            description: "Board nao encontrado",
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
        const { id } = boardIdParamSchema.parse(request.params);
        await boardsService.delete(request.user.userId, id);
        return reply.status(204).send();
      } catch (error: any) {
        const status = getBoardErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );
}
