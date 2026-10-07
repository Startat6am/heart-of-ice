import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
export const runtime = "nodejs";
export async function GET() {
  const r = await db.query(`select count(*)::int as chapters,
    count(*) filter (where content like '%[[CHAPTER:%')::int as chapters_with_links,
    coalesce(sum((length(content)-length(replace(content,'[[CHAPTER:','')))/length('[[CHAPTER:'))::int,0) as markers
    from chapters`);
  return NextResponse.json(r.rows[0]);
}
