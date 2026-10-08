-- Indicadores pedagógicos agregados por aluno.
-- Não registra localização, IP, aparelho ou conteúdo digitado pelo estudante.
alter table public.student_progress
  add column if not exists usage jsonb not null default '{}'::jsonb;

comment on column public.student_progress.usage is
  'Resumo de uso pedagógico: sessões, tempo ativo estimado, áreas e atividades recentes.';
