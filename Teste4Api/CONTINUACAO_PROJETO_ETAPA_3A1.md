# CONTINUAÇÃO DO PROJETO — ETAPA 3A.1

## Data
18/08/2026

## Etapa concluída
Normalização Cliente → Pet → Agendamento em homologação.

## Contagens
- Clientes: 427
- Pets: 596
- Agendamentos: 2.157
- Serviços: 43
- Produtos: 28
- Entradas/Saídas: 331

## Relações
- Pets com cliente_id: 596/596
- Agendamentos com pet_id: 2.098/2.157
- Agendamentos sem pet_id: 59
- Pendências auditadas: 60

## Decisões
- PET IDs existentes preservados.
- AGD IDs existentes preservados.
- Nenhum registro excluído.
- dono/pet/telefone mantidos como histórico.
- Unidades históricas continuam vazias.
- Relações ambíguas não foram inferidas.

## Pendência conhecida
A combinação `Selma + Mel` possui dois PET IDs e não deve ser resolvida automaticamente.

## Próxima etapa
Revisar `auditoria_migracao` e validar as 60 pendências. Após aprovação, criar a API Google Apps Script somente leitura.

## Regra
Não publicar API e não conectar frontend até a validação da normalização.
