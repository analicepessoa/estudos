-- Conversation Practice — relatório final de cada sessão.

alter table public.conversation_sessions
  add column if not exists report jsonb;

alter table public.conversation_sessions
  drop constraint if exists conversation_sessions_report_check;

alter table public.conversation_sessions
  add constraint conversation_sessions_report_check
  check (report is null or jsonb_typeof(report) = 'object');
