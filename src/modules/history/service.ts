import prisma from "../../shared/db/prisma";
import { SessionType, SessionStatus } from "@prisma/client";

export class HistoryService {
  async getHistory(userId: string, from?: string, to?: string) {
    const where: any = { userId };

    if (from || to) {
      where.startedAt = {};
      if (from) {
        where.startedAt.gte = new Date(from);
      }
      if (to) {
        where.startedAt.lte = new Date(to);
      }
    }

    const sessions = await prisma.pomodoroSession.findMany({
      where,
      orderBy: {
        startedAt: "desc",
      },
    });

    return sessions;
  }

  async getSummary(userId: string, from?: string, to?: string) {
    const where: any = { userId };

    if (from || to) {
      where.startedAt = {};
      if (from) {
        where.startedAt.gte = new Date(from);
      }
      if (to) {
        where.startedAt.lte = new Date(to);
      }
    }

    const sessions = await prisma.pomodoroSession.findMany({
      where,
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      s => s.status === SessionStatus.COMPLETED,
    ).length;

    const focusSessions = sessions.filter(s => s.type === SessionType.FOCUS);
    const completedFocusSessions = focusSessions.filter(
      s => s.status === SessionStatus.COMPLETED,
    );

    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actualDurationSeconds || 0) / 60,
      0,
    );

    const totalBreakMinutes = sessions
      .filter(
        s =>
          s.type === SessionType.SHORT_BREAK ||
          s.type === SessionType.LONG_BREAK,
      )
      .reduce((sum, s) => sum + (s.actualDurationSeconds || 0) / 60, 0);

    const averageFocusMinutes =
      completedFocusSessions.length > 0
        ? totalFocusMinutes / completedFocusSessions.length
        : 0;

    const streak = this.calculateStreak(sessions);

    return {
      totalSessions,
      completedSessions,
      canceledSessions: sessions.filter(
        s => s.status === SessionStatus.CANCELED,
      ).length,
      totalFocusSessions: focusSessions.length,
      completedFocusSessions: completedFocusSessions.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalBreakMinutes: Math.round(totalBreakMinutes),
      averageFocusMinutes: Math.round(averageFocusMinutes * 10) / 10,
      streak,
    };
  }

  private calculateStreak(sessions: any[]): number {
    const completedFocus = sessions
      .filter(
        s =>
          s.type === SessionType.FOCUS && s.status === SessionStatus.COMPLETED,
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    if (completedFocus.length === 0) {
      return 0;
    }

    const daysSeen = new Set<string>();
    for (const session of completedFocus) {
      const day = session.startedAt.toISOString().split("T")[0];
      daysSeen.add(day);
    }

    const sortedDays = Array.from(daysSeen).sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let currentDate = new Date();

    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDay = currentDate.toISOString().split("T")[0];

      if (sortedDays[i] === expectedDay) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0 && sortedDays[i] !== today) {
        break;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const historyService = new HistoryService();
