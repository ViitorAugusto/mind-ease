import prisma from "../../shared/db/prisma";
import { UpdateSettingsInput } from "./schemas";

export class PomodoroSettingsService {
  async getSettings(userId: string) {
    let settings = await prisma.pomodoroSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.pomodoroSettings.create({
        data: {
          userId,
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          longBreakEvery: 4,
        },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: UpdateSettingsInput) {
    const settings = await prisma.pomodoroSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        focusMinutes: data.focusMinutes ?? 25,
        shortBreakMinutes: data.shortBreakMinutes ?? 5,
        longBreakMinutes: data.longBreakMinutes ?? 15,
        longBreakEvery: data.longBreakEvery ?? 4,
      },
    });

    return settings;
  }
}

export const pomodoroSettingsService = new PomodoroSettingsService();
