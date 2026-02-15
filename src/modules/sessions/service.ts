import prisma from "../../shared/db/prisma";
import { SessionType, SessionStatus } from "@prisma/client";
import { StartSessionInput, FinishSessionInput } from "./schemas";

export class SessionsService {
  async startSession(userId: string, data: StartSessionInput) {
    const activeSession = await prisma.pomodoroSession.findFirst({
      where: {
        userId,
        endedAt: null,
      },
    });

    if (activeSession) {
      throw new Error(
        "Voce ja possui uma sessao ativa. Finalize-a antes de iniciar outra.",
      );
    }

    const settings = await prisma.pomodoroSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      throw new Error("Configuracoes nao encontradas");
    }

    let plannedDurationSeconds: number;
    switch (data.type) {
      case "FOCUS":
        plannedDurationSeconds = settings.focusMinutes * 60;
        break;
      case "SHORT_BREAK":
        plannedDurationSeconds = settings.shortBreakMinutes * 60;
        break;
      case "LONG_BREAK":
        plannedDurationSeconds = settings.longBreakMinutes * 60;
        break;
      default:
        throw new Error("Tipo de sessao invalido");
    }

    const session = await prisma.pomodoroSession.create({
      data: {
        userId,
        taskId: data.taskId,
        type: data.type as SessionType,
        status: SessionStatus.COMPLETED,
        startedAt: new Date(),
        plannedDurationSeconds,
      },
    });

    return session;
  }

  async finishSession(
    userId: string,
    sessionId: string,
    data: FinishSessionInput,
  ) {
    const session = await prisma.pomodoroSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error("Sessao nao encontrada");
    }

    if (session.endedAt) {
      throw new Error("Sessao ja finalizada");
    }

    const endedAt = data.endedAt ? new Date(data.endedAt) : new Date();
    const actualDurationSeconds = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000,
    );

    const updatedSession = await prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: {
        status: data.status as SessionStatus,
        endedAt,
        actualDurationSeconds,
      },
    });

    return updatedSession;
  }

  async getActiveSession(userId: string) {
    const session = await prisma.pomodoroSession.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!session) {
      return null;
    }

    const elapsed = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );
    const remaining = Math.max(0, session.plannedDurationSeconds - elapsed);

    return {
      ...session,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
    };
  }
}

export const sessionsService = new SessionsService();
