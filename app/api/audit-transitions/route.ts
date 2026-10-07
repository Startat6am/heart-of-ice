import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const patterns = [
  /\bперейдите\s+(?:на\s+|к\s+)?\d+/giu,
  /\bпереходите\s+(?:на\s+|к\s+)?\d+/giu,
  /\bперейти\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:то|тогда)\s+на\s+\d+/giu,
  /\b(?:отправляйтесь|направляйтесь|двигайтесь|следуйте)\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:идите|пойдите)\s+(?:на\s+|к\s+)?\d+/giu,
  /\b(?:смотрите|см\.?)\s+(?:параграф\s+|п\.?\s*)?\d+/giu,
  /\b(?:параграф|пункт|п\.)\s*\d+/giu,
  /\b(?:номер|№)\s*\d+/giu,
  /\bна\s+\d+\b/giu,
];
function targets(text:string){const s=new Set<number>();for(const p of patterns)for(const m of text.matchAll(p)){const n=m[0].match(/\d+/);if(n){const v=Number(n[0]);if(v>=1&&v<=453)s.add(v)}}return [...s].sort((a,b)=>a-b)}
function snippets(text:string,n:number){const re=new RegExp(`.{0,140}\\b${n}\\b.{0,140}`,"giu");return [...text.matchAll(re)].slice(0,3).map(x=>x[0].replace(/\s+/g," ").trim())}
export async function GET(){const r=await db.query("select chapter_number,title,content from chapters order by chapter_number");const rows=r.rows.map((x:any)=>({chapter:x.chapter_number,title:x.title,targets:targets(x.content),snippets:targets(x.content).flatMap(n=>snippets(x.content,n).map(s=>({target:n,snippet:s})))}));const refs=[...new Set(rows.flatMap(x=>x.targets))].sort((a,b)=>a-b);return NextResponse.json({chapters:rows.length,chaptersWithPossibleTransitions:rows.filter(x=>x.targets.length).length,referencedTargets:refs,missingTargetChapters:Array.from({length:453},(_,i)=>i+1).filter(n=>!refs.includes(n)),rows})}
