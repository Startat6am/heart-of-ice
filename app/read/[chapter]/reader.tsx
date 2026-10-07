"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
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

function makeChoices(text: string, skills: string[], items: string[]) {
  const out: Array<{ text: string; choices?: Choice[] }> = [];
  let cursor = 0;

  // Conditional choices can be phrased as either "перейдите на N, если..." or
  // "... то на N, если же ... то на M". Handle both forms.
  const conditional =
    /перейдите\s+на\s+(\d+)\s*,\s*если\s+([^.;()]+?)\s*,\s*или\s+на\s+(\d+)\s*,\s*если\s+([^.;()]+?)(?=[).;]|$)/giu;
  let m: RegExpExecArray | null;

  while ((m = conditional.exec(text))) {
    out.push({ text: text.slice(cursor, m.index) });
    out.push({ text: m[0], choices: [choiceFor(Number(m[1]), m[2], skills, items), choiceFor(Number(m[3]), m[4], skills, items)] });
    cursor = conditional.lastIndex;
  }
  out.push({ text: text.slice(cursor) });

  const result: typeof out = [];
  // General destination parser. Besides "перейдите на 23", the book often says
  // "то на 23" / "на 45". We only link a number when it follows a transition phrase,
  // avoiding ordinary numbers in the prose.
  const destination = /\\[\\[CHAPTER:(\\d+)\\]\\]/g;

  for (const part of out) {
    if (part.choices) { result.push(part); continue; }
    let last = 0;
    let d: RegExpExecArray | null;
    while ((d = destination.exec(part.text))) {
      result.push({ text: part.text.slice(last, d.index) });
      result.push({ text: "", choices: [choiceFor(Number(d[1]))] });
      last = destination.lastIndex;
    }
    result.push({ text: part.text.slice(last) });
  }
  return result;
}

export default function Reader({ chapter, title, content, previous, next }: Props) {
  const { state, setChapter } = useGame();
  const router = useRouter();
  const paragraphs = useMemo(() => content ? content.split(/\n\s*\n/) : [], [content]);
  const rendered = useMemo(() => paragraphs.map(p => makeChoices(p, state.skills, state.items)), [paragraphs, state.skills, state.items]);

  const go = (target: number) => { setChapter(target); router.push(`/read/${target}`); };

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
