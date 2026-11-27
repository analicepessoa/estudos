-- Ask Kookie: additive schema; requires the portal's existing teacher authorization.
-- Never apply older pending migrations wholesale. Supabase CLI unavailable in this workspace;
-- filename prepared locally, reconcile its version with remote migration history at deployment.
begin;
do $$ begin
 if to_regprocedure('public.progress_teacher_authorized()') is null then
  raise exception 'Existing portal teacher authorization is required';
 end if;
end $$;
create schema if not exists ask_kookie_private;
revoke all on schema ask_kookie_private from public, anon, authenticated;

create table public.ask_kookie_episodes (
 id uuid primary key default gen_random_uuid(),
 episode_number integer not null unique check(episode_number>0),
 title text not null check(length(trim(title)) between 3 and 180),
 category text not null check(category in ('Gramática','Vocabulário','Pronúncia','Listening','Speaking','Reading','Writing','Expressões do cotidiano','Outras dúvidas')),
 description text not null default '' check(length(description)<=4000),
 level text not null default 'Básico' check(length(level)<=80),
 keywords text not null default '' check(length(keywords)<=1000),
 video_url text not null default '', thumbnail_url text not null default '', captions_url text not null default '',
 duration_seconds integer check(duration_seconds between 1 and 7200),
 explanation text not null default '' check(length(explanation)<=20000),
 examples text not null default '' check(length(examples)<=10000),
 transcript text not null default '' check(length(transcript)<=50000),
 challenge text not null default '' check(length(challenge)<=4000),
 status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(video_url='' or video_url ~ '^(https://[^[:space:]]+|storage:[a-zA-Z0-9/_.-]+)$'),
 check(thumbnail_url='' or thumbnail_url ~ '^(https://[^[:space:]]+|storage:[a-zA-Z0-9/_.-]+)$'),
 check(captions_url='' or captions_url ~ '^(https://[^[:space:]]+|storage:[a-zA-Z0-9/_.-]+)$'),
 check(status<>'published' or (video_url<>'' and length(trim(description))>0 and duration_seconds is not null and published_at is not null))
);
-- A separate relation prevents accidental publication of private text or identity.
create table public.ask_kookie_public_questions (
 id uuid primary key default gen_random_uuid(),
 question text not null check(length(trim(question)) between 5 and 2000),
 category text not null check(category in ('Gramática','Vocabulário','Pronúncia','Listening','Speaking','Reading','Writing','Expressões do cotidiano','Outras dúvidas')),
 published boolean not null default false,
 interest_count integer not null default 0 check(interest_count>=0),
 created_at timestamptz not null default now()
);
create table public.ask_kookie_questions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 question text not null check(length(trim(question)) between 5 and 2000),
 category text not null check(category in ('Gramática','Vocabulário','Pronúncia','Listening','Speaking','Reading','Writing','Expressões do cotidiano','Outras dúvidas')),
 status text not null default 'received' check(status in ('received','review','production','answered')),
 archived boolean not null default false, internal_notes text not null default '' check(length(internal_notes)<=10000),
 group_key text not null default '' check(length(group_key)<=160),
 public_question_id uuid references public.ask_kookie_public_questions(id) on delete set null,
 created_at timestamptz not null default now()
);
create unique index ask_kookie_question_dedup on public.ask_kookie_questions(user_id,category,md5(lower(regexp_replace(trim(question),'\s+',' ','g'))));
create index ask_kookie_questions_owner on public.ask_kookie_questions(user_id,created_at desc);
create index ask_kookie_questions_status on public.ask_kookie_questions(status,category,created_at desc);
create index ask_kookie_questions_public on public.ask_kookie_questions(public_question_id);
create table public.ask_kookie_episode_questions (
 episode_id uuid not null references public.ask_kookie_episodes(id) on delete cascade,
 question_id uuid not null references public.ask_kookie_questions(id) on delete cascade,
 primary key(episode_id,question_id)
);
create index ask_kookie_links_question on public.ask_kookie_episode_questions(question_id);
create table public.ask_kookie_question_votes (
 public_question_id uuid not null references public.ask_kookie_public_questions(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(public_question_id,user_id)
);
create index ask_kookie_votes_owner on public.ask_kookie_question_votes(user_id);
create table public.ask_kookie_episode_views (
 episode_id uuid not null references public.ask_kookie_episodes(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(episode_id,user_id)
);
create index ask_kookie_views_owner on public.ask_kookie_episode_views(user_id);

alter table public.ask_kookie_questions enable row level security;
alter table public.ask_kookie_public_questions enable row level security;
alter table public.ask_kookie_episodes enable row level security;
alter table public.ask_kookie_episode_questions enable row level security;
alter table public.ask_kookie_question_votes enable row level security;
alter table public.ask_kookie_episode_views enable row level security;
revoke all on public.ask_kookie_questions,public.ask_kookie_public_questions,public.ask_kookie_episodes,public.ask_kookie_episode_questions,public.ask_kookie_question_votes,public.ask_kookie_episode_views from public,anon,authenticated;
grant select on public.ask_kookie_questions,public.ask_kookie_public_questions,public.ask_kookie_episodes,public.ask_kookie_episode_questions,public.ask_kookie_question_votes,public.ask_kookie_episode_views to authenticated;
-- Students cannot insert administrative fields, even on their own row.
grant insert(id,question,category) on public.ask_kookie_questions to authenticated;
grant update(status,archived,internal_notes,group_key,public_question_id) on public.ask_kookie_questions to authenticated;
grant insert,update,delete on public.ask_kookie_episodes,public.ask_kookie_episode_questions to authenticated;
grant insert(question,category,published),update(question,category,published) on public.ask_kookie_public_questions to authenticated;
grant insert(public_question_id),delete on public.ask_kookie_question_votes to authenticated;
grant insert(episode_id),delete on public.ask_kookie_episode_views to authenticated;
-- Internal notes are split out of student reads using a safe RPC below; table SELECT
-- is column-restricted so even direct REST cannot expose notes on a student's own row.
revoke select on public.ask_kookie_questions from authenticated;
grant select(id,user_id,question,category,status,archived,group_key,public_question_id,created_at) on public.ask_kookie_questions to authenticated;

create policy own_questions on public.ask_kookie_questions for select to authenticated using(user_id=(select auth.uid()) or (select public.progress_teacher_authorized()));
create policy send_question on public.ask_kookie_questions for insert to authenticated with check(user_id=(select auth.uid()) and status='received' and not archived and internal_notes='' and group_key='' and public_question_id is null);
create policy manage_question on public.ask_kookie_questions for update to authenticated using((select public.progress_teacher_authorized())) with check((select public.progress_teacher_authorized()));
create policy read_episodes on public.ask_kookie_episodes for select to authenticated using(status='published' or (select public.progress_teacher_authorized()));
create policy manage_episodes on public.ask_kookie_episodes for all to authenticated using((select public.progress_teacher_authorized())) with check((select public.progress_teacher_authorized()));
create policy read_public_questions on public.ask_kookie_public_questions for select to authenticated using(published or (select public.progress_teacher_authorized()));
create policy manage_public_questions on public.ask_kookie_public_questions for all to authenticated using((select public.progress_teacher_authorized())) with check((select public.progress_teacher_authorized()));
create policy read_links on public.ask_kookie_episode_questions for select to authenticated using((select public.progress_teacher_authorized()) or (exists(select 1 from public.ask_kookie_questions q where q.id=question_id and q.user_id=(select auth.uid())) and exists(select 1 from public.ask_kookie_episodes e where e.id=episode_id and e.status='published')));
create policy manage_links on public.ask_kookie_episode_questions for all to authenticated using((select public.progress_teacher_authorized())) with check((select public.progress_teacher_authorized()));
create policy read_votes on public.ask_kookie_question_votes for select to authenticated using(user_id=(select auth.uid()) or (select public.progress_teacher_authorized()));
create policy vote on public.ask_kookie_question_votes for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.ask_kookie_public_questions p where p.id=public_question_id and p.published));
create policy unvote on public.ask_kookie_question_votes for delete to authenticated using(user_id=(select auth.uid()));
create policy read_views on public.ask_kookie_episode_views for select to authenticated using(user_id=(select auth.uid()) or (select public.progress_teacher_authorized()));
create policy mark_watched on public.ask_kookie_episode_views for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.ask_kookie_episodes e where e.id=episode_id and e.status='published'));
create policy unmark_watched on public.ask_kookie_episode_views for delete to authenticated using(user_id=(select auth.uid()));

-- Only this trigger can update the count. Row locks make simultaneous votes atomic.
create function ask_kookie_private.count_interest() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  update public.ask_kookie_public_questions set interest_count=interest_count+1 where id=new.public_question_id;
  return new;
 end if;
 update public.ask_kookie_public_questions set interest_count=greatest(0,interest_count-1) where id=old.public_question_id;
 return old;
end $$;
revoke all on function ask_kookie_private.count_interest() from public,anon,authenticated;
create trigger ask_kookie_interest after insert or delete on public.ask_kookie_question_votes for each row execute function ask_kookie_private.count_interest();

create function ask_kookie_private.episode_timestamp() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.updated_at=now();
 if new.status='published' then new.published_at=coalesce(new.published_at,now()); else new.published_at=null; end if;
 return new;
end $$;
create trigger ask_kookie_episode_timestamp before insert or update on public.ask_kookie_episodes for each row execute function ask_kookie_private.episode_timestamp();
-- Publication/link changes recompute answer state, including unpublication and unlink.
create function ask_kookie_private.sync_answers() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.ask_kookie_questions q set status=case when exists(
  select 1 from public.ask_kookie_episode_questions l join public.ask_kookie_episodes e on e.id=l.episode_id where l.question_id=q.id and e.status='published'
 ) then 'answered' else case when q.status='answered' then 'review' else q.status end end
 where q.id in (select question_id from public.ask_kookie_episode_questions where episode_id=coalesce(new.id,old.id));
 return null;
end $$;
create trigger ask_kookie_publication after insert or update on public.ask_kookie_episodes for each row execute function ask_kookie_private.sync_answers();
create function ask_kookie_private.sync_link() returns trigger language plpgsql security invoker set search_path='' as $$
declare target uuid; begin
 target=case when tg_op='DELETE' then old.question_id else new.question_id end;
 update public.ask_kookie_questions q set status=case when exists(select 1 from public.ask_kookie_episode_questions l join public.ask_kookie_episodes e on e.id=l.episode_id where l.question_id=q.id and e.status='published') then 'answered' else case when q.status='answered' then 'review' else q.status end end where q.id=target;
 return null;
end $$;
create trigger ask_kookie_link_status after insert or delete on public.ask_kookie_episode_questions for each row execute function ask_kookie_private.sync_link();

-- Internal notes are available only through a server-checked admin reader.
create function ask_kookie_private.admin_notes() returns table(id uuid,internal_notes text) language plpgsql stable security definer set search_path='' as $$
begin
 if not public.progress_teacher_authorized() then raise insufficient_privilege; end if;
 return query select q.id,q.internal_notes from public.ask_kookie_questions q;
end $$;
grant usage on schema ask_kookie_private to authenticated;
revoke all on function ask_kookie_private.admin_notes() from public,anon,authenticated;
grant execute on function ask_kookie_private.admin_notes() to authenticated;
create function public.ask_kookie_admin_notes() returns table(id uuid,internal_notes text) language sql stable security invoker set search_path='' as $$ select * from ask_kookie_private.admin_notes() $$;
revoke all on function public.ask_kookie_admin_notes() from public,anon,authenticated;
grant execute on function public.ask_kookie_admin_notes() to authenticated;

-- Save episode and its many-to-many links in one transaction. No privileged writes.
create function public.ask_kookie_save_episode(p_episode jsonb,p_questions uuid[]) returns uuid language plpgsql security invoker set search_path='' as $$
declare e public.ask_kookie_episodes; begin
 if not public.progress_teacher_authorized() then raise insufficient_privilege; end if;
 if coalesce(array_length(p_questions,1),0)>500 then raise exception 'Too many linked questions'; end if;
 e=jsonb_populate_record(null::public.ask_kookie_episodes,p_episode);
 e.id=coalesce(e.id,gen_random_uuid());
 insert into public.ask_kookie_episodes(id,episode_number,title,category,description,level,keywords,video_url,thumbnail_url,captions_url,duration_seconds,explanation,examples,transcript,challenge,status)
 values(e.id,e.episode_number,e.title,e.category,coalesce(e.description,''),coalesce(e.level,'Básico'),coalesce(e.keywords,''),coalesce(e.video_url,''),coalesce(e.thumbnail_url,''),coalesce(e.captions_url,''),e.duration_seconds,coalesce(e.explanation,''),coalesce(e.examples,''),coalesce(e.transcript,''),coalesce(e.challenge,''),e.status)
 on conflict(id) do update set episode_number=excluded.episode_number,title=excluded.title,category=excluded.category,description=excluded.description,level=excluded.level,keywords=excluded.keywords,video_url=excluded.video_url,thumbnail_url=excluded.thumbnail_url,captions_url=excluded.captions_url,duration_seconds=excluded.duration_seconds,explanation=excluded.explanation,examples=excluded.examples,transcript=excluded.transcript,challenge=excluded.challenge,status=excluded.status;
 delete from public.ask_kookie_episode_questions where episode_id=e.id and not(question_id=any(coalesce(p_questions,'{}')));
 insert into public.ask_kookie_episode_questions(episode_id,question_id) select e.id,x from unnest(coalesce(p_questions,'{}')) x on conflict do nothing;
 return e.id;
end $$;
revoke all on function public.ask_kookie_save_episode(jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.ask_kookie_save_episode(jsonb,uuid[]) to authenticated;
revoke all on all functions in schema ask_kookie_private from public,anon;

-- Draft media is private. Students can sign only files referenced by published episodes.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ask-kookie','ask-kookie',false,104857600,array['video/mp4','video/webm','image/jpeg','image/png','image/webp','text/vtt']);
create policy ask_kookie_media_read on storage.objects for select to authenticated using(bucket_id='ask-kookie' and ((select public.progress_teacher_authorized()) or exists(select 1 from public.ask_kookie_episodes e where e.status='published' and ('storage:'||name in (e.video_url,e.thumbnail_url,e.captions_url)))));
create policy ask_kookie_media_insert on storage.objects for insert to authenticated with check(bucket_id='ask-kookie' and (select public.progress_teacher_authorized()));
-- No overwrite/delete policy: immutable file names preserve existing published videos.

insert into public.ask_kookie_episodes(episode_number,title,category,description,level,status,duration_seconds)
values(1,'DO ou DOES? Qual é a diferença?','Gramática','O Professor Kookie explica de maneira simples e divertida quando utilizar DO e DOES nas perguntas do Simple Present.','Básico','draft',66);
commit;
