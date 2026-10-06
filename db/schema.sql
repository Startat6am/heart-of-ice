create table if not exists chapters (
  id bigserial primary key,
  chapter_number integer not null unique,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
