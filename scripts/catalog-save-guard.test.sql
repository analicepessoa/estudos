begin;
-- Isolated fixtures: no live catalog or student-progress writes.
create temporary table catalog_guard_test (like public.app_content including all) on commit drop;
create temporary table catalog_guard_results (test text) on commit drop;
insert into catalog_guard_test(id,data,updated_at) values
  ('main','{"turmas":{"r":{}},"semanas":{"r":[{"title":"Original"}]}}','2026-10-28T15:00:00Z'),
  ('student_controls','{"students":{}}','2026-10-28T15:00:00Z');
create trigger catalog_guard_test before update or delete on catalog_guard_test
for each row execute function public.guard_main_catalog_revision();
grant all on catalog_guard_test, catalog_guard_results to anon, authenticated;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"teacher"}}',true);
do $tests$
declare revision timestamptz; affected integer;
begin
  select updated_at into revision from catalog_guard_test where id='main';
  update catalog_guard_test set data=data||'{"newLesson":true}',updated_at=revision
  where id='main' and updated_at=revision;
  get diagnostics affected = row_count;
  if affected<>1 or not exists(select 1 from catalog_guard_test where id='main' and updated_at>revision and data->>'newLesson'='true')
    then raise exception 'Teacher save failed'; end if;
  insert into catalog_guard_results values('teacher save advances revision and keeps data');

  update catalog_guard_test set data='{}',updated_at=revision where id='main' and updated_at=revision;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Stale CAS overwrite succeeded'; end if;
  insert into catalog_guard_results values('stale conditional update affects zero rows');

  begin
    insert into catalog_guard_test(id,data,updated_at) values('main','{}',clock_timestamp())
    on conflict(id) do update set data=excluded.data,updated_at=excluded.updated_at;
    raise exception 'Legacy upsert was accepted';
  exception when serialization_failure then
    insert into catalog_guard_results values('legacy full upsert is refused');
  end;

  begin
    delete from catalog_guard_test where id='main';
    raise exception 'Main deletion was accepted';
  exception when insufficient_privilege then
    insert into catalog_guard_results values('main row deletion is refused');
  end;
end;
$tests$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{}}',true);
do $tests$
begin
  begin
    update catalog_guard_test set data='{}' where id='main';
    raise exception 'Student catalog write was accepted';
  exception when insufficient_privilege then
    insert into catalog_guard_results values('student main write is refused');
  end;
  update catalog_guard_test set data='{"students":{"fixture":true}}' where id='student_controls';
  if not exists(select 1 from catalog_guard_test where id='student_controls' and data->'students'->>'fixture'='true')
    then raise exception 'Non-main row unexpectedly blocked'; end if;
  insert into catalog_guard_results values('separate control row is unchanged by guard');
end;
$tests$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $tests$
begin
  begin
    update catalog_guard_test set data='{}' where id='main';
    raise exception 'Anonymous catalog write was accepted';
  exception when insufficient_privilege then
    insert into catalog_guard_results values('anonymous main write is refused');
  end;
  if not exists(select 1 from catalog_guard_test where id='main' and data->'semanas'->'r'->0->>'title'='Original')
    then raise exception 'Original fixture lost'; end if;
  insert into catalog_guard_results values('rejected writes preserve original lesson');
end;
$tests$;
reset role;
select count(*) as passed, jsonb_agg(test order by test) as tests from catalog_guard_results;

rollback;
