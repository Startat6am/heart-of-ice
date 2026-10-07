"use client";

import Link from "next/link";
import { useGame } from "./game-state";

export default function Home() {
  const { state, ready, hasSave, newGame } = useGame();

  if (!ready) return <main className="shell"><p className="placeholder">Загрузка…</p></main>;

  return (
    <main className="shell home">
      <p className="eyebrow">HEART OF ICE</p>
      <h1>Сердце льда</h1>
      <p className="lead">Интерактивное чтение: переходите по номерам глав, используйте навыки и вещи и возвращайтесь к сохранённому месту.</p>
      <div className="actions">
        <Link href="/read/1" onClick={newGame}>Новая игра</Link>
        {hasSave && <Link className="secondary" href={`/read/${state.currentChapter}`}>Продолжить · глава {state.currentChapter}</Link>}
        <Link className="secondary" href="/status">Вещи и навыки</Link>
      </div>
    </main>
  );
}
