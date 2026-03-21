import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InventoryItem {
  name: string;
  description: string;
}

export interface GameState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  backstory: string;
  inventory: InventoryItem[];
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
  pendingParsed: any | null;
  addMessage: (msg: { role: 'user' | 'model'; content: string; parsed?: any }) => void;
  setChoices: (choices: { text: string; attribute: string; dc?: string }[]) => void;
  addSystemMemory: (mems: string[]) => void;
  addCombatLog: (logs: string[]) => void;
  updateState: (updates: Partial<GameState>) => void;
  setRolling: (rolling: boolean) => void;
  setPendingParsed: (parsed: any | null) => void;
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
  inventory: [],
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
  pendingParsed: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,
      addMessage: (msg) => set((state) => {
        const lastMsg = state.messages[state.messages.length - 1];
        if (lastMsg && lastMsg.role === msg.role && lastMsg.content === msg.content) {
          return state;
        }
        return { messages: [...state.messages, msg] };
      }),
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
      setPendingParsed: (parsed) => set({ pendingParsed: parsed }),
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
