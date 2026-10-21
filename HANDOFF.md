# Handoff

## 2026-10-21 — Sincronização de progresso

- O fluxo agora limita cada tentativa completa de envio, interrompe requisições pendentes e mantém a cópia local em caso de resultado desconhecido.
- A gravação usa upsert por identificador do aluno e não limpa uma cópia pendente que tenha mudado durante o envio.
- A próxima validação é no aparelho afetado: abrir o portal atualizado, tocar em enviar e confirmar o estado “Salvo”.
