import prisma from "../../shared/db/prisma";
import { UpdateBoardInput } from "./schemas";

export class BoardsService {
  async getAll(userId: string) {
    return prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(userId: string, boardId: string) {
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

  async update(userId: string, boardId: string, data: UpdateBoardInput) {
    await this.getById(userId, boardId);

    const updateData: {
      name?: string;
      description?: string | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updateData.description = data.description ?? null;
    }

    return prisma.board.update({
      where: { id: boardId },
      data: updateData,
    });
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
