# Ask Kookie! — Pequenas dúvidas. Grandes descobertas.

Módulo integrado ao portal existente, sem segundo login, novo projeto Supabase ou respostas automáticas por IA.

## Arquitetura e segurança

- Reutiliza `sbClient`, Supabase Auth, UUID autenticado, `currentUser`, navegação e painel existentes.
- O banco atribui `user_id` por `auth.uid()`. O cliente não escolhe a identidade do aluno nem o status administrativo.
- Administração usa `progress_teacher_authorized()`: papel teacher nos metadados assinados, metadados atuais do servidor e sessão existente.
- Migração versionada `supabase/migrations/20261126160000_ask_kookie.sql`, aplicada e registrada no projeto existente. Não reaplicar nem executar indiscriminadamente migrações antigas deste checkout.
- Seis tabelas com RLS: perguntas privadas, versões públicas revisadas/anônimas, episódios, vínculos, interesses e marcações de assistido. Notas internas têm leitura administrativa restrita.
- Bucket `ask-kookie` privado, até 100 MiB. Alunos leem apenas arquivos referenciados por episódios publicados. URLs assinadas duram uma hora; despublicar não revoga URLs já emitidas antes de seu vencimento.
- Nenhuma chave privilegiada no frontend. Supabase, vídeos e legendas seguem pela rede, fora do cache compartilhado da PWA.

## Uso

Aluno: episódios aparecem primeiro, com pesquisa, categorias e miniaturas. Envio privado de dúvidas com confirmação do servidor, prevenção de duplo clique e deduplicação no banco. Minhas dúvidas mostra apenas a própria conta. Perguntas públicas são versões separadas, anônimas e revisadas manualmente. Interesse pode ser registrado uma vez por conta e desfeito.

Professora: filtros, status, notas, arquivamento, grupos de perguntas semelhantes, versões públicas, indicadores e editor de episódios. O RPC de salvamento grava episódio e vínculos em uma transação. Publicar responde às dúvidas relacionadas; despublicar/desvincular retorna a dúvida à análise se não houver outra resposta publicada.

Vídeo carrega ao abrir o episódio, com `controls`, `playsinline` e `preload=none`. Assistido é uma marcação explícita por aluno/episódio, com evento no uso existente; não certifica reprodução completa, não concede XP e não modifica notas.

## Episódio 01 e próximos vídeos

1. Entrar com a conta da professora, abrir **Ask Kookie!** e **Editar episódio**.
2. Enviar MP4 H.264/AAC ou WebM, até 100 MiB, ou informar URL HTTPS direta. Links de páginas do Drive/YouTube não são arquivos de vídeo.
3. Preencher título, categoria, descrição e duração em segundos. Miniatura até 5 MiB e legenda WebVTT até 1 MiB são opcionais, assim como explicação, exemplos, transcrição e desafio.
4. Selecionar dúvidas relacionadas, salvar como **Rascunho** e conferir o player.
5. Selecionar **Publicado** e salvar para disponibilizar a todos os alunos autenticados. Para retirar da biblioteca, salvar novamente como **Rascunho**.

O episódio 01 usa `storage:episode-01-do-does.mp4`, duração de cadastro 66 s. O arquivo real tem 66,081156 s, 720 × 1280, H.264/AAC e 24.817.696 bytes. A cópia fast start preserva áudio/vídeo sem reencodificação. MP4 não integra o Git nem o precache.

`episode-01-do-does.webp` é um frame real do vídeo (76.224 bytes), usado como miniatura/poster quando o cadastro não informa outra imagem. `kookie-hero.webp` é a arte aprovada com balão de dúvidas, derivada da referência visual, otimizada para 102.488 bytes. O arquivo original do anexo não foi recuperado; `kookie-original.webp` continua reservado para preservá-lo quando disponível.

## Publicação e validação

A integração parte do main `a52f54e0e6939d61acd415e31cff8cdd3d5393ff`, preservando leitura, áudio, progresso e demais alterações publicadas. Cache da entrega: `ap-english-v141`; JS/CSS do módulo: `20261126.3`.

- `scripts/ask-kookie.test.cjs`: sintaxe, navegador com transporte simulado, confirmação/falha de envio, duplicatas, troca de conta, interesse/desfazer, filtros, edição, vínculos, prévia, mobile/desktop e navegação integrada.
- Testes da PWA e áudio verificam atualização protegida, cache e Range. Formulários pendentes/envios adiam a atualização. Navegação pausa o player e troca de conta limpa dados privados em memória.
- `supabase/tests/ask-kookie-rls.sql`: executado no PostgreSQL real; identidade, persistência, isolamento, administração, notas, status, vínculos, publicação/despublicação e unicidade. Fixtures removidas por ROLLBACK.
- Login da professora pelo Auth real e reprodução do vídeo privado por URL assinada conferidos no Chrome, com tempo avançando, duração correta e erro nulo.

Limites: claims SQL definidos diretamente não substituem login de duas contas reais. Android/iOS físicos e legendas reais ainda não foram validados. Fixtures existem somente nos testes, sem fallback fictício de produção.

Não há fila offline de perguntas: falhas preservam o texto em memória, mas fechar/recarregar antes do envio pode descartá-lo. Listas atualizam ao abrir, após ações ou manualmente; sem notificações automáticas. Uploads não associados podem exigir limpeza administrativa; sem exclusão automática de órfãos.

Advisors não apontaram novos problemas para o módulo. Permanecem observações anteriores: helper administrativo DEFINER booleano público, proteção de senhas vazadas desativada, tabelas privadas de áudio sem políticas e escrita pública em `app_content`, não usada pelo módulo. Permissões antigas não foram alteradas.
