# Handoff

## 2026-10-21 — Sincronização de progresso

- O fluxo agora limita cada tentativa completa de envio, interrompe requisições pendentes e mantém a cópia local em caso de resultado desconhecido.
- A gravação usa upsert por identificador do aluno e não limpa uma cópia pendente que tenha mudado durante o envio.
- A próxima validação é no aparelho afetado: abrir o portal atualizado, tocar em enviar e confirmar o estado “Salvo”.


## 1984 — semanas 1–3, integração em 2026-10-22

- Leitor isolado em assets/reading/reader-1984.js e .css; pacotes estruturados em livros/1984/app/.
- História contínua antes das atividades; compreensão, vocabulário, gramática, reflexões por escolha;
  speaking/writing opcionais. Semana 3 inclui ordenação dos acontecimentos.
- Continuação exige concluir a semana anterior; marcadores reading__1984_wN_* não reutilizam
  os marcadores de A Metamorfose. Preserva progresso antigo; retomada por conta/semana e XP sem duplicação.
- Dicionário offline cobre todas as palavras da abertura, narrativa e encerramento das três semanas;
  diálogo acessível preserva posição/foco. Ilustrações comprimidas em WebP, mantendo os originais.
- Biblioteca/home mostram 1984; prazo de seis semanas: 21/10 até 01/12/2026 inclusive.
  Semanas 4–6 ainda não fornecidas. Painel identifica o progresso do novo livro.
- Avisos antigos substituídos por reconhecimento somente nas turmas confirmadas pela professora;
  exceção manual serve apenas ao reconhecimento e não altera progresso individual.
- Consulta externa dos concluintes recusada com HTTP 401; nenhuma permissão alterada, nenhuma
  nova tentativa. Lista confirmada pelos prints e pela professora; não há leitura de colegas no cliente.
- Testes: 3 testes de conteúdo/sintaxe aprovados; fluxo no Chrome com dados fictícios cobriu as três
  semanas, bloqueios, erros/acertos, ordenação, retomada, XP único, troca de conta, prévia sem escritas,
  reconhecimento por turma, dicionário offline e largura mobile. Smoke no portal completo aprovado.
- Publicação selecionada a partir do HEAD; pendências anteriores de autenticação, sincronização,
  relatórios e Body Parts preservadas fora desta alteração. Cache da leitura: ap-english-v129.
- Nenhum teste escreveu no Supabase ou em planilha real. Sincronização remota depende do fluxo
  existente do portal; testes desta entrega não comprovam gravação real no backend.

## 1984 — áudio, respostas e escrita opcional, 2026-10-22

- O capítulo agora pode ser ouvido em inglês pela voz disponível no aparelho; há controle para parar a leitura.
- Cada alternativa fica bloqueada ao ser escolhida. Quick Check e Language Check exigem mais de metade das
  respostas corretas; com 50% ou menos, o aluno revisa o capítulo e inicia uma nova tentativa da etapa.
- A missão final inclui um campo opcional para pensamentos, salvo apenas neste aparelho. Cache previsto: ap-english-v130.

## 1984 — pensamentos finais no relatório, 2026-10-22

- Ao concluir a semana, o texto de pensamentos finais e conclusão entra no histórico de atividades do aluno
  e é sincronizado com o progresso; o painel da professora mostra o texto completo ao abrir o relatório do aluno.
- A atividade sem texto continua registrando apenas a conclusão do capítulo. Cache previsto: ap-english-v131.
