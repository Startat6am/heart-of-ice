"use client";

import Link from "next/link";
import { useGame } from "../game-state";

export default function Chapters() {
  const { state } = useGame();
  return (
    <main className="shell">
      <Link className="back" href="/">← Меню</Link>
      <p className="eyebrow">ADVENTURE</p>
      <h1>Текущее путешествие</h1>
      <p className="lead">Оглавление больше не управляет игрой. Переходы находятся прямо в тексте, а здесь можно продолжить с сохранённой главы.</p>
      <div className="actions">
        <Link href={`/read/${state.currentChapter}`}>Продолжить с главы {state.currentChapter}</Link>
        <Link className="secondary" href="/status">Вещи и навыки</Link>
      </div>
    </main>
  );
}
