# PLANO_IMPLEMENTACAO.md

## Fase 1 — Consolidar o que já existe
1. Auditar `agendamentos.html` já reestruturado.
2. Corrigir links inconsistentes de capitalização.
3. Confirmar que `index.html` e `clientes.html` continuam funcionando.
4. Não alterar o modelo de dados.

## Fase 2 — Produtos
- importar `design-system.css`;
- importar `ui-kit.js`;
- preservar todas as funções atuais;
- modernizar tabela/cards;
- modernizar formulário e modal;
- melhorar estados vazios/erros;
- responsividade;
- validar JS.

## Fase 3 — Clientes/Pacotes
- preservar histórico de banhos;
- preservar status e cálculo de pacotes;
- aplicar design system;
- melhorar modais e filtros;
- responsividade;
- validar JS.

## Fase 4 — Entradas e Saídas
- preservar integração com agendamentos;
- preservar filtros de data;
- modernizar indicadores/tabela;
- melhorar edição e feedback;
- responsividade;
- validar JS.

## Fase 5 — Relatório
- preservar `gerarRelatorio`;
- preservar filtros;
- usar dados reais;
- modernizar cards/tabelas/visualizações;
- responsividade;
- validar JS.

## Fase 6 — Auditoria global
- navegação;
- consistência visual;
- links;
- localStorage;
- backup/restore;
- console;
- responsividade;
- acessibilidade básica;
- ausência de placeholders/dados falsos.

## Fase 7 — Futuro, somente depois
- dashboard real;
- migração segura para `clientes[]` + `pets[]`;
- backup automático;
- IndexedDB;
- backend/autenticação, se desejado.

Não executar a Fase 7 junto com a Fase 2-6.
