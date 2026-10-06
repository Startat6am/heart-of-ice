import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await db.query<{ now: string }>("select now() as now");
    return NextResponse.json({ ok: true, database: "connected", now: result.rows[0]?.now });
  } catch (error) {
    console.error("Database health check failed", error);
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
