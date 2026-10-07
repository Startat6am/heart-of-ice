"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../game-state";

type Props = { chapter: number; title: string; content: string; previous: number | null; next: number | null };
type Choice = { target: number; label: string; required?: string; negated?: boolean; kind?: "skill" | "item" };

const normalize = (value: string) =>
  value
    .replace(/^вы\s+/i, "")
    .replace(/^у\s+вас\s+(?:есть|имеется)\s+/i, "")
    .replace(/^у\s+вас\s+нет\s+/i, "")
    .replace(/[.,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

const hasValue = (values: string[], wanted: string) =>
  values.some(x => normalize(x).toLocaleLowerCase("ru-RU") === normalize(wanted).toLocaleLowerCase("ru-RU"));

function makeChoices(text: string, skills: string[], items: string[]) {
  const parts: Array<{ text: string; choices?: Choice[] }> = [];
  let cursor = 0;

  // Covers the common book forms:
  // "перейдите на 45, если вы владеете X, или на 46, если не владеете X"
  // and item variants such as "если у вас есть X / если у вас нет X".
  const conditional = /(?:перейдите|переходите)\s+на\s+(\d+)\s*,\s*если\s+((?:(?:вы\s+)?(?:не\s+)?(?:владеете|обладаете|имеете)\s+|у\s+вас\s+(?:есть|имеется|нет)\s+)[^,.;()]+?)\s*,\s*или\s+на\s+(\d+)\s*,\s*если\s+((?:(?:вы\s+)?(?:не\s+)?(?:владеете|обладаете|имеете)\s+|у\s+вас\s+(?:есть|имеется|нет)\s+)[^,.;()]+?)(?=[).;]|$)/giu;
  let match: RegExpExecArray | null;

  while ((match = conditional.exec(text))) {
    if (match.index < cursor) continue;

    parts.push({ text: text.slice(cursor, match.index) });

    const firstCondition = normalize(match[2]);
    const secondCondition = match[4] ? normalize(match[4]) : null;

    const parseCondition = (condition: string | null) => {
      if (!condition) return null;
      const negative = /\bне\s+(?:владеете|обладаете|имеете)\b|\bу\s+вас\s+нет\b|\bне\s+имеется\b/i.test(condition);
      const item = /\bу\s+вас\s+(?:есть|имеется|нет)\b|\bпредмет(?:ом)?\b/i.test(condition);
      const value = normalize(
        condition
          .replace(/^если\s+/i, "")
          .replace(/^вы\s+(?:не\s+)?(?:владеете|обладаете|имеете)\s+/i, "")
          .replace(/^не\s+(?:владеете|обладаете|имеете)\s+/i, "")
          .replace(/^у\s+вас\s+(?:есть|имеется|нет)\s+/i, "")
      );
      return { value, negative, kind: item ? "item" as const : "skill" as const };
    };

    const first = parseCondition(firstCondition)!;
    const second = parseCondition(secondCondition);

    const available = (c: ReturnType<typeof parseCondition>) =>
      c ? (c.kind === "item" ? hasValue(items, c.value) : hasValue(skills, c.value)) : false;

    const firstHas = available(first);
    const secondHas = available(second);

    parts.push({
      text: match[0],
      choices: [
        {
          target: Number(match[1]),
          required: first.value,
          kind: first.kind,
          label: firstHas ? `→ ${match[1]}` : `🔒 ${match[1]} — нужна ${first.kind === "item" ? "вещь" : "способность"} «${first.value}»`
        },
        ...(match[3] && second ? [{
          target: Number(match[3]),
          required: second.value,
          negated: second.negative,
          kind: second.kind,
          label: second.negative
            ? (!secondHas ? `→ ${match[3]}` : `🔒 ${match[3]} — условие не выполнено`)
            : (secondHas ? `→ ${match[3]}` : `🔒 ${match[3]} — нужна ${second.kind === "item" ? "вещь" : "способность"} «${second.value}»`)
        } as Choice] : [])
      ]
    });

    cursor = conditional.lastIndex;
  }

  parts.push({ text: text.slice(cursor) });

  // Any explicit destination is a real game transition, not just ordinary text.
  // This intentionally handles variants used throughout the imported book.
  const destination = /\b(?:перейдите|переходите|перейти|переходите\s+к)\s+(?:на\s+|к\s+)?(\d+)\b/giu;
  const result: typeof parts = [];

  for (const part of parts) {
    if (part.choices) {
      result.push(part);
      continue;
    }

    let last = 0;
    let p: RegExpExecArray | null;
    while ((p = destination.exec(part.text))) {
      result.push({ text: part.text.slice(last, p.index) });
      result.push({ text: p[0], choices: [{ target: Number(p[1]), label: `→ Перейти к ${p[1]}` }] });
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
  const rendered = useMemo(
    () => paragraphs.map(p => makeChoices(p, state.skills, state.items)),
    [paragraphs, state.skills, state.items]
  );

  const go = (target: number) => {
    setChapter(target);
    router.push(`/read/${target}`);
  };

  return <main className="reader">
    <div className="reader-top"><Link className="back" href="/">← Меню</Link><Link href="/status" className="status-link">Вещи · Навыки</Link></div>
    <p className="eyebrow">CHAPTER {chapter}</p><h1>{title}</h1>
    <article className="book-content">
      {rendered.map((parts, i) => <p key={i}>{parts.map((part, j) => part.choices
        ? <span className="choice-wrap" key={j}>{part.text} {part.choices.map((choice, k) => {
            const present = choice.kind === "item" ? hasValue(state.items, choice.required ?? "") : hasValue(state.skills, choice.required ?? "");
            const unlocked = !choice.required || (choice.negated ? !present : present);
            return unlocked
              ? <button className="choice" key={k} onClick={() => go(choice.target)}>{choice.label}</button>
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
