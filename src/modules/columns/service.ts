import prisma from "../../shared/db/prisma";
import { toSlug } from "../../shared/utils/slug";
import {
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
} from "./schemas";

type ColumnWithRelations = {
  id: string;
  userId: string;
  boardId: string;
  name: string;
  slug: string;
  color: string;
  position: number;
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
    color: column.color,
    position: column.position,
    createdAt: column.createdAt,
    updatedAt: column.updatedAt,
    tasksCount: column._count.tasks,
    board: column.board,
  };
}

export class ColumnsService {
  private async getNextPositionForBoard(userId: string, boardId: string) {
    const result = await prisma.column.aggregate({
      where: {
        userId,
        boardId,
      },
      _max: {
        position: true,
      },
    });

    return (result._max.position ?? 0) + 1;
  }

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
    const position = await this.getNextPositionForBoard(userId, data.boardId);

    const column = await prisma.column.create({
      data: {
        userId,
        boardId: data.boardId,
        name: data.name,
        slug,
        color: data.color,
        position,
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
      orderBy: [{ boardId: "asc" }, { position: "asc" }, { createdAt: "asc" }],
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

  async getAllByBoard(userId: string, boardId: string) {
    await this.ensureBoard(userId, boardId);

    const columns = await prisma.column.findMany({
      where: {
        userId,
        boardId,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
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
      color?: string;
      position?: number;
    } = {};

    if (data.boardId !== undefined) {
      updateData.boardId = data.boardId;

      if (data.boardId !== existingColumn.boardId) {
        updateData.position = await this.getNextPositionForBoard(
          userId,
          data.boardId,
        );
      }
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = await this.generateUniqueSlug(
        userId,
        data.name,
        existingColumn.id,
      );
    }

    if (data.color !== undefined) {
      updateData.color = data.color;
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

  async reorderByBoard(
    userId: string,
    boardId: string,
    data: ReorderColumnsInput,
  ) {
    await this.ensureBoard(userId, boardId);

    const allColumns = await prisma.column.findMany({
      where: {
        userId,
        boardId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(allColumns.map(column => column.id));
    const requestedIds = data.columnIds;

    if (
      requestedIds.length !== allColumns.length ||
      requestedIds.some(id => !existingIds.has(id))
    ) {
      throw new Error("Lista de colunas invalida para reordenacao");
    }

    await prisma.$transaction(
      requestedIds.map((columnId, index) =>
        prisma.column.update({
          where: { id: columnId },
          data: {
            position: index + 1,
          },
        }),
      ),
    );

    return this.getAllByBoard(userId, boardId);
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
