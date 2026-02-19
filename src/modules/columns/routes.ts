import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth";
import {
  columnIdParamSchema,
  columnSlugParamSchema,
  createColumnSchema,
  updateColumnSchema,
} from "./schemas";
import { columnsService } from "./service";

const columnSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    boardId: { type: "string", format: "uuid" },
    name: { type: "string" },
    slug: { type: "string" },
    tasksCount: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    board: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        color: { type: "string" },
      },
    },
  },
};

function getColumnErrorStatus(error: Error) {
  if (
    error.message === "Column nao encontrada" ||
    error.message === "Board nao encontrado"
  ) {
    return 404;
  }

  return 400;
}

export async function columnsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/columns",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Criar nova coluna",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["boardId", "name"],
          properties: {
            boardId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 1, maxLength: 120 },
          },
        },
        response: {
          201: {
            description: "Coluna criada",
            ...columnSchema,
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
        const data = createColumnSchema.parse(request.body);
        const column = await columnsService.create(request.user.userId, data);
        return reply.status(201).send(column);
      } catch (error: any) {
        const status = getColumnErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/columns",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Listar todas as colunas do usuario autenticado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de colunas",
            type: "array",
            items: columnSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const columns = await columnsService.getAll(request.user.userId);
        return reply.send(columns);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/columns/slug/:slug",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Buscar coluna por slug",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Detalhes da coluna",
            ...columnSchema,
          },
          404: {
            description: "Coluna nao encontrada",
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
        const { slug } = columnSlugParamSchema.parse(request.params);
        const column = await columnsService.getBySlug(request.user.userId, slug);
        return reply.send(column);
      } catch (error: any) {
        const status = getColumnErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/columns/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Buscar coluna por ID",
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
            description: "Detalhes da coluna",
            ...columnSchema,
          },
          404: {
            description: "Coluna nao encontrada",
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
        const { id } = columnIdParamSchema.parse(request.params);
        const column = await columnsService.getById(request.user.userId, id);
        return reply.send(column);
      } catch (error: any) {
        const status = getColumnErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.put(
    "/columns/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Atualizar coluna por ID",
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
            boardId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 1, maxLength: 120 },
          },
        },
        response: {
          200: {
            description: "Coluna atualizada",
            ...columnSchema,
          },
          404: {
            description: "Coluna ou board nao encontrado",
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
        const { id } = columnIdParamSchema.parse(request.params);
        const data = updateColumnSchema.parse(request.body);
        const column = await columnsService.update(request.user.userId, id, data);
        return reply.send(column);
      } catch (error: any) {
        const status = getColumnErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.delete(
    "/columns/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Columns"],
        description: "Excluir coluna por ID",
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
            description: "Coluna excluida",
            type: "null",
          },
          404: {
            description: "Coluna nao encontrada",
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
        const { id } = columnIdParamSchema.parse(request.params);
        await columnsService.delete(request.user.userId, id);
        return reply.status(204).send();
      } catch (error: any) {
        const status = getColumnErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );
}
