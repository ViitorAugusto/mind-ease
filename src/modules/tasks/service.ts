import { TaskStatus } from "@prisma/client";
import prisma from "../../shared/db/prisma";
import { CreateTaskInput, UpdateTaskInput } from "./schemas";

export class TasksService {
  private async findColumn(userId: string, columnId: string) {
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        userId,
      },
    });

    if (!column) {
      throw new Error("Column nao encontrada");
    }

    return column;
  }

  async create(userId: string, data: CreateTaskInput) {
    await this.findColumn(userId, data.columnId);

    return prisma.task.create({
      data: {
        userId,
        columnId: data.columnId,
        title: data.title,
        description: data.description ?? null,
        status: (data.status as TaskStatus | undefined) ?? TaskStatus.TODO,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        hours: data.hours ?? 0,
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            slug: true,
            board: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async getAll(userId: string) {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            slug: true,
            board: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllByColumn(userId: string, columnId: string) {
    await this.findColumn(userId, columnId);

    return prisma.task.findMany({
      where: {
        userId,
        columnId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            slug: true,
            board: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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
        column: {
          select: {
            id: true,
            name: true,
            slug: true,
            board: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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

    if (data.columnId) {
      await this.findColumn(userId, data.columnId);
    }

    const updateData: {
      columnId?: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      dueDate?: Date | null;
      hours?: number;
    } = {};

    if (data.columnId !== undefined) {
      updateData.columnId = data.columnId;
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

    if (data.hours !== undefined) {
      updateData.hours = data.hours;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        column: {
          select: {
            id: true,
            name: true,
            slug: true,
            board: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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
