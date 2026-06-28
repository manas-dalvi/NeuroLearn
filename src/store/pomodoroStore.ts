import { create } from "zustand";

interface PomodoroState {
  sessionMinutes: number;
  breakMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  cycleCount: number;
  setDurations: (session: number, brk: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  sessionMinutes: 25,
  breakMinutes: 5,
  secondsLeft: 25 * 60,
  isRunning: false,
  isBreak: false,
  cycleCount: 0,

  setDurations: (session, brk) =>
    set({
      sessionMinutes: session,
      breakMinutes: brk,
      secondsLeft: session * 60,
      isRunning: false,
      isBreak: false,
    }),

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),

  reset: () =>
    set((s) => ({
      secondsLeft: s.isBreak ? s.breakMinutes * 60 : s.sessionMinutes * 60,
      isRunning: false,
    })),

  tick: () =>
    set((s) => {
      if (s.secondsLeft <= 1) {
        const isBreak = !s.isBreak;
        return {
          isBreak,
          cycleCount: isBreak ? s.cycleCount : s.cycleCount + 1,
          secondsLeft: isBreak ? s.breakMinutes * 60 : s.sessionMinutes * 60,
          isRunning: true,
        };
      }
      return { secondsLeft: s.secondsLeft - 1 };
    }),
}));
