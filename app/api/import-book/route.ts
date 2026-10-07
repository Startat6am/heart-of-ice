import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const BOOK = "Моррис Дэйв. Сердце льда - royallib.com.fb2";

function decode(s: string) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function clean(s: string) {
  return decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function parse(xml: string) {
  const out: { chapter_number: number; title: string; content: string }[] = [];
  const re = /<section\b[^>]*>([\s\S]*?)<\/section>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const sec = m[1];
    const tm = sec.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title = tm ? clean(tm[1]) : "";
    const nm = title.match(/^(\d+)/);
    if (!nm) continue;
    const n = Number(nm[1]);
    if (n < 1 || n > 453) continue;
    const ps: string[] = [];
    const pr = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let p: RegExpExecArray | null;
    while ((p = pr.exec(sec))) {
      const t = clean(p[1]);
      if (t) ps.push(t);
    }
    out.push({ chapter_number: n, title: title || String(n), content: ps.join("\n\n") });
  }
  return out.sort((a,b) => a.chapter_number - b.chapter_number);
}

async function importBook() {
  try {
    const xml = fs.readFileSync(path.join(process.cwd(), BOOK), "utf8");
    const chapters = parse(xml);
    if (chapters.length !== 453) {
      return NextResponse.json({ ok:false, error:`Expected 453 chapters, parsed ${chapters.length}` }, {status:500});
    }
    for (let i = 0; i < chapters.length; i += 50) {
      const batch = chapters.slice(i, i + 50);
      const values: unknown[] = [];
      const rows = batch.map((c, j) => {
        const b = j * 3;
        values.push(c.chapter_number, c.title, c.content);
        return `($${b+1},$${b+2},$${b+3})`;
      }).join(",");
      await db.query(`insert into chapters (chapter_number,title,content) values ${rows}
        on conflict (chapter_number) do update set title=excluded.title, content=excluded.content, updated_at=now()`, values);
    }
    const r = await db.query("select count(*)::int as count, min(chapter_number)::int as first, max(chapter_number)::int as last from chapters");
    return NextResponse.json({ok:true, imported:chapters.length, database:r.rows[0]});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ok:false,error:e instanceof Error ? e.message : "Import failed"},{status:500});
  }
}

export async function POST() { return importBook(); }
export async function GET() { return importBook(); }
