import { notFound } from "next/navigation";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

type Chapter = { chapter_number: number; title: string; content: string };

export default async function Reader({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const number = Number(chapter);
  if (!Number.isInteger(number) || number < 1) notFound();

  const { rows } = await db.query<Chapter>(
    "select chapter_number, title, content from chapters where chapter_number = $1 limit 1",
    [number]
  );
  const current = rows[0];
  if (!current) notFound();

  const { rows: neighbors } = await db.query<{ chapter_number: number }>(
    "select chapter_number from chapters order by chapter_number asc"
  );
  const index = neighbors.findIndex(c => c.chapter_number === number);
  const previous = index > 0 ? neighbors[index - 1].chapter_number : null;
  const next = index >= 0 && index < neighbors.length - 1 ? neighbors[index + 1].chapter_number : null;

  return <main className="reader"><a className="back" href="/chapters">← Contents</a><p className="eyebrow">CHAPTER {current.chapter_number}</p><h1>{current.title}</h1><article className="book-content">{current.content ? current.content.split(/\\n\\s*\\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>) : <p className="placeholder">This chapter is ready for its text.</p>}</article><nav>{previous ? <a href={`/read/${previous}`}>← Previous</a> : <span />}{next ? <a href={`/read/${next}`}>Next →</a> : <span />}</nav></main>;
}
