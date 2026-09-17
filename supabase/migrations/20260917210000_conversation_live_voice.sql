-- Conversation Practice — Live Voice: reaproveita as sessões e mensagens existentes.
-- Nenhum áudio bruto é persistido; apenas transcrições finalizadas.

alter table public.conversation_sessions
  drop constraint if exists conversation_sessions_mode_check;

alter table public.conversation_sessions
  add constraint conversation_sessions_mode_check
  check (mode in ('text', 'speaking', 'live_voice'));
