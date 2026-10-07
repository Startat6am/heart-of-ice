"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGame } from "../../game-state";

type Props = { chapter: number; title: string; content: string; previous: number | null; next: number | null };
type Choice = { target: number; label: string; required?: string; negated?: boolean; kind?: "skill" | "item" };

const clean = (value: string) => value.replace(/\s+/g, " ").replace(/[.,;:]+$/, "").trim();
const hasValue = (values: string[], wanted: string) => values.some(x => clean(x).toLocaleLowerCase("ru-RU") === clean(wanted).toLocaleLowerCase("ru-RU"));

function conditionInfo(raw: string) {
  const condition = clean(raw.replace(/^если\s+/i, ""));
  const negative = /\bне\s+(?:владеете|обладаете|имеете)\b|\bу\s+вас\s+нет\b|\bне\s+имеется\b/i.test(condition);
  const item = /\bу\s+вас\s+(?:есть|имеется|нет)\b|\bпредмет(?:ом)?\b/i.test(condition);
  const value = clean(condition
    .replace(/^вы\s+(?:не\s+)?(?:владеете|обладаете|имеете)\s+/i, "")
    .replace(/^не\s+(?:владеете|обладаете|имеете)\s+/i, "")
    .replace(/^у\s+вас\s+(?:есть|имеется|нет)\s+/i, ""));
  return { value, negative, kind: item ? "item" as const : "skill" as const };
}

function choiceFor(target: number, condition?: string, skills: string[] = [], items: string[] = []): Choice {
  if (!condition) return { target, label: `→ Перейти к ${target}` };
  const info = conditionInfo(condition);
  const values = info.kind === "item" ? items : skills;
  const present = hasValue(values, info.value);
  const unlocked = info.negative ? !present : present;
  return {
    target,
    required: info.value,
    kind: info.kind,
    negated: info.negative,
    label: unlocked ? `→ ${target}` : `🔒 ${target}`
  };
}

function sentenceBefore(text: string, index: number) {
  const before = text.slice(0, index);
  const match = before.match(/(?:^|[.!?])\s*([^.!?]*)$/);
  return match?.[1] ?? before.slice(-400);
}

function inferCondition(prefix: string) {
  const cleanPrefix = clean(prefix);
  const matches = [
    ...cleanPrefix.matchAll(/\bесли(?:\s+же)?\s+(.+?)(?=,\s*(?:то\s+)?(?:перейдите|переходите|перейти)\b|\s+(?:перейдите|переходите|перейти)\s*$)/giu),
    ...cleanPrefix.matchAll(/\b(?:при\s+наличии|при\s+условии)\s+(.+?)(?=,\s*(?:то\s+)?(?:перейдите|переходите|перейти)\b|\s+(?:перейдите|переходите|перейти)\s*$)/giu),
  ];
  const last = matches.sort((x, y) => (x.index ?? 0) - (y.index ?? 0)).at(-1);
  if (!last?.[1]) return undefined;
  const value = clean(last[1]);
  const knownSkill = ["Ближний бой","Знания","Уличная жизнь","Выживание","Хитрость","Пилотирование","Стрельба","Ловкость","Кибернетика","Воровство","Эсп","Парадокс"].some(x => value.toLocaleLowerCase("ru-RU").includes(x.toLocaleLowerCase("ru-RU")));
  const knownItem = /\b(?:у\s+вас\s+(?:есть|имеется|нет)|имеете|имеется|предмет|оружие|пистолет|фокус|ключевое слово)\b/i.test(value);
  return knownSkill || knownItem ? value : undefined;
}

function makeChoices(text: string, skills: string[], items: string[]) {
  const marker = /\[\[CHAPTER:(\d+)\]\]/g;
  const result: Array<{ text: string; choices?: Choice[] }> = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = marker.exec(text))) {
    const target = Number(m[1]);
    result.push({ text: text.slice(last, m.index) });
    const condition = inferCondition(sentenceBefore(text, m.index));
    result.push({ text: "", choices: [choiceFor(target, condition, skills, items)] });
    last = marker.lastIndex;
  }

  result.push({ text: text.slice(last) });
  return result;
}

export default function Reader({ chapter, title, content, previous, next }: Props) {
  const { state, setChapter } = useGame();
  const paragraphs = useMemo(() => content ? content.split(/\n\s*\n/) : [], [content]);
  const rendered = useMemo(() => paragraphs.map(p => makeChoices(p, state.skills, state.items)), [paragraphs, state.skills, state.items]);

  const go = (target: number) => { setChapter(target); window.location.href = `/read/${target}`; };

  return <main className="reader">
    <div className="reader-top">
      <Link className="back" href="/">← Меню</Link>
      <Link href="/status" className="status-link">Вещи · Навыки</Link>
    </div>
    <p className="eyebrow">CHAPTER {chapter}</p>
    <h1>{title}</h1>
    <article className="book-content">
      {rendered.map((parts, i) => <p key={i}>{parts.map((part, j) => part.choices
        ? <span className="choice-wrap" key={j}>{part.text} {part.choices.map((choice, k) => {
            const present = choice.kind === "item" ? hasValue(state.items, choice.required ?? "") : hasValue(state.skills, choice.required ?? "");
            const unlocked = !choice.required || (choice.negated ? !present : present);
            return unlocked
              ? <button type="button" className="choice" key={k} onClick={() => go(choice.target)}>{choice.label}</button>
              : <span className="choice locked" key={k}>{choice.label}</span>;
          })}</span>
        : part.text)}</p>)}
      {!content && <p className="placeholder">Текст этой главы пока недоступен.</p>}
    </article>
    <nav>
      {previous ? <Link href={`/read/${previous}`} onClick={() => setChapter(previous)}>← Предыдущая</Link> : <span />}
      <span className="save-note">Сохранено · глава {state.currentChapter}</span>
      {next ? <Link href={`/read/${next}`} onClick={() => setChapter(next)}>Следующая →</Link> : <span />}
    </nav>
  </main>;
}
