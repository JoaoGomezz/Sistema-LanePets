# LANE PETS — RELATÓRIO NORMALIZAÇÃO CLIENTES/PETS — ETAPA 3A.1

## Fonte

Planilha de homologação validada antes desta etapa.

## Resultado

- Clientes distintos gerados: **427**
- Pets preservados: **596**
- Pets com `cliente_id`: **596**
- Agendamentos preservados: **2.157**
- Agendamentos com `pet_id`: **2.098**
- Agendamentos sem `pet_id`: **59**
- Pendências registradas: **60**

### Por que existem 59 agendamentos sem `pet_id`?

- 58 não encontraram uma combinação única de `dono + pet` no cadastro de pets.
- 2 são ambíguos porque `Selma + Mel` possui dois PET IDs.
- O conjunto de pendências inclui também a duplicidade do cadastro `Selma + Mel`, totalizando 60 itens de auditoria.

Os agendamentos sem `pet_id` **não foram apagados**. Quando o dono pôde ser identificado, `cliente_id` foi preenchido; quando não foi possível, permaneceu vazio.

## Duplicidade identificada

Existe uma combinação duplicada:

`Selma + Mel`

com os PET IDs:

- `PET-47275B9B5235`
- `PET-A618DB5EA063`

A relação não foi escolhida automaticamente para os agendamentos afetados.

## Preservação

- IDs PET existentes preservados.
- IDs AGD existentes preservados.
- Campos históricos `dono`, `pet` e `telefone` preservados.
- Unidades legadas não foram preenchidas.
- Nenhuma linha de pets ou agendamentos foi excluída.

## Próxima etapa

1. Revisar as 60 pendências da aba `auditoria_migracao`.
2. Validar a relação Cliente → Pet → Agendamento.
3. Depois disso, implementar a API Google Apps Script somente leitura.
