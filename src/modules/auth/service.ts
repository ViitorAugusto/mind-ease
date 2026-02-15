import prisma from "../../shared/db/prisma";
import { hashPassword, comparePassword } from "../../shared/utils/password";
import { getExpirationDate } from "../../shared/utils/time";
import { config } from "../../shared/config";
import { RegisterInput, LoginInput } from "./schemas";
import crypto from "crypto";

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Usuario ja existe");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        settings: {
          create: {
            focusMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            longBreakEvery: 4,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Credenciais invalidas");
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new Error("Credenciais invalidas");
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: getExpirationDate(config.jwt.refreshExpiresIn),
      },
    });

    return token;
  }

  async validateRefreshToken(token: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new Error("Refresh token invalido");
    }

    if (refreshToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      throw new Error("Refresh token expirado");
    }

    return {
      userId: refreshToken.user.id,
      email: refreshToken.user.email,
      name: refreshToken.user.name,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("Usuario nao encontrado");
    }

    return user;
  }
}

export const authService = new AuthService();
