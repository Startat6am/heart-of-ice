"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGame } from "../../game-state";

type Props = { chapter: number; title: string; content: string; previous: number | null; next: number | null };
type Choice = { target: number; label: string; required?: string; negated?: boolean };

const cleanCondition = (value: string) => value.replace(/^вы\s+/i, "").trim().replace(/[.,;:]+$/, "");

function makeChoices(text: string, skills: string[]) {
  const parts: Array<{ text: string; choices?: Choice[] }> = [];
  let cursor = 0;
  const conditional = /перейдите\s+на\s+(\d+)\s*,\s*если\s+(?:вы\s+)?(?:владеете|обладаете|имеете)\s+([^,.;()]+?)(?:\s*,\s*или\s+на\s*(\d+)\s*,\s*если\s*(?:вы\s+)?не\s*(?:владеете|обладаете|имеете)(?:\s+([^,.;()]+?))?)?(?=[).;]|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = conditional.exec(text))) {
    if (match.index < cursor) continue;
    parts.push({ text: text.slice(cursor, match.index) });
    const skill = cleanCondition(match[2]);
    const negativeTarget = match[3] ? Number(match[3]) : null;
    const negativeSkill = match[4] ? cleanCondition(match[4]) : skill;
    const has = skills.some(x => x.toLowerCase() === skill.toLowerCase());
    const negativeHas = skills.some(x => x.toLowerCase() === negativeSkill.toLowerCase());
    parts.push({ text: match[0], choices: [
      { target: Number(match[1]), required: skill, label: has ? `→ ${match[1]} — ${skill}` : `🔒 ${match[1]} — нужна «${skill}»` },
      ...(negativeTarget ? [{ target: negativeTarget, required: negativeSkill, negated: true, label: !negativeHas ? `→ ${negativeTarget} — без «${negativeSkill}»` : `🔒 ${negativeTarget} — недоступно` }] : [])
    ]});
    cursor = conditional.lastIndex;
  }
  parts.push({ text: text.slice(cursor) });

  const result: typeof parts = [];
  for (const part of parts) {
    if (part.choices) { result.push(part); continue; }
    let last = 0;
    const plain = /перейдите\s+на\s+(\d+)/gi;
    let p: RegExpExecArray | null;
    while ((p = plain.exec(part.text))) {
      result.push({ text: part.text.slice(last, p.index) });
      result.push({ text: p[0], choices: [{ target: Number(p[1]), label: `→ Перейти к ${p[1]}` }] });
      last = plain.lastIndex;
    }
    result.push({ text: part.text.slice(last) });
  }
  return result;
}

export default function Reader({ chapter, title, content, previous, next }: Props) {
  const { state, setChapter } = useGame();
  const paragraphs = content ? content.split(/\n\s*\n/) : [];
  const rendered = useMemo(() => paragraphs.map(p => makeChoices(p, state.skills)), [paragraphs, state.skills]);

  const go = (target: number) => setChapter(target);

  return <main className="reader">
    <div className="reader-top"><Link className="back" href="/">← Меню</Link><Link href="/status" className="status-link">Вещи · Навыки</Link></div>
    <p className="eyebrow">CHAPTER {chapter}</p><h1>{title}</h1>
    <article className="book-content">
      {rendered.map((parts, i) => <p key={i}>{parts.map((part, j) => part.choices
        ? <span className="choice-wrap" key={j}>{part.text} {part.choices.map((choice, k) => {
            const unlocked = !choice.required || (choice.negated ? !state.skills.some(x => x.toLowerCase() === choice.required!.toLowerCase()) : state.skills.some(x => x.toLowerCase() === choice.required!.toLowerCase()));
            return unlocked ? <button className="choice" key={k} onClick={() => go(choice.target)}>{choice.label}</button> : <span className="choice locked" key={k}>{choice.label}</span>;
          })}</span>
        : part.text)}</p>)}
      {!content && <p className="placeholder">This chapter is ready for its text.</p>}
    </article>
    <nav>{previous ? <Link href={`/read/${previous}`} onClick={() => setChapter(previous)}>← Previous</Link> : <span />}
      <span className="save-note">Сохранено · глава {state.currentChapter}</span>
      {next ? <Link href={`/read/${next}`} onClick={() => setChapter(next)}>Next →</Link> : <span />}</nav>
  </main>;
}
