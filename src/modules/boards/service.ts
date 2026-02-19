import prisma from "../../shared/db/prisma";
import { CreateBoardInput, UpdateBoardInput } from "./schemas";

type BoardWithMetrics = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  tasksCount: number;
  totalHours: number;
};

function mapBoardWithMetrics(board: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  columns: Array<{ tasks: Array<{ hours: number }> }>;
}): BoardWithMetrics {
  let tasksCount = 0;
  let totalHours = 0;

  for (const column of board.columns) {
    tasksCount += column.tasks.length;
    for (const task of column.tasks) {
      totalHours += task.hours;
    }
  }

  return {
    id: board.id,
    userId: board.userId,
    name: board.name,
    description: board.description,
    color: board.color,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    tasksCount,
    totalHours,
  };
}

export class BoardsService {
  async create(userId: string, data: CreateBoardInput) {
    const board = await prisma.board.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
        color: data.color,
      },
      include: {
        columns: {
          select: {
            tasks: {
              select: {
                hours: true,
              },
            },
          },
        },
      },
    });

    return mapBoardWithMetrics(board);
  }

  async getAll(userId: string) {
    const boards = await prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        columns: {
          select: {
            tasks: {
              select: {
                hours: true,
              },
            },
          },
        },
      },
    });

    return boards.map(mapBoardWithMetrics);
  }

  async getById(userId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId,
      },
      include: {
        columns: {
          select: {
            tasks: {
              select: {
                hours: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new Error("Board nao encontrado");
    }

    return mapBoardWithMetrics(board);
  }

  async update(userId: string, boardId: string, data: UpdateBoardInput) {
    await this.getById(userId, boardId);

    const updateData: {
      name?: string;
      description?: string | null;
      color?: string;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null;
    }

    if (data.color !== undefined) {
      updateData.color = data.color;
    }

    const board = await prisma.board.update({
      where: { id: boardId },
      data: updateData,
      include: {
        columns: {
          select: {
            tasks: {
              select: {
                hours: true,
              },
            },
          },
        },
      },
    });

    return mapBoardWithMetrics(board);
  }

  async delete(userId: string, boardId: string) {
    const deleted = await prisma.board.deleteMany({
      where: {
        id: boardId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("Board nao encontrado");
    }
  }
}

export const boardsService = new BoardsService();
