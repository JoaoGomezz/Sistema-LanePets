# LANE PETS — Migração para Google Sheets

## 1. Google Apps Script
Abra a planilha criada > Extensões > Apps Script.

Cole `api/Code.gs` no arquivo `Code.gs`.

Execute `setupDatabase()` uma vez e aceite as permissões.

Depois:
Implantar > Nova implantação > Aplicativo da Web
- Executar como: Eu
- Quem tem acesso: Qualquer pessoa

Copie a URL que termina em `/exec`.

## 2. Configuração do site
Abra `js/config.js` e substitua:

COLE_AQUI_A_URL_DO_APPS_SCRIPT

pela URL da implantação.

## 3. Teste
Com a URL configurada, abra o site e no console do navegador execute:

LaneAPI.health()

Depois:

LaneAPI.getAll("clientes")

Para cadastrar:

LaneAPI.create("clientes", {
  nome: "Cliente Teste",
  telefone: "11999999999",
  status: "ATIVO"
})

## 4. Importante
A API é a nova fonte de dados. O `localStorage` ainda precisa ser removido das páginas durante a migração de cada módulo. Não apague os dados antigos até validar a nova API em produção.
