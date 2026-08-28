# PROMPT_CHECKPOINT.md

Use este prompt antes de uma sessão terminar ou quando o limite de uso estiver próximo.

---
ANTES DE CONTINUAR IMPLEMENTANDO, FAÇA UM CHECKPOINT DO PROJETO.

Leia `REGRAS_PROJETO.md` e `CONTINUACAO_PROJETO.md`.

Agora analise o estado REAL dos arquivos neste momento.

Atualize `CONTINUACAO_PROJETO.md` sem inventar informações.

Registre:
1. arquivos concluídos;
2. arquivos parcialmente concluídos;
3. última alteração realmente feita;
4. funcionalidades preservadas;
5. testes realmente executados;
6. problemas encontrados;
7. alterações que ficaram incompletas;
8. dependências novas;
9. qualquer risco de regressão;
10. a PRÓXIMA AÇÃO EXATA.

Não marque uma tarefa como concluída se ela não estiver realmente concluída.

Se alguma alteração estiver parcialmente implementada, descreva exatamente o ponto em que parou.

Depois do checkpoint, se ainda houver contexto suficiente, continue o trabalho normalmente.
---

## Quando o limite acabar

Na nova conversa, envie:

Leia `REGRAS_PROJETO.md` e `CONTINUACAO_PROJETO.md`.

Analise os arquivos atuais e confirme o estado real.

Não recomece o projeto.
Não refaça trabalho concluído.
Não altere o modelo de dados.
Continue pela `PRÓXIMA AÇÃO EXATA` registrada no checkpoint.

Execute a implementação diretamente nos arquivos.

Ao concluir a próxima tarefa, atualize `CONTINUACAO_PROJETO.md`.
