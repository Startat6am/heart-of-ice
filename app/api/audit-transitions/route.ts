import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patterns = [
  /\bперейдите\s+(?:на\s+|к\s+)?(\d+)/giu,
  /\bпереходите\s+(?:на\s+|к\s+)?(\d+)/giu,
  /\bперейти\s+(?:на\s+|к\s+)?(\d+)/giu,
  /\b(?:то|тогда)\s+(?:на\s+)?(\d+)/giu,
  /\b(?:отправляйтесь|направляйтесь|двигайтесь|следуйте)\s+(?:на\s+|к\s+)?(\d+)/giu,
  /\b(?:идите|пойдите)\s+(?:на\s+|к\s+)?(\d+)/giu,
  /\b(?:смотрите|см\.?)\s+(?:параграф\s+|п\.?\s*)?(\d+)/giu,
  /\b(?:параграф|пункт|п\.)\s*(\d+)/giu,
];

function targetsFromPatterns(text: string) {
  const s = new Set<number>();
  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      const raw = m[1] ?? m[0].match(/\d+/)?.[0];
      if (!raw) continue;
      const v = Number(raw);
      if (v >= 1 && v <= 453) s.add(v);
    }
  }
  return [...s].sort((a, b) => a - b);
}

function markerTargets(text: string) {
  return [...new Set(
    [...text.matchAll(/\[\[CHAPTER:(\d+)\]\]/g)].map(m => Number(m[1])).filter(n => n >= 1 && n <= 453)
  )].sort((a, b) => a - b);
}

function snippets(text: string, n: number) {
  const re = new RegExp(`.{0,180}\\\\b${n}\\\\b.{0,180}`, "giu");
  return [...text.matchAll(re)].slice(0, 3).map(x => x[0].replace(/\\s+/g, " ").trim());
}

export async function GET() {
  const r = await db.query("select chapter_number,title,content from chapters order by chapter_number");
  const rows = r.rows.map((x: any) => {
    const markers = markerTargets(x.content);
    const prose = targetsFromPatterns(x.content);
    return {
      chapter: x.chapter_number,
      title: x.title,
      markerTargets: markers,
      proseTargets: prose,
      unmarkedProseTargets: prose.filter(n => !markers.includes(n)),
      snippets: prose.filter(n => !markers.includes(n)).flatMap(n =>
        snippets(x.content, n).map(s => ({ target: n, snippet: s }))
      ),
    };
  });
  const referencedTargets = [...new Set(rows.flatMap(x => x.markerTargets))].sort((a, b) => a - b);
  const unmarked = rows.filter(x => x.unmarkedProseTargets.length);
  return NextResponse.json({
    chapters: rows.length,
    chaptersWithMarkers: rows.filter(x => x.markerTargets.length).length,
    chaptersWithPossibleProseTransitions: rows.filter(x => x.proseTargets.length).length,
    referencedTargets,
    invalidMarkerTargets: rows.flatMap(x => x.markerTargets.filter(n => n < 1 || n > 453)),
    unmarkedProseTransitionChapters: unmarked.map(x => x.chapter),
    unmarkedProseTransitionCount: unmarked.reduce((sum, x) => sum + x.unmarkedProseTargets.length, 0),
    rows,
  });
}
