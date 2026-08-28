# INVENTÁRIO REAL DO BACKUP

## Resumo
- Pets: **596**
- Agendamentos: **2157**
- Serviços: **43**
- Produtos: **28**
- Entradas/Saídas: **331**

## Situação das unidades
- Agendamentos com unidade no backup: **0**
- Agendamentos sem unidade: **2157**
- Financeiro com unidade no backup: **0**
- Financeiro sem unidade: **331**

### Regra de segurança
Nenhum registro legado recebeu Franco ou Caieiras automaticamente. A coluna `unidade` fica vazia para posterior decisão/migração manual.

## Status dos agendamentos
- Entregue: 2071
- Em processo: 22
- Pendente: 46
- Pronto: 18

## Financeiro
- Saída: 264
- Entrada: 67

## Observações
- O backup usa valores JSON serializados nas chaves principais.
- Não existem IDs persistentes nos objetos legados; a etapa de staging gera IDs estáveis dentro desta migração.
- Os objetos aninhados de serviços/pacotes são preservados como JSON nas colunas `_json`.
- Há 1 duplicidade conservadora em serviços e 1 em entradas/saídas; elas devem ser revisadas antes da importação definitiva.
