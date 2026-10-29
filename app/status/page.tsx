"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useGame } from "../game-state";

function AddRow({ label, onAdd }: { label: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (!value.trim()) return; onAdd(value); setValue(""); };
  return <form className="add-row" onSubmit={submit}><input value={value} onChange={e => setValue(e.target.value)} placeholder={label} aria-label={label} /><button type="submit">Добавить</button></form>;
}

export default function Status() {
  const { state, ready, toggleSkill, toggleItem, addSkill, addItem, setLifePoints } = useGame();
  if (!ready) return <main className="shell"><p className="placeholder">Загрузка сохранения…</p></main>;

  return <main className="shell">
    <Link className="back" href={`/read/${state.currentChapter}`}>← Вернуться к чтению</Link>
    <Link className="back" href="/chapters">☰ Оглавление</Link>
    <h1>Лист персонажа</h1>
    {state.character && <section className="status-section life-points-picker">
      <div className="life-points-row"><h2>ЖО</h2>
      <div className="life-points-controls">
        <button type="button" className="chip" aria-label="Уменьшить жизненные очки" disabled={state.character.lifePoints <= 0} onClick={() => setLifePoints(state.character!.lifePoints - 1)}>−</button>
        <strong aria-live="polite">{state.character.lifePoints}</strong>
        <button type="button" className="chip" aria-label="Увеличить жизненные очки" onClick={() => setLifePoints(state.character!.lifePoints + 1)}>+</button>
      </div></div>
    </section>}
    <section className="status-section">
      <div className="section-heading"><h2>Навыки</h2><span>{state.skills.length}</span></div>
      {state.skills.length ? <div className="chips">{state.skills.map(skill => <button className="chip active" key={skill} onClick={() => toggleSkill(skill)}>{skill} ×</button>)}</div> : null}
      <AddRow label="Новый навык" onAdd={addSkill} />
    </section>
    <section className="status-section">
      <div className="section-heading"><h2>Вещи</h2><span>{state.items.length}</span></div>
      {state.items.length ? <div className="chips">{state.items.map(item => <button className="chip active" key={item} onClick={() => toggleItem(item)}>{item} ×</button>)}</div> : null}
      <AddRow label="Новая вещь" onAdd={addItem} />
    </section>
  </main>;
}
