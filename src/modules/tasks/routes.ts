import { FastifyInstance } from "fastify";
import { authGuard } from "../../shared/middleware/auth";
import { taskIdParamSchema, updateTaskSchema } from "./schemas";
import { tasksService } from "./service";

const taskSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    boardId: { type: "string", format: "uuid" },
    title: { type: "string" },
    description: { type: "string", nullable: true },
    status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
    dueDate: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    board: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
      },
    },
  },
};

function getTaskErrorStatus(error: Error) {
  if (
    error.message === "Task nao encontrada" ||
    error.message === "Board nao encontrado"
  ) {
    return 404;
  }

  return 400;
}

export async function tasksRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/tasks",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Tasks"],
        description: "Listar todas as tasks do usuario autenticado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de tasks",
            type: "array",
            items: taskSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const tasks = await tasksService.getAll(request.user.userId);
        return reply.send(tasks);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.get(
    "/tasks/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Tasks"],
        description: "Buscar task por ID",
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
            description: "Detalhes da task",
            ...taskSchema,
          },
          404: {
            description: "Task nao encontrada",
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
        const { id } = taskIdParamSchema.parse(request.params);
        const task = await tasksService.getById(request.user.userId, id);
        return reply.send(task);
      } catch (error: any) {
        const status = getTaskErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.put(
    "/tasks/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Tasks"],
        description: "Atualizar task por ID",
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
            title: { type: "string", minLength: 1, maxLength: 200 },
            description: { type: "string", maxLength: 2000, nullable: true },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
            dueDate: { type: "string", format: "date-time", nullable: true },
          },
        },
        response: {
          200: {
            description: "Task atualizada",
            ...taskSchema,
          },
          404: {
            description: "Task ou board nao encontrado",
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
        const { id } = taskIdParamSchema.parse(request.params);
        const data = updateTaskSchema.parse(request.body);
        const task = await tasksService.update(request.user.userId, id, data);
        return reply.send(task);
      } catch (error: any) {
        const status = getTaskErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );

  fastify.delete(
    "/tasks/:id",
    {
      onRequest: [authGuard],
      schema: {
        tags: ["Tasks"],
        description: "Excluir task por ID",
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
            description: "Task excluida",
            type: "null",
          },
          404: {
            description: "Task nao encontrada",
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
        const { id } = taskIdParamSchema.parse(request.params);
        await tasksService.delete(request.user.userId, id);
        return reply.status(204).send();
      } catch (error: any) {
        const status = getTaskErrorStatus(error);
        return reply.status(status).send({ error: error.message });
      }
    },
  );
}
