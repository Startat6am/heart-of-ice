"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../game-state";

const skills = ["Ловкость","Ближний бой","Хитрость","Кибернетика","Эсп","Знания","Парадокс","Пилотирование","Воровство","Стрельба","Уличная жизнь","Выживание"];

const presets = [
  ["Исследователь",["Ближний бой","Знания","Уличная жизнь","Выживание"],11,20,[]],
  ["Охотник за головами",["Хитрость","Пилотирование","Стрельба","Уличная жизнь"],10,40,["Барысальский пистолет (6 зарядов)"]],
  ["Шпион",["Ловкость","Кибернетика","Воровство","Уличная жизнь"],10,30,[]],
  ["Торговец",["Эсп","Знания","Стрельба","Уличная жизнь"],10,35,["Барысальский пистолет (6 зарядов)","Псионический фокус"]],
  ["Провидец",["Ближний бой","Хитрость","Эсп","Парадокс"],10,30,["Псионический фокус"]],
  ["Учёный",["Кибернетика","Знания","Пилотирование","Выживание"],10,30,[]],
  ["Мутант",["Ловкость","Хитрость","Парадокс","Воровство"],10,30,["Псионический фокус"]]
] as const;

export default function CharacterPage() {
  const router = useRouter();
  const { newGame, addSkill, addItem } = useGame();
  const [selected, setSelected] = useState<string>("");
  const [custom, setCustom] = useState<string[]>([]);

  const start = () => {
    const p = presets.find(x => x[0] === selected);
    if (p) {
      newGame(); p[1].forEach(addSkill); p[4].forEach(addItem);
      router.push("/read/1");
      return;
    }
    if (selected === "Свой персонаж" && custom.length === 4) {
      const items = [];
      if (custom.includes("Стрельба")) items.push("Барысальский пистолет (6 зарядов)");
      if (custom.includes("Эсп") || custom.includes("Парадокс")) items.push("Псионический фокус");
      newGame(); custom.forEach(addSkill); items.forEach(addItem);
      router.push("/read/1");
    }
  };

  return <main className="shell character">
    <Link className="back" href="/">← Меню</Link>
    <p className="eyebrow">ADVENTURE SHEET</p>
    <h1>Создайте героя</h1>
    <p className="lead">В оригинальных правилах можно выбрать один из семи готовых образов или любые четыре навыка. Стартуют также жизненные очки, деньги и необходимое снаряжение.</p>
    <div className="preset-grid">
      {presets.map(p => <button key={p[0]} className={selected===p[0] ? "character-card selected" : "character-card"} onClick={() => setSelected(p[0])}>
        <strong>{p[0]}</strong><span>{p[1].join(" · ")}</span><small>{p[2]} ЖО · {p[3]} скэдов{p[4].length ? " · "+p[4].join(", ") : ""}</small>
      </button>)}
      <button className={selected==="Свой персонаж" ? "character-card selected" : "character-card"} onClick={() => setSelected("Свой персонаж")}>
        <strong>Свой персонаж</strong><span>Любые 4 навыка</span><small>10 ЖО · 30 скэдов · нужное снаряжение выдаётся автоматически</small>
      </button>
    </div>
    {selected==="Свой персонаж" && <section className="skill-picker"><h2>Выберите четыре навыка</h2><p className="muted">{custom.length}/4</p><div className="skill-grid">{skills.map(s => <button key={s} className={custom.includes(s)?"chip active":"chip"} disabled={!custom.includes(s)&&custom.length>=4} onClick={() => setCustom(x => x.includes(s)?x.filter(y=>y!==s):[...x,s])}>{s}</button>)}</div></section>}
    <button className="start-game" disabled={!presets.some(x=>x[0]===selected)&&custom.length!==4} onClick={start}>Начать приключение →</button>
  </main>;
}
