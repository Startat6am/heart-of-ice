import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

type Chapter = { chapter_number: number; title: string };

export default async function Chapters() {
  const { rows } = await db.query<Chapter>(
    "select chapter_number, title from chapters order by chapter_number asc"
  );

  return <main className="shell"><a className="back" href="/">← Heart of Ice</a><p className="eyebrow">CONTENTS</p><h1>Chapters</h1>{rows.length === 0 ? <p className="placeholder">Chapters will appear here after they are added to the book.</p> : <div className="chapters">{rows.map(c => <a className="chapter" key={c.chapter_number} href={`/read/${c.chapter_number}`}><span>{String(c.chapter_number).padStart(2,"0")}</span><strong>{c.title}</strong><span>→</span></a>)}</div>}</main>;
}
