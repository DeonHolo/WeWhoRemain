import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  backstory: string;
  attributes: {
    Might: number;
    Agility: number;
    Fortitude: number;
    Intellect: number;
    Willpower: number;
    Presence: number;
  };
  systemMemory: string[];
  combatLog: string[];
  messages: { role: 'user' | 'model'; content: string; parsed?: any }[];
  currentChoices: { text: string; attribute: string; dc?: string }[];
  isRolling: boolean;
  hasStarted: boolean;
  addMessage: (msg: { role: 'user' | 'model'; content: string; parsed?: any }) => void;
  setChoices: (choices: { text: string; attribute: string; dc?: string }[]) => void;
  addSystemMemory: (mems: string[]) => void;
  addCombatLog: (logs: string[]) => void;
  updateState: (updates: Partial<GameState>) => void;
  setRolling: (rolling: boolean) => void;
  resetGame: () => void;
}

const initialState = {
  hp: 0,
  maxHp: 0,
  mana: 0,
  maxMana: 0,
  level: 1,
  xp: 0,
  backstory: '',
  attributes: {
    Might: 0,
    Agility: 0,
    Fortitude: 0,
    Intellect: 0,
    Willpower: 0,
    Presence: 0,
  },
  systemMemory: [],
  combatLog: [],
  messages: [],
  currentChoices: [],
  isRolling: false,
  hasStarted: false,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setChoices: (choices) => set({ currentChoices: choices }),
      addSystemMemory: (mems) => set((state) => ({ systemMemory: [...state.systemMemory, ...mems] })),
      addCombatLog: (logs) => set((state) => ({ combatLog: [...state.combatLog, ...logs] })),
      updateState: (updates) => set((state) => {
        const newState = { ...state, ...updates };
        const userMessageCount = state.messages.filter(m => m.role === 'user').length;
        if (userMessageCount >= 2) {
          newState.hasStarted = true;
        }
        return newState;
      }),
      setRolling: (rolling) => set({ isRolling: rolling }),
      resetGame: () => {
        localStorage.removeItem('game-storage');
        set(initialState);
      },
    }),
    {
      name: 'game-storage',
    }
  )
);
