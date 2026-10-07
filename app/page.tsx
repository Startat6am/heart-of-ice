"use client";

import Link from "next/link";
import { useGame } from "./game-state";

export default function Home() {
  const { state, ready, hasSave } = useGame();
  if (!ready) return <main className="shell"><p className="placeholder">Загрузка…</p></main>;
  return <main className="shell home">
    <p className="eyebrow">HEART OF ICE</p>
    <h1>Сердце льда</h1>
    <p className="lead">Интерактивное приключение: создайте героя, принимайте решения и используйте навыки и вещи.</p>
    <div className="actions">
      <Link href="/character">Новая игра</Link>
      {hasSave && state.character && <Link className="secondary" href={`/read/${state.currentChapter}`}>Продолжить · глава {state.currentChapter}</Link>}
      <Link className="secondary" href="/status">Персонаж · вещи · навыки</Link>
    </div>
  </main>;
}
