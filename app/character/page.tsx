"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../game-state";

const skills = ["Ловкость","Рукопашный бой","Хитрость","Кибернетика","ПСИ","Знания","Управление парадоксом","Пилотирование","Воровство","Стрельба","Знание улиц","Выживание"];

const presets = [
  ["Исследователь",["Рукопашный бой","Знания","Знание улиц","Выживание"],11,20,[]],
  ["Охотник за головами",["Хитрость","Пилотирование","Стрельба","Знание улиц"],10,40,["Бризальный пистолет (6 зарядов)"]],
  ["Шпион",["Ловкость","Кибернетика","Воровство","Знание улиц"],10,30,[]],
  ["Торговец",["ПСИ","Знания","Стрельба","Знание улиц"],10,35,["Бризальный пистолет (6 зарядов)","пси-фокусировщик"]],
  ["Провидец",["Рукопашный бой","Хитрость","ПСИ","Управление парадоксом"],10,30,["пси-фокусировщик"]],
  ["Учёный",["Кибернетика","Знания","Пилотирование","Выживание"],10,30,[]],
  ["Мутант",["Ловкость","Хитрость","Управление парадоксом","Воровство"],10,30,["пси-фокусировщик"]]
] as const;

export default function CharacterPage() {
  const router = useRouter();
  const { newGame, setCharacter } = useGame();
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState<string[]>([]);

  const start = () => {
    const p = presets.find(x => x[0] === selected);
    if (p) {
      newGame();
      setCharacter({ archetype: p[0], lifePoints: p[2], money: p[3] }, [...p[1]], [...p[4]]);
      router.push("/read/1");
      return;
    }
    if (selected === "Свой персонаж" && custom.length === 4) {
      const items: string[] = [];
      if (custom.includes("Стрельба")) items.push("Бризальный пистолет (6 зарядов)");
      if (custom.includes("ПСИ") || custom.includes("Управление парадоксом")) items.push("пси-фокусировщик");
      newGame();
      setCharacter({ archetype: "Свой персонаж", lifePoints: 10, money: 30 }, [...custom], items);
      router.push("/read/1");
    }
  };

  return <main className="shell character">
    <Link className="back" href="/">← Меню</Link>
    <p className="eyebrow">ADVENTURE SHEET</p>
    <h1>Создайте героя</h1>
    <p className="lead">Выберите готовый образ или соберите своего героя из четырёх навыков. Стартовые жизненные очки и деньги сохраняются вместе с игрой.</p>
    <div className="preset-grid">
      {presets.map(p => <button type="button" key={p[0]} className={selected===p[0] ? "character-card selected" : "character-card"} onClick={() => setSelected(p[0])}>
        <strong>{p[0]}</strong><span>{p[1].join(" · ")}</span><small>{p[2]} ЖО · {p[3]} скэдов{p[4].length ? " · "+p[4].join(", ") : ""}</small>
      </button>)}
      <button type="button" className={selected==="Свой персонаж" ? "character-card selected" : "character-card"} onClick={() => setSelected("Свой персонаж")}>
        <strong>Свой персонаж</strong><span>Любые 4 навыка</span><small>10 ЖО · 30 скэдов</small>
      </button>
    </div>
    {selected==="Свой персонаж" && <section className="skill-picker"><h2>Выберите четыре навыка</h2><p className="muted">{custom.length}/4</p><div className="skill-grid">{skills.map(s => <button type="button" key={s} className={custom.includes(s)?"chip active":"chip"} disabled={!custom.includes(s)&&custom.length>=4} onClick={() => setCustom(x => x.includes(s)?x.filter(y=>y!==s):[...x,s])}>{s}</button>)}</div></section>}
    <button type="button" className="start-game" disabled={!presets.some(x=>x[0]===selected)&&custom.length!==4} onClick={start}>Начать приключение →</button>
  </main>;
}
