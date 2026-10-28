# Edição do catálogo após a recuperação

A edição da professora foi reativada após recuperar app_content/main. O servidor exige a conta autenticada com app_metadata.role=teacher para alterar essa linha. Alunos e versões antigas do Portal não podem sobrescrevê-la.

## Protocolo

- loadCloudDB lê data e updated_at da fonte oficial e substitui os sete campos do catálogo, inclusive listas vazias e turmas excluídas. Cache/defaults não habilitam gravações.
- Cada save captura uma cópia da edição e entra na fila da página.
- O update exige id=main e updated_at igual à revisão carregada; o payload ecoa essa mesma revisão.
- O trigger guard_main_catalog_revision valida a professora e o eco da revisão, e atribui uma revisão nova pelo relógio do servidor.
- Upsert antigo com timestamp novo é recusado. Conflito ou resultado incerto bloqueia novas tentativas até reabrir o Portal.
- Campos fora do catálogo, como studentControls, são preservados. A linha student_controls e a tabela student_progress não foram alteradas.
- O rascunho local guarda somente campos/turmas modificados em english_hub_catalog_draft_v1. Não há reenvio automático. Falta de espaço impede a gravação e mantém o formulário para copiar o texto.
- O formulário de aulas só fecha e anuncia sucesso após confirmação. Erro preserva os campos e restaura a lista anterior na memória.
- O backup local english_hub_db_recovery_20261028 e a página recuperar-catalogo.html permanecem.

## Validação

- 29 verificações de JavaScript: carregamento obrigatório, dados incompletos, listas vazias, acesso de aluno, revisão divergente, fila, falha de rede, erro do servidor, falta de espaço, preservação de campos e comportamento do formulário.
- 8 verificações no PostgreSQL com tabelas temporárias e o trigger real: professora, aluno, anônimo, upsert antigo, exclusão, conflito e controles separados.
- Hash, revisão e contagens do catálogo real permaneceram idênticos após os testes.
- Testes reproduzíveis: node scripts/catalog-save.test.cjs. SQL: scripts/catalog-save-guard.test.sql (fixtures temporárias, sem alterar o catálogo).
- Cache PWA v139.
