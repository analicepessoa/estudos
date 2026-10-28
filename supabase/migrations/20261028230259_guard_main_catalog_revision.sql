-- Only the main curriculum row uses this revision protocol.
-- The client echoes the revision it loaded; the server assigns the next one.
create or replace function public.guard_main_catalog_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $guard$
begin
  if TG_OP = 'DELETE' then
    if OLD.id = 'main' and current_user in ('anon','authenticated') then
      raise exception using errcode = '42501', message = 'O catálogo principal não pode ser removido pelo aplicativo.';
    end if;
    return OLD;
  end if;

  if OLD.id <> 'main' and NEW.id <> 'main' then
    return NEW;
  end if;

  if current_user in ('anon','authenticated') then
    if current_user <> 'authenticated' or auth.uid() is null
       or (auth.jwt()->'app_metadata'->>'role') is distinct from 'teacher' then
      raise exception using errcode = '42501', message = 'Somente a professora pode editar o catálogo.';
    end if;
    if NEW.id is distinct from OLD.id or NEW.updated_at is distinct from OLD.updated_at then
      raise exception using errcode = '40001', message = 'CATALOG_REVISION_CONFLICT: atualize o Portal antes de editar.';
    end if;
  end if;

  NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at + interval '1 microsecond');
  return NEW;
end;
$guard$;

revoke all on function public.guard_main_catalog_revision() from public, anon, authenticated;

create trigger guard_main_catalog_revision
before update or delete on public.app_content
for each row execute function public.guard_main_catalog_revision();

comment on function public.guard_main_catalog_revision() is
'Protects only app_content/main: teacher JWT required for Data API writes, loaded updated_at must be echoed, and the server advances the revision. Other rows and student_progress are unchanged.';
