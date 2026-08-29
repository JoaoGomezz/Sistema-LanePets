# LANE PETS — ETAPA 3A.1

## O que foi preparado

A planilha foi normalizada para introduzir:

- `clientes`
- `cliente_id` em `pets`
- `cliente_id` e `pet_id` em `agendamentos`
- `auditoria_migracao`

Os dados históricos continuam preservados.

## Arquivos

- `Lane Pets - Banco Homologação - Etapa 3A1.xlsx`
- `Code.gs`
- `RELATORIO_NORMALIZACAO_CLIENTES_PETS.md`

## Como aplicar no Google Sheets

1. Faça uma cópia da planilha atual de homologação.
2. Abra a planilha de homologação.
3. Acesse **Extensões → Apps Script**.
4. Substitua o conteúdo do projeto pelo `Code.gs` fornecido.
5. Salve.
6. Recarregue a planilha.
7. Abra o menu **Lane Pets**.
8. Execute **5. Normalizar Clientes e Pets**.
9. Execute **6. Validar relacionamento Cliente → Pet → Agendamento**.
10. Execute **7. Gerar relatório da etapa 3A.1**.

## Resultado esperado

- 427 clientes
- 596 pets
- 596 pets com `cliente_id`
- 2.157 agendamentos
- 2.098 agendamentos com `pet_id`
- 59 agendamentos sem `pet_id`, preservados e auditados
- duplicidade `Selma + Mel` sinalizada

## Não fazer ainda

- Não publicar Web App.
- Não conectar o frontend.
- Não alterar `api.js`.
- Não remover localStorage.
- Não preencher unidades históricas.

A próxima etapa é revisar as pendências e somente depois criar a API somente leitura.
