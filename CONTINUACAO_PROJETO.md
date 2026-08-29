# CONTINUACAO_PROJETO.md — Estado real do projeto

## Última auditoria
Data: 2026-08-14

## Estado confirmado a partir dos arquivos

### Concluído/reestruturado
- [x] `design-system.css`
- [x] `ui-kit.js`
- [x] `index.html` — novo visual aplicado.
- [x] `clientes.html` — novo visual aplicado.
- [x] `agendamentos.html` — KPIs do topo funcionais como filtros; correções de índice/validação/histórico aplicadas.
- [x] `Produtos.html` — novo visual aplicado; pesquisa, filtros, CRUD, backup/restore e índice filtrado corrigidos.
- [x] `clientes_pacote.html` — migrado para o design system preservando pacotes, histórico, cortesias, edição e backup/restore.
- [x] `entradas_e_saidas.html` — migrado para o design system preservando filtros, lançamentos, edição, fechamento e backup/restore.
- [x] `relatorio.html` — migrado para o design system preservando filtros, cálculo do relatório, persistência de filtros e backup/restore.

## Regras preservadas
- Não foram alteradas as chaves de `localStorage`.
- Não foi alterado intencionalmente o formato dos objetos persistidos.
- Projeto continua funcionando em `file://`; nenhuma dependência de servidor foi introduzida.
- Navegação usa os nomes reais dos arquivos, inclusive `Produtos.html`.

## Correções/ajustes desta continuação
1. `clientes_pacote.html`
   - Novo layout responsivo com sidebar/topbar, filtros, tabela horizontal rolável e modais modernos.
   - Mantidos pacotes ativos, cálculo de banhos, histórico, cortesias, edição do pacote, edição do histórico e backup/restore.
   - Preservado o índice real do pet para ações após filtros/ordenação.
   - Protegida a pesquisa quando telefone estiver ausente.
   - Botão adicional de edição de histórico recebeu classes do design system.
2. `entradas_e_saidas.html`
   - Novo layout com filtros, formulários de entrada/saída, tabela, fechamento e backup/restore.
   - Mantidos todos os IDs consumidos pela lógica existente.
   - Modal de edição adaptado ao design system.
3. `relatorio.html`
   - Novo layout com filtro de período, tabela financeira, total geral e backup/restore.
   - Mantidos os IDs e a persistência em `filtrosRelatorio`.
4. `agendamentos.html`
   - Ajustado o carregamento de dados da agenda para tratar `localStorage` com conteúdo inválido ou legado sem quebrar a página.
   - Adicionada sanitização do JSON e migração automática para a chave principal `agendamentos` quando uma chave alternativa contiver dados válidos.
   - Preservadas as regras de negócio de criação, filtro, status, pagamento, pacote e backup/restore.

## Validação executada
- JavaScript inline de `clientes_pacote.html`, `entradas_e_saidas.html` e `relatorio.html`: `node --check` OK.
- Verificação de IDs duplicados nas três páginas: nenhum encontrado.
- Verificação dos links antigos de capitalização: nenhum `Clientes.html`/`produtos.html` restante nessas páginas.
- Tentativa de validação Chromium headless foi feita, mas o processo excedeu o timeout do ambiente; portanto interação visual real em navegador continua pendente.

## Próxima etapa EXATA
1. Fazer uma auditoria global de todos os 7 HTMLs contra `design-system.css`/`ui-kit.js`.
2. Procurar funcionalidades quebradas, IDs/links inconsistentes e chamadas `alert/confirm` que ainda possam ser modernizadas sem alterar regras de negócio.
3. Revisar responsividade e consistência visual entre páginas.
4. Fazer uma última validação estática de todos os scripts e gerar o pacote final.


## Auditoria global — 2026-08-14 (continuação)

### Verificações executadas
- [x] Os 7 HTMLs carregam `design-system.css` e `ui-kit.js`.
- [x] JavaScript inline dos 7 HTMLs validado com `node --check`.
- [x] Nenhum ID duplicado encontrado nas 7 páginas.
- [x] Links internos `.html` verificados contra os nomes reais dos arquivos; nenhum link quebrado encontrado.
- [x] Não restaram chamadas nativas `alert()`/`confirm()` nas páginas; feedback usa `toast()` e confirmação usa `confirmarAcao()`.
- [x] Backup/restore existente foi preservado.
- [x] Chaves de `localStorage` existentes foram preservadas.

### Ajustes desta auditoria
1. `entradas_e_saidas.html`: feedback de validação/importação migrado de diálogos nativos para toasts; remoção de lançamento usa confirmação visual do UI Kit.
2. `clientes_pacote.html`: feedback de validação/importação migrado para toasts.
3. `relatorio.html`: feedback de importação migrado para toast e relatório ganhou filtro de unidade (Todas, Franco, Caieiras e Sem unidade/antigos) sem alterar o formato persistido de `filtrosRelatorio`.
4. Todas as páginas: subtítulo da marca deixou de indicar apenas Caieiras e passou a indicar `Franco + Caieiras`, coerente com o sistema multiunidade.
5. `agendamentos.html`: os rótulos das unidades não usam mais emojis como substitutos de ícones.

### Pontos de atenção
- `entradas_e_saidas.html` ainda trata lançamentos manuais como globais. Os lançamentos automáticos derivados de agendamentos também são agregados por data e não carregam unidade persistida. Não alterei esse modelo nesta auditoria para evitar risco de regressão. A evolução recomendada é criar uma camada de filtro por unidade para o financeiro sem modificar registros antigos.
- A validação interativa em navegador real permanece pendente; o teste headless anterior excedeu o timeout do ambiente.

### Próxima ação exata
1. Revisar a experiência multiunidade nas telas financeiras, começando por `entradas_e_saidas.html`, sem migrar dados antigos.
2. Depois fazer revisão final de responsividade/acessibilidade e preparar pacote de homologação.

## ETAPA 5 — NOVA VISUALIZAÇÃO DA AGENDA
- Implementada visualização híbrida em `agendamentos.html` sem alterar o modelo de dados.
- Modos: Dia, Semana, Mês e Lista.
- Unidade continua filtrando todos os modos: Franco da Rocha, Caieiras e Antigos/Sem unidade.
- Filtros existentes (pet, dono, status e período) continuam sendo aplicados antes da renderização.
- Cards/KPIs continuam funcionando como filtros.
- Edição, exclusão e alteração de status continuam usando os mesmos índices reais dos agendamentos.
- Agendamentos antigos sem unidade permanecem intactos.
- A visualização selecionada é lembrada em `agendaView`; dados existentes não são migrados.
- A visualização de Lista foi preservada como fallback operacional.
- Validação sintática dos scripts da página: OK.
- Teste visual headless foi tentado, mas o Chromium do ambiente excedeu o timeout; não considerar isso como validação visual completa.


## AUDITORIA DE NAVEGAÇÃO E DUPLICIDADE — 2026-08-14

### Verificações
- [x] Auditado o pacote atual antes de novas alterações.
- [x] Identificada uma segunda página HTML `agendamentos_backup.html`; ela era uma cópia histórica e não possuía referências internas. Removida do pacote consolidado para manter `agendamentos.html` como única página oficial de agendamentos.
- [x] Confirmado que `agendamentos.html` é o arquivo oficial de agendamentos.
- [x] Adicionado o link `dashboard_financeiro.html` à navegação de `index.html`, `clientes.html`, `agendamentos.html` e `Produtos.html`, que estavam sem o item Dashboard.
- [x] Mantidos os links de Dashboard já presentes em `clientes_pacote.html`, `entradas_e_saidas.html` e `relatorio.html`.
- [x] Nenhum arquivo foi renomeado para alterar chaves ou modelo de dados.

### Observação sobre o Dashboard
O problema relatado como “href não responsivo” foi identificado, nesta auditoria, como inconsistência de navegação: algumas páginas não tinham o link `dashboard_financeiro.html` na sidebar. A navegação agora usa o mesmo destino real em todas as páginas.

### Próxima ação exata
1. Homologar visualmente a navegação entre as 8 páginas oficiais.
2. Revisar responsividade da sidebar/topbar, especialmente o item Dashboard em larguras menores.
3. Somente depois retomar a evolução do financeiro e da agenda.


## AUDITORIA COMPLETA E PREPARAÇÃO PARA MIGRAÇÃO — 2026-08-17

### Resultado
- [x] Auditoria realizada sobre o pacote atual.
- [x] 8 páginas HTML oficiais confirmadas.
- [x] `agendamentos.html` confirmado como única página oficial de agendamentos.
- [x] JavaScript inline validado com `node --check` em todas as páginas.
- [x] Links internos comparados com os arquivos reais.
- [x] `design-system.css` e `ui-kit.js` confirmados.
- [x] Viewport responsivo presente em todas as páginas.
- [x] Chaves de `localStorage` inventariadas.
- [x] Nenhuma integração Google Sheets/API existente no frontend.
- [x] Nenhuma chamada `fetch()` existente no pacote atual.
- [x] Estratégia de preservação dos registros antigos sem unidade confirmada.

### Estado da migração
O frontend está pronto para a fase de preparação da migração, mas o `localStorage` ainda deve permanecer como fallback durante a implementação.

### Arquitetura aprovada para a próxima fase
`Frontend Netlify -> API Google Apps Script -> Google Sheets`

O frontend não deverá armazenar credenciais Google.

### Próxima ação exata
1. Inventariar os registros reais do localStorage/backup.
2. Definir esquema final das abas Google Sheets.
3. Criar importador do backup atual.
4. Criar API Apps Script.
5. Criar `dataService.js` para desacoplar as páginas da fonte de dados.
6. Migrar uma página por vez, começando por Clientes/Pets.
7. Manter localStorage como fallback até a homologação.
8. Só depois ativar produção no Netlify.

### Documento detalhado
Consultar `AUDITORIA_COMPLETA_E_PREPARACAO_MIGRACAO.md`.

### Observação
A validação visual automática em navegador não foi concluída neste ambiente por ausência do executável Chromium do Playwright. Portanto, a homologação em celular real e desktop continua sendo requisito antes da publicação.

## INVENTÁRIO REAL DO BACKUP — 2026-08-17
- Pets: 596
- Agendamentos: 2.157
- Serviços: 43
- Produtos: 28
- Entradas/Saídas: 331
- Agendamentos legados sem unidade: 2.157
- Financeiro legado sem unidade: 331

### Artefatos de staging
Ver pasta `migracao/`.

### Próximo checkpoint
Criar planilha de HOMOLOGAÇÃO no Google Sheets, importar os CSVs e validar contagens antes de qualquer conexão do frontend com a API.

## ETAPA — CRIAÇÃO DO APPS SCRIPT DE IMPORTAÇÃO (HOMOLOGAÇÃO) — 2026-08-17

### O que foi feito
- Auditado o ZIP `LanePets_PROJETO_COMPLETO_ETAPA_MIGRACAO.zip` recebido.
- Confirmado que o backup dentro do ZIP (`migracao/backup_original/backup-petshop (2).json`)
  é idêntico (mesmo MD5) ao arquivo `backup-petshop (2).json` enviado separadamente.
- Recontados os CSVs de staging com parser CSV real (respeitando campos `_json` com
  quebras de linha internas — `wc -l` sozinho subestima/superestima essas contagens).
- Criado `Code.gs` (Google Apps Script) para a planilha `LANE PETS — BANCO HOMOLOGAÇÃO`.
- Criado `README_APPS_SCRIPT.md` com instruções de instalação e uso.

### Validado
- Contagens dos CSVs de staging batem exatamente com `INVENTARIO_REAL.md`:
  Pets 596/596, Agendamentos 2157/2157, Serviços 43/43, Produtos 28/28,
  Entradas/Saídas 331/331.
- Coluna `unidade` vazia em 100% dos 2.157 agendamentos e dos 331 registros
  financeiros do staging (nenhuma atribuição automática de Franco/Caieiras).
- IDs de todos os CSVs são únicos, não vazios e com prefixo estável
  (`PET-`, `AGD-`, `SRV-`, `PRD-`, `FIN-`) — não há necessidade de gerar novos
  IDs nem de usar número de linha da planilha.
- Cabeçalhos dos 5 CSVs de staging conferem exatamente com o modelo de abas
  definido na seção 12 do prompt de retomada (usado como schema oficial do
  `Code.gs`, substituindo o schema alternativo sugerido em
  `AUDITORIA_COMPLETA_E_PREPARACAO_MIGRACAO.md`, que não bate com os CSVs
  já gerados).

### O que o Code.gs faz
- Menu "Lane Pets" na planilha com: configurar pasta do Drive, criar
  estrutura, importar CSVs, executar homologação completa, validar
  contagens, e limpar base de homologação (só sob confirmação explícita).
- Cria as 8 abas do modelo (`pets`, `agendamentos`, `servicos`, `produtos`,
  `pacotes`, `entradasESaidas`, `configuracoes`, `auditoria`) com cabeçalhos.
- Importa os 5 CSVs que já existem em staging; `pacotes`, `configuracoes`
  e `auditoria` ficam só com estrutura, sem CSV de origem ainda.
- Valida contagem por aba e confirma "0 registros com unidade legada" em
  `agendamentos` e `entradasESaidas`.
- Cada ação é registrada na aba `auditoria` (ação, entidade, quantidade).
- NÃO publica Web App/API. NÃO altera o backup original nem os CSVs.

### Problemas encontrados
- Nenhuma divergência de contagem encontrada nos CSVs de staging em relação
  ao inventário documentado.
- As 2 duplicidades já conhecidas (`servicos`: Ozônio; `entradasESaidas`:
  combustível 17/06) continuam pendentes de revisão manual — o importador
  as traz normalmente, sem excluir nada automaticamente.

### O que falta
- Rodar o `Code.gs` de fato dentro de uma planilha Google Sheets real
  (esta etapa só preparou e validou o script localmente/estruturalmente;
  a execução dentro do Google Sheets precisa ser feita pelo usuário).
- Revisar manualmente as 2 duplicidades apontadas.
- Só depois disso: criar a API (Apps Script `doGet`/`doPost`), sem publicar
  ainda para o frontend.
- Criar `dataService.js`.
- Migrar `clientes.html` como primeira página, mantendo `localStorage`
  como fallback.

### Próxima etapa EXATA
1. Usuário cria a planilha "LANE PETS — BANCO HOMOLOGAÇÃO" no Google Sheets.
2. Cola o `Code.gs` em Extensões → Apps Script.
3. Envia os 5 CSVs de staging para uma pasta do Google Drive.
4. Roda o menu "Lane Pets → Executar homologação completa".
5. Confirma que a validação retorna todas as contagens OK.
6. Só então avançar para a criação da API (Apps Script `doGet`/`doPost`),
   ainda sem publicar para o frontend.
