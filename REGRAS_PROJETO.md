# REGRAS_PROJETO.md — Lane Pets

## Objetivo
Transformar o sistema atual de cadastro/agendamento do Pet Shop em uma aplicação visualmente profissional, moderna e responsiva, sem quebrar as funcionalidades existentes.

## Arquitetura atual confirmada
- Projeto 100% front-end estático.
- 7 páginas HTML independentes.
- JavaScript vanilla inline nas páginas.
- Persistência em `localStorage`.
- CSS compartilhado parcialmente por `design-system.css`.
- Componentes/feedback compartilhados parcialmente por `ui-kit.js`.
- Sem backend/build/framework identificado.

## Arquivos
- `index.html` — Cadastro de pets/serviços; já usa o novo design system.
- `clientes.html` — Clientes; já usa o novo design system.
- `agendamentos.html` — Agendamentos; já foi parcialmente/majoritariamente reestruturado e deve ser auditado antes de ser considerado concluído.
- `Produtos.html` — Produtos; ainda usa a implementação visual antiga.
- `clientes_pacote.html` — Clientes/Pacotes; ainda usa a implementação visual antiga.
- `entradas_e_saidas.html` — Entradas e Saídas; ainda usa a implementação visual antiga.
- `relatorio.html` — Relatório Financeiro; ainda usa a implementação visual antiga.
- `design-system.css` — novo sistema visual compartilhado.
- `ui-kit.js` — toasts, confirmação, menu mobile e estados de botão.

## Regras obrigatórias
1. Não remover funcionalidades existentes.
2. Não migrar o modelo de dados nesta fase.
3. Não trocar de framework/stack.
4. Não criar backend.
5. Não criar dados fictícios.
6. Não alterar chaves de `localStorage` sem uma necessidade explicitamente aprovada.
7. Não renomear IDs usados pelo JavaScript sem mapear todas as referências.
8. Não alterar o formato dos objetos persistidos sem migration planejada.
9. Reutilizar `design-system.css` e `ui-kit.js`.
10. Evitar CSS duplicado dentro das páginas.
11. Corrigir navegação inconsistente de nomes de arquivos (`Produtos.html` vs `produtos.html`, `clientes.html` vs `Clientes.html`) usando os nomes reais dos arquivos, sem duplicá-los.
12. Validar JavaScript com `node --check` sempre que houver alteração relevante.
13. Ao terminar cada página, atualizar `CONTINUACAO_PROJETO.md`.
14. Se o contexto/limite estiver próximo do fim, executar o procedimento de checkpoint descrito em `PROMPT_CHECKPOINT.md`.
15. Não considerar uma página concluída apenas porque o visual foi alterado: lógica e navegação também precisam ser verificadas.

## Modelo de dados atual — não migrar agora
Chaves identificadas:
- `pets`
- `agendamentos`
- `servicos`
- `produtos`
- `entradasESaidas`
- `filtrosAgendamento`
- `filtrosRelatorio`

Observação importante: `clientes.html` deriva/lista clientes a partir dos dados em `pets`; não implementar ainda uma separação `clientes[]` + `pets[]`.

## Funcionalidades críticas
### `agendamentos.html`
Preservar criação, edição, exclusão, filtros, status, pagamento, seleção de dono/pet, serviços, pacotes, datas/horários, backup/restore e qualquer regra existente.

### `index.html`
Preservar cadastro de pet, cadastro/edição/exclusão de serviços e edição de agendamento existente, além de backup/restore.

### `clientes.html`
Preservar listagem, edição e backup/restore.

### `Produtos.html`
Preservar cadastro, edição, exclusão, listagem, formatação monetária e backup/restore.

### `clientes_pacote.html`
Preservar pacotes, histórico de banhos, datas, status, edição/remoção/adição de histórico e backup/restore.

### `entradas_e_saidas.html`
Preservar leitura/gravação de `entradasESaidas`, integração com entradas de agendamentos, filtros por datas, relatórios e edição.

### `relatorio.html`
Preservar geração de relatório, filtros e backup/restore.

## Direção visual
- Manter a identidade criada em `design-system.css`.
- Tipografia: Manrope/Inter.
- Paleta principal: petróleo/verde + destaque mango.
- Sidebar/topbar/cards/tabelas/badges/modais/toasts consistentes.
- Responsivo em 360px, 480px, 768px, 1024px, 1280px e 1440px.
- Sem excesso de animações.
- Não usar emojis como substitutos de ícones profissionais.
- Imagens somente quando agregarem valor.

## Critério de conclusão
Uma página só pode ser marcada como concluída quando:
- visual novo aplicado;
- lógica preservada;
- navegação funcionando;
- localStorage preservado;
- JavaScript validado;
- estados de erro/vazio razoáveis;
- responsividade revisada;
- nenhum placeholder introduzido.
