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
  const { state, ready, toggleSkill, toggleItem, addSkill, addItem } = useGame();
  if (!ready) return <main className="shell"><p className="placeholder">Загрузка сохранения…</p></main>;

  return <main className="shell">
    <Link className="back" href={`/read/${state.currentChapter}`}>← Вернуться к чтению</Link>
    <p className="eyebrow">YOUR ADVENTURE</p><h1>Вещи и навыки</h1>
    <p className="lead">Текущее состояние героя. Условия переходов проверяют эти списки автоматически.</p>
    <section className="status-section">
      <div className="section-heading"><h2>Навыки</h2><span>{state.skills.length}</span></div>
      {state.skills.length ? <div className="chips">{state.skills.map(skill => <button className="chip active" key={skill} onClick={() => toggleSkill(skill)}>{skill} ×</button>)}</div> : <p className="muted">Пока нет навыков.</p>}
      <AddRow label="Новый навык" onAdd={addSkill} />
    </section>
    <section className="status-section">
      <div className="section-heading"><h2>Вещи</h2><span>{state.items.length}</span></div>
      {state.items.length ? <div className="chips">{state.items.map(item => <button className="chip active" key={item} onClick={() => toggleItem(item)}>{item} ×</button>)}</div> : <p className="muted">Пока нет вещей.</p>}
      <AddRow label="Новая вещь" onAdd={addItem} />
    </section>
    <section className="status-section"><h2>Как это работает</h2><p className="muted">Например, «если вы владеете Кибернетикой» откроет соответствующий переход только при наличии «Кибернетики» в навыках. Нажатие на активный предмет или навык убирает его.</p></section>
  </main>;
}
