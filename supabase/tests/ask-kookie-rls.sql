-- Run after the Ask Kookie migration, as postgres, in a dedicated connection.
-- Every fixture and change rolls back. No real student data is read or modified.
begin;
insert into auth.users(id,aud,role,raw_app_meta_data,raw_user_meta_data)
values ('a5c00000-0000-4000-8000-000000000001','authenticated','authenticated','{}','{}'),
 ('a5c00000-0000-4000-8000-000000000002','authenticated','authenticated','{}','{}'),
 ('a5c00000-0000-4000-8000-000000000003','authenticated','authenticated','{"role":"teacher"}','{}');
insert into auth.sessions(id,user_id) values('a5c00000-0000-4000-8000-000000000004','a5c00000-0000-4000-8000-000000000003');
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{}}',true);
set local role authenticated;
insert into public.ask_kookie_questions(id,question,category) values('a5c00000-0000-4000-8000-000000000011','ASK_KOOKIE_ROLLBACK_TEST: When do I use does?','Gramática');
do $$ declare n integer; begin
 if not exists(select 1 from public.ask_kookie_questions where id='a5c00000-0000-4000-8000-000000000011' and user_id=auth.uid()) then raise exception 'FAIL identity/persistence';end if;
 begin
  insert into public.ask_kookie_questions(question,category) values('ASK_KOOKIE_ROLLBACK_TEST: When do I use does?','Gramática');
  raise exception 'FAIL duplicate question accepted';
 exception when unique_violation then null; end;
 begin
  insert into public.ask_kookie_questions(user_id,question,category) values('a5c00000-0000-4000-8000-000000000002','ASK_KOOKIE_ROLLBACK_TEST: forged owner','Gramática');
  raise exception 'FAIL forged owner accepted';
 exception when insufficient_privilege then null; end;
 update public.ask_kookie_questions set status='answered' where id='a5c00000-0000-4000-8000-000000000011';
 get diagnostics n=row_count;if n<>0 then raise exception 'FAIL student changed administrative status';end if;
 begin perform internal_notes from public.ask_kookie_questions; raise exception 'FAIL private notes readable';exception when insufficient_privilege then null;end;
 begin perform * from public.ask_kookie_admin_notes(); raise exception 'FAIL admin RPC open';exception when insufficient_privilege then null;end;
 begin perform public.ask_kookie_save_episode('{"episode_number":99999,"title":"Forbidden episode"}','{}');raise exception 'FAIL episode RPC open';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{}}',true);
do $$ begin
 if exists(select 1 from public.ask_kookie_questions where id='a5c00000-0000-4000-8000-000000000011') then raise exception 'FAIL private question visible to another student';end if;
end $$;
insert into public.ask_kookie_questions(id,question,category) values('a5c00000-0000-4000-8000-000000000012','ASK_KOOKIE_ROLLBACK_TEST: Does she study?','Gramática');
-- Spoofed user metadata must never authorize administration.
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"teacher"},"app_metadata":{}}',true);
do $$ begin if public.progress_teacher_authorized() then raise exception 'FAIL editable metadata authorizes teacher';end if;end $$;
-- Fixture teacher has both current server metadata and an actual session row.
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000003","role":"authenticated","session_id":"a5c00000-0000-4000-8000-000000000004","app_metadata":{"role":"teacher"}}',true);
do $$ begin
 if not public.progress_teacher_authorized() then raise exception 'FAIL teacher authorization';end if;
 if (select count(*) from public.ask_kookie_questions where id in ('a5c00000-0000-4000-8000-000000000011','a5c00000-0000-4000-8000-000000000012'))<>2 then raise exception 'FAIL admin question access';end if;
end $$;
update public.ask_kookie_questions set status='production',internal_notes='ASK_KOOKIE_ROLLBACK_TEST private note',group_key='ASK_KOOKIE_ROLLBACK_TEST'
where id in ('a5c00000-0000-4000-8000-000000000011','a5c00000-0000-4000-8000-000000000012');
select public.ask_kookie_save_episode('{"id":"a5c00000-0000-4000-8000-000000000021","episode_number":99999,"title":"ASK_KOOKIE_ROLLBACK_TEST","category":"Gramática","description":"Rollback test","status":"draft"}',array['a5c00000-0000-4000-8000-000000000011','a5c00000-0000-4000-8000-000000000012']::uuid[]);
do $$ begin
 if not exists(select 1 from public.ask_kookie_admin_notes() where id='a5c00000-0000-4000-8000-000000000011' and internal_notes='ASK_KOOKIE_ROLLBACK_TEST private note') then raise exception 'FAIL internal notes';end if;
 begin update public.ask_kookie_episodes set status='published' where id='a5c00000-0000-4000-8000-000000000021';raise exception 'FAIL incomplete publication';exception when check_violation then null;end;
end $$;
-- No video is fabricated in production: this URL exists only inside this rolled-back test.
update public.ask_kookie_episodes set video_url='https://example.invalid/rollback-test.mp4',duration_seconds=60,status='published' where id='a5c00000-0000-4000-8000-000000000021';
do $$ begin
 if (select count(*) from public.ask_kookie_questions where id in ('a5c00000-0000-4000-8000-000000000011','a5c00000-0000-4000-8000-000000000012') and status='answered')<>2 then raise exception 'FAIL linked publication statuses';end if;
end $$;
-- Private originals are not copied into the public question relation.
insert into public.ask_kookie_public_questions(question,category,published) values('ASK_KOOKIE_ROLLBACK_TEST anonymous revised question','Gramática',true);
reset role;
-- Give the public fixture a deterministic id without exposing ID insertion to clients.
update public.ask_kookie_public_questions set id='a5c00000-0000-4000-8000-000000000031' where question='ASK_KOOKIE_ROLLBACK_TEST anonymous revised question';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{}}',true);
insert into public.ask_kookie_question_votes(public_question_id) values('a5c00000-0000-4000-8000-000000000031');
insert into public.ask_kookie_episode_views(episode_id) values('a5c00000-0000-4000-8000-000000000021');
do $$ begin
 if (select interest_count from public.ask_kookie_public_questions where id='a5c00000-0000-4000-8000-000000000031')<>1 then raise exception 'FAIL interest count';end if;
 begin insert into public.ask_kookie_question_votes(public_question_id) values('a5c00000-0000-4000-8000-000000000031');raise exception 'FAIL duplicate vote';exception when unique_violation then null;end;
 begin insert into public.ask_kookie_episode_views(episode_id) values('a5c00000-0000-4000-8000-000000000021');raise exception 'FAIL duplicate view';exception when unique_violation then null;end;
 if (select count(*) from public.ask_kookie_episode_questions where episode_id='a5c00000-0000-4000-8000-000000000021')<>1 then raise exception 'FAIL links expose private peer question';end if;
end $$;
delete from public.ask_kookie_question_votes where public_question_id='a5c00000-0000-4000-8000-000000000031';
delete from public.ask_kookie_episode_views where episode_id='a5c00000-0000-4000-8000-000000000021';
do $$ begin if (select interest_count from public.ask_kookie_public_questions where id='a5c00000-0000-4000-8000-000000000031')<>0 then raise exception 'FAIL undo vote';end if;end $$;
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000003","role":"authenticated","session_id":"a5c00000-0000-4000-8000-000000000004","app_metadata":{"role":"teacher"}}',true);
update public.ask_kookie_episodes set status='draft' where id='a5c00000-0000-4000-8000-000000000021';
do $$ begin if exists(select 1 from public.ask_kookie_questions where id='a5c00000-0000-4000-8000-000000000011' and status='answered') then raise exception 'FAIL unpublished answer status';end if;end $$;
select set_config('request.jwt.claims','{"sub":"a5c00000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{}}',true);
do $$ begin
 if exists(select 1 from public.ask_kookie_episodes where id='a5c00000-0000-4000-8000-000000000021') then raise exception 'FAIL unpublished episode visible';end if;
 begin insert into public.ask_kookie_episode_views(episode_id) values('a5c00000-0000-4000-8000-000000000021');raise exception 'FAIL draft view accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin begin perform id from public.ask_kookie_episodes;raise exception 'FAIL anonymous API access';exception when insufficient_privilege then null;end;end $$;
reset role;
select 'PASS: identity, persistence, isolation, admin, notes, statuses, links, drafts, duplicate questions/votes/views, interest undo, anonymous denial; all fixtures rolled back' as result;
rollback;
