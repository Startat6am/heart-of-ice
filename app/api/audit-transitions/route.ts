import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patterns = [
  /\bперейдите\s+(?:на\s+|к\s+)?\d+/giu,
  /\bпереходите\s+(?:на\s+|к\s+)?\d+/giu,
  /\bперейти\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:то|тогда)\s+на\s+\d+/giu,
  /\bна\s+\d+\b/giu,
  /\b(?:отправляйтесь|направляйтесь|двигайтесь|следуйте)\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:идите|пойдите)\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:смотрите|см\.?)\s+(?:параграф\s+|п\.?\s*)?\d+/giu,
  /\b(?:параграф|пункт|п\.)\s*\d+/giu,
  /\b(?:номер|№)\s*\d+/giu,
];

function targets(text: string) {
  const found = new Set<number>();
  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      const n = m[0].match(/\d+/);
      if (n) found.add(Number(n[0]));
    }
  }
  return [...found].filter(n => n >= 1 && n <= 453).sort((a,b) => a-b);
}

function snippet(text: string, n: number) {
  const re = new RegExp(`(?:.{0,100})\\b${n}\\b(?:.{0,100})`, "iu");
  return text.match(re)?.[0]?.replace(/\s+/g, " ").trim() ?? "";
}

export async function GET() {
  const r = await db.query("select chapter_number,title,content from chapters order by chapter_number");
  const rows = r.rows.map((row: {chapter_number:number; title:string; content:string}) => {
    const ts = targets(row.content);
    return { chapter: row.chapter_number, title: row.title, targets: ts, suspicious: ts.length > 0, snippets: ts.map(n => ({target:n,snippet:snippet(row.content,n)})) };
  });
  const linked = new Set<number>();
  rows.forEach(x => x.targets.forEach(n => linked.add(n)));
  return NextResponse.json({ chapters: rows.length, chaptersWithPossibleTransitions: rows.filter(x=>x.suspicious).length, referencedTargets:[...linked].sort((a,b)=>a-b), missingTargetChapters:[...Array(453)].map((_,i)=>i+1).filter(n=>!linked.has(n)), rows });
}
