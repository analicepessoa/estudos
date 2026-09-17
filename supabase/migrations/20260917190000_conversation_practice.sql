-- Conversation Practice — Etapa 3: sessões e mensagens do próprio aluno.
-- Não armazena chaves nem dados de autenticação; user_id vem de auth.users.

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  mode text not null default 'text' check (mode in ('text', 'speaking')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(trim(content)) > 0),
  corrections jsonb not null default '[]'::jsonb check (jsonb_typeof(corrections) = 'array'),
  vocabulary jsonb not null default '[]'::jsonb check (jsonb_typeof(vocabulary) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists conversation_sessions_user_started_at_idx
  on public.conversation_sessions (user_id, started_at desc);

create index if not exists conversation_messages_session_created_at_idx
  on public.conversation_messages (session_id, created_at);

alter table public.conversation_sessions enable row level security;
alter table public.conversation_messages enable row level security;

grant select, insert, update, delete on public.conversation_sessions to authenticated;
grant select, insert, update, delete on public.conversation_messages to authenticated;

create policy "Students can read their own conversation sessions"
  on public.conversation_sessions for select to authenticated
  using (auth.uid() = user_id);

create policy "Students can create their own conversation sessions"
  on public.conversation_sessions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Students can update their own conversation sessions"
  on public.conversation_sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Students can delete their own conversation sessions"
  on public.conversation_sessions for delete to authenticated
  using (auth.uid() = user_id);

create policy "Students can read messages from their own sessions"
  on public.conversation_messages for select to authenticated
  using (
    exists (
      select 1
      from public.conversation_sessions session
      where session.id = conversation_messages.session_id
        and session.user_id = auth.uid()
    )
  );

create policy "Students can create messages in their own sessions"
  on public.conversation_messages for insert to authenticated
  with check (
    exists (
      select 1
      from public.conversation_sessions session
      where session.id = conversation_messages.session_id
        and session.user_id = auth.uid()
    )
  );

create policy "Students can update messages in their own sessions"
  on public.conversation_messages for update to authenticated
  using (
    exists (
      select 1
      from public.conversation_sessions session
      where session.id = conversation_messages.session_id
        and session.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conversation_sessions session
      where session.id = conversation_messages.session_id
        and session.user_id = auth.uid()
    )
  );

create policy "Students can delete messages from their own sessions"
  on public.conversation_messages for delete to authenticated
  using (
    exists (
      select 1
      from public.conversation_sessions session
      where session.id = conversation_messages.session_id
        and session.user_id = auth.uid()
    )
  );
