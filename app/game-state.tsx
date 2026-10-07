"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type GameState = {
  currentChapter: number;
  skills: string[];
  items: string[];
  updatedAt: string;
};

const STORAGE_KEY = "heart-of-ice-save-v2";
const defaultState: GameState = { currentChapter: 1, skills: [], items: [], updatedAt: new Date(0).toISOString() };

type GameContextValue = {
  state: GameState;
  ready: boolean;
  hasSave: boolean;
  setChapter: (chapter: number) => void;
  toggleSkill: (skill: string) => void;
  toggleItem: (item: string) => void;
  addSkill: (skill: string) => void;
  addItem: (item: string) => void;
  newGame: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

function readSave(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as GameState : null;
  } catch { return null; }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [ready, setReady] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    const saved = readSave();
    if (saved) { setState(saved); setHasSave(true); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setHasSave(true);
  }, [state, ready]);

  const touch = (patch: Partial<GameState>) =>
    setState(prev => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));

  const value = useMemo<GameContextValue>(() => ({
    state, ready, hasSave,
    setChapter: chapter => touch({ currentChapter: chapter }),
    toggleSkill: skill => setState(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(x => x !== skill) : [...prev.skills, skill],
      updatedAt: new Date().toISOString(),
    })),
    toggleItem: item => setState(prev => ({
      ...prev,
      items: prev.items.includes(item) ? prev.items.filter(x => x !== item) : [...prev.items, item],
      updatedAt: new Date().toISOString(),
    })),
    addSkill: skill => setState(prev => {
      const value = skill.trim();
      return !value || prev.skills.includes(value) ? prev : { ...prev, skills: [...prev.skills, value], updatedAt: new Date().toISOString() };
    }),
    addItem: item => setState(prev => {
      const value = item.trim();
      return !value || prev.items.includes(value) ? prev : { ...prev, items: [...prev.items, value], updatedAt: new Date().toISOString() };
    }),
    newGame: () => {
      const fresh = { ...defaultState, updatedAt: new Date().toISOString() };
      setState(fresh);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setHasSave(true);
    },
  }), [state, ready, hasSave]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used inside GameProvider");
  return context;
}
