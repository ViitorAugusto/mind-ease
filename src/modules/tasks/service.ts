import { Prisma, TaskStatus } from "@prisma/client";
import prisma from "../../shared/db/prisma";
import { CreateTaskInput, UpdateTaskInput, UpdateTaskTimerInput } from "./schemas";

export class TasksService {
  private async findColumn(
    userId: string,
    columnId: string,
    boardId?: string,
  ) {
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        userId,
        ...(boardId ? { boardId } : {}),
      },
    });

    if (!column) {
      throw new Error("Column nao encontrada");
    }

    return column;
  }

  private async findBoard(userId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId,
      },
    });

    if (!board) {
      throw new Error("Board nao encontrado");
    }

    return board;
  }

  async create(userId: string, data: CreateTaskInput) {
    await this.findBoard(userId, data.boardId);
    await this.findColumn(userId, data.columnId, data.boardId);

    const createData: Prisma.TaskUncheckedCreateInput = {
      userId,
      boardId: data.boardId,
      columnId: data.columnId,
      title: data.title,
      description: data.description ?? null,
      checklist: (data.checklist ?? []) as Prisma.InputJsonValue,
      enableSoundAlerts: data.enableSoundAlerts ?? false,
      isConcluded: data.isConcluded ?? false,
      status: (data.status as TaskStatus | undefined) ?? TaskStatus.TODO,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      hours: data.hours ?? 0,
      focusMinutes: data.focusMinutes ?? 25,
      shortBreakMinutes: data.shortBreakMinutes ?? 5,
      longBreakMinutes: data.longBreakMinutes ?? 15,
      longBreakEvery: data.longBreakEvery ?? 4,
    };

    return prisma.task.create({
      data: createData,
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

  async getAllByBoardAndColumn(
    userId: string,
    boardId: string,
    columnId: string,
  ) {
    await this.findBoard(userId, boardId);
    await this.findColumn(userId, columnId, boardId);

    return prisma.task.findMany({
      where: {
        userId,
        boardId,
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
    const existing = await this.getById(userId, taskId);
    const nextBoardId = data.boardId ?? existing.boardId;
    const nextColumnId = data.columnId ?? existing.columnId;

    if (data.boardId !== undefined) {
      await this.findBoard(userId, nextBoardId);
    }

    if (data.columnId !== undefined || data.boardId !== undefined) {
      await this.findColumn(userId, nextColumnId, nextBoardId);
    }

    const updateData: {
      boardId?: string;
      columnId?: string;
      title?: string;
      description?: string | null;
      checklist?: Prisma.InputJsonValue;
      enableSoundAlerts?: boolean;
      isConcluded?: boolean;
      status?: TaskStatus;
      dueDate?: Date | null;
      hours?: number;
      focusMinutes?: number;
      shortBreakMinutes?: number;
      longBreakMinutes?: number;
      longBreakEvery?: number;
    } = {};

    if (data.boardId !== undefined) {
      updateData.boardId = data.boardId;
    }

    if (data.columnId !== undefined) {
      updateData.columnId = data.columnId;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null;
    }

    if (data.checklist !== undefined) {
      updateData.checklist = data.checklist as Prisma.InputJsonValue;
    }

    if (data.enableSoundAlerts !== undefined) {
      updateData.enableSoundAlerts = data.enableSoundAlerts;
    }

    if (data.isConcluded !== undefined) {
      updateData.isConcluded = data.isConcluded;
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

    if (data.focusMinutes !== undefined) {
      updateData.focusMinutes = data.focusMinutes;
    }

    if (data.shortBreakMinutes !== undefined) {
      updateData.shortBreakMinutes = data.shortBreakMinutes;
    }

    if (data.longBreakMinutes !== undefined) {
      updateData.longBreakMinutes = data.longBreakMinutes;
    }

    if (data.longBreakEvery !== undefined) {
      updateData.longBreakEvery = data.longBreakEvery;
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

  async updateTimer(userId: string, taskId: string, data: UpdateTaskTimerInput) {
    await this.getById(userId, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data,
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
