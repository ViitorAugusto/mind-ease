import { TaskStatus } from "@prisma/client";
import prisma from "../../shared/db/prisma";
import { UpdateTaskInput } from "./schemas";

export class TasksService {
  async getAll(userId: string) {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getById(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error("Task nao encontrada");
    }

    return task;
  }

  async update(userId: string, taskId: string, data: UpdateTaskInput) {
    await this.getById(userId, taskId);

    if (data.boardId) {
      const board = await prisma.board.findFirst({
        where: {
          id: data.boardId,
          userId,
        },
      });

      if (!board) {
        throw new Error("Board nao encontrado");
      }
    }

    const updateData: {
      boardId?: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      dueDate?: Date | null;
    } = {};

    if (data.boardId !== undefined) {
      updateData.boardId = data.boardId;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status as TaskStatus;
    }

    if (Object.prototype.hasOwnProperty.call(data, "dueDate")) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(userId: string, taskId: string) {
    const deleted = await prisma.task.deleteMany({
      where: {
        id: taskId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("Task nao encontrada");
    }
  }
}

export const tasksService = new TasksService();
