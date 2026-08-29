# Lane Pets — Apps Script de Homologação (Code.gs)

Este pacote cria a **planilha de HOMOLOGAÇÃO** no Google Sheets,
importa os 5 CSVs de staging já gerados e valida as contagens
contra o inventário real do backup. Não conecta o frontend, não
publica API pública e não apaga o `localStorage`.

## O que este script faz

1. **Criar estrutura** — cria as 8 abas (`pets`, `agendamentos`,
   `servicos`, `produtos`, `pacotes`, `entradasESaidas`,
   `configuracoes`, `auditoria`) com os cabeçalhos exatos do
   modelo definido na etapa de retomada do projeto.
2. **Importar CSVs** — lê `pets_importacao.csv`,
   `agendamentos_importacao.csv`, `servicos_importacao.csv`,
   `produtos_importacao.csv` e `entradasESaidas_importacao.csv`
   de uma pasta do Google Drive e preenche as abas
   correspondentes, preservando os IDs originais (`PET-…`,
   `AGD-…`, `SRV-…`, `PRD-…`, `FIN-…`).
3. **Validar contagens** — confere se cada aba ficou com o total
   exato esperado (596 / 2157 / 43 / 28 / 331) e confirma que
   nenhum registro legado de `agendamentos` ou `entradasESaidas`
   ficou com `unidade` preenchida.
4. **Registrar tudo** — cada ação (criação de estrutura,
   importação, validação, limpeza) grava uma linha na aba
   `auditoria`.

As abas `pacotes`, `configuracoes` e `auditoria` são criadas com
cabeçalho, mas **não têm CSV de origem ainda** — não existe
staging de pacotes nesta etapa, então elas ficam vazias até uma
próxima decisão.

## Passo a passo

### 1. Criar a planilha
No Google Drive, crie uma planilha nova chamada:

```
LANE PETS — BANCO HOMOLOGAÇÃO
```

### 2. Colar o script
Na planilha: **Extensões → Apps Script**. Apague o conteúdo
padrão de `Code.gs` e cole o conteúdo do arquivo `Code.gs` deste
pacote. Salve (ícone de disquete ou `Ctrl+S`).

### 3. Enviar os CSVs para o Drive
Envie os 5 arquivos da pasta `migracao/staging/` do projeto para
uma pasta qualquer do seu Google Drive:

- `pets_importacao.csv`
- `agendamentos_importacao.csv`
- `servicos_importacao.csv`
- `produtos_importacao.csv`
- `entradasESaidas_importacao.csv`

### 4. Recarregar a planilha
Feche a aba do Apps Script e recarregue a planilha no navegador.
Um novo menu **"Lane Pets"** vai aparecer na barra de menus. Na
primeira execução, o Google vai pedir autorização — aceite (é o
seu próprio script rodando na sua própria planilha).

### 5. Configurar a pasta do Drive
Menu **Lane Pets → 1. Configurar pasta do Drive (CSVs)**. Cole o
ID da pasta ou o link da pasta onde você enviou os CSVs.

### 6. Rodar a homologação
Duas formas, à sua escolha:

- **Passo a passo:** rode na ordem os itens `2. Criar estrutura`,
  `3. Importar CSVs` e `5. Validar contagens`.
- **Tudo de uma vez:** rode `4. Executar homologação completa`.

### 7. Conferir o resultado
Um alerta vai mostrar, para cada aba, o total importado contra o
esperado (ex.: `agendamentos: 2157 / 2157  OK`) e a contagem de
registros legados com unidade preenchida (deve ser `0 / 0  OK`
para `agendamentos` e `entradasESaidas`).

Se algo aparecer como **DIVERGENTE**, pare — não avance para a
API antes de investigar a causa (ver seção "Se der divergência"
abaixo).

## Sobre as duplicidades conhecidas

O relatório `migracao/DUPLICIDADES.md` já apontou:

- 1 possível duplicidade em `servicos` (dois registros de
  "Ozônio", preço 25).
- 1 possível duplicidade em `entradasESaidas` (dois lançamentos
  de "combustivel", 17/06, Saída, R$ 50).

Este script **importa as duas ocorrências normalmente** — a
decisão de mesclar ou remover uma delas é manual e deve ser
tomada depois de revisar os dois registros na planilha, não
antes.

## Se der divergência na validação

1. Rode `5. Validar contagens` de novo — confirme que não foi um
   problema pontual de execução.
2. Confira na aba `auditoria` quantas linhas cada importação
   realmente gravou.
3. Confira se o CSV enviado ao Drive é exatamente o mesmo do
   pacote de staging (mesmo tamanho de arquivo).
4. Só depois de entender a causa, rode a importação de novo.

## Limpar a base de homologação

Menu **Lane Pets → Limpar base de homologação (cuidado)**. Pede
confirmação explícita antes de apagar. Isso limpa apenas os dados
das 8 abas desta planilha — **não afeta** o backup original
(`backup-petshop (2).json`) nem os CSVs de staging.

## O que NÃO fazer nesta etapa

- Não publicar este projeto como Web App (`doGet`/`doPost`) —
  isso é a próxima fase, depois da validação.
- Não conectar `clientes.html` (ou qualquer outra página) a esta
  planilha ainda.
- Não remover as chaves de `localStorage` do frontend.
- Não atribuir "Franco" ou "Caieiras" aos registros legados sem
  unidade — nem na planilha, nem no CSV, nem manualmente.

## Próxima etapa (depois da validação OK)

1. Revisar manualmente as 2 duplicidades apontadas.
2. Criar a API em Apps Script (`doGet`/`doPost`) sobre esta
   mesma planilha, sem publicá-la ainda para o frontend.
3. Criar `dataService.js` no frontend.
4. Migrar `clientes.html` primeiro, mantendo `localStorage` como
   fallback.
