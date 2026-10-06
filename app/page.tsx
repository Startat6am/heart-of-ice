import { db } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { rows } = await db.query<{ count: string }>(
    "select count(*)::text as count from chapters"
  );
  const chapterCount = Number(rows[0]?.count ?? 0);

  return <main className="shell"><p className="eyebrow">HEART OF ICE</p><h1>A new way to read.</h1><p className="lead">{chapterCount > 0 ? `${chapterCount} ${chapterCount === 1 ? "chapter" : "chapters"} ready to read.` : "The reading experience is ready. Import the book chapters to begin."}</p><div className="actions"><a href="/chapters">View chapters</a></div></main>;
}
