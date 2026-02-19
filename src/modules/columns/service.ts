import prisma from "../../shared/db/prisma";
import { toSlug } from "../../shared/utils/slug";
import { CreateColumnInput, UpdateColumnInput } from "./schemas";

type ColumnWithRelations = {
  id: string;
  userId: string;
  boardId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  board: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    tasks: number;
  };
};

function mapColumn(column: ColumnWithRelations) {
  return {
    id: column.id,
    userId: column.userId,
    boardId: column.boardId,
    name: column.name,
    slug: column.slug,
    createdAt: column.createdAt,
    updatedAt: column.updatedAt,
    tasksCount: column._count.tasks,
    board: column.board,
  };
}

export class ColumnsService {
  private async ensureBoard(userId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId,
      },
    });

    if (!board) {
      throw new Error("Board nao encontrado");
    }
  }

  private async generateUniqueSlug(
    userId: string,
    name: string,
    columnIdToIgnore?: string,
  ) {
    const baseSlug = toSlug(name) || "coluna";
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existingColumn = await prisma.column.findFirst({
        where: {
          userId,
          slug,
          ...(columnIdToIgnore
            ? {
                id: {
                  not: columnIdToIgnore,
                },
              }
            : {}),
        },
      });

      if (!existingColumn) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  async create(userId: string, data: CreateColumnInput) {
    await this.ensureBoard(userId, data.boardId);
    const slug = await this.generateUniqueSlug(userId, data.name);

    const column = await prisma.column.create({
      data: {
        userId,
        boardId: data.boardId,
        name: data.name,
        slug,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return mapColumn(column);
  }

  async getAll(userId: string) {
    const columns = await prisma.column.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return columns.map(mapColumn);
  }

  async getById(userId: string, columnId: string) {
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        userId,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!column) {
      throw new Error("Column nao encontrada");
    }

    return mapColumn(column);
  }

  async getBySlug(userId: string, slug: string) {
    const column = await prisma.column.findFirst({
      where: {
        slug,
        userId,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!column) {
      throw new Error("Column nao encontrada");
    }

    return mapColumn(column);
  }

  async update(userId: string, columnId: string, data: UpdateColumnInput) {
    const existingColumn = await prisma.column.findFirst({
      where: {
        id: columnId,
        userId,
      },
    });

    if (!existingColumn) {
      throw new Error("Column nao encontrada");
    }

    if (data.boardId !== undefined) {
      await this.ensureBoard(userId, data.boardId);
    }

    const updateData: {
      boardId?: string;
      name?: string;
      slug?: string;
    } = {};

    if (data.boardId !== undefined) {
      updateData.boardId = data.boardId;
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = await this.generateUniqueSlug(
        userId,
        data.name,
        existingColumn.id,
      );
    }

    const column = await prisma.column.update({
      where: { id: columnId },
      data: updateData,
      include: {
        board: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return mapColumn(column);
  }

  async delete(userId: string, columnId: string) {
    const deleted = await prisma.column.deleteMany({
      where: {
        id: columnId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("Column nao encontrada");
    }
  }
}

export const columnsService = new ColumnsService();
