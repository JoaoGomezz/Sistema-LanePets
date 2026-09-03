/** 
 * LANE PETS — Code.gs 
 * HOMOLOGAÇÃO + NORMALIZAÇÃO 3A.1 
 * Não publica Web App/API e não atribui unidade automaticamente aos legados. 
 */ 
 
const SHEET_NAMES = ['pets','agendamentos','servicos','produtos','pacotes','entradasESaidas','configuracoes','auditoria','clientes','auditoria_migracao','reconciliacao_migracao']; 
 
const HEADERS = { 
  pets:['id','dono','pet','tipo','raca','telefone','endereco','pacote_json','unidade','cliente_id'], 
  agendamentos:['id','pet','dono','telefone','dataHora','servicos_json','total','transporte','valorTransporte','status','pagamentoStatus','formaPagamento','obs','unidade','cliente_id','pet_id'], 
  servicos:['id','nome','preco','porte','adicionais_json','pacote','adicional'], 
  produtos:['id','codigo','nome','categoria','valorCompra','valorVenda'], 
  pacotes:['id','pet_id','cliente','tipo','quantidade','utilizados','restantes','data_inicio','data_fim','status','unidade'], 
  entradasESaidas:['id','data','descricao','tipo','valor','unidade','origem'], 
  configuracoes:['chave','valor','descricao'], 
  auditoria:['id','data_hora','acao','entidade','registro_id','detalhes'], 
  clientes:['id','nome','telefone','endereco','observacoes','origem','status'], 
  auditoria_migracao:['id','data_hora','tipo','entidade','registro_id','status','descricao','valor_original','valor_sugerido'],
  reconciliacao_migracao:['id','data_hora','agendamento_id','dono_historico','pet_historico','telefone_historico','classificacao','pontuacao','candidato_pet_id','candidato_dono','candidato_pet','candidato_telefone','candidato_cliente_id','motivo','segundo_candidato','acao_recomendada','observacao','status']
}; 
 
const LEGACY_HEADERS = { 
  pets:['id','dono','pet','tipo','raca','telefone','endereco','pacote_json','unidade'], 
  agendamentos:['id','pet','dono','telefone','dataHora','servicos_json','total','transporte','valorTransporte','status','pagamentoStatus','formaPagamento','obs','unidade'], 
  servicos:['id','nome','preco','porte','adicionais_json','pacote','adicional'], 
  produtos:['id','codigo','nome','categoria','valorCompra','valorVenda'], 
  entradasESaidas:['id','data','descricao','tipo','valor','unidade','origem'] 
}; 
 
const CSV_FILES = {pets:'pets_importacao.csv',agendamentos:'agendamentos_importacao.csv',servicos:'servicos_importacao.csv',produtos:'produtos_importacao.csv',entradasESaidas:'entradasESaidas_importacao.csv'}; 
const EXPECTED_COUNTS = {pets:596,agendamentos:2157,servicos:43,produtos:28,entradasESaidas:331}; 
const SHEETS_SEM_UNIDADE_LEGADA = ['agendamentos','entradasESaidas']; 
const CSV_FOLDER_PROP = 'CSV_FOLDER_ID'; 
 
function onOpen(){ 
  SpreadsheetApp.getUi().createMenu('Lane Pets') 
    .addItem('1. Configurar pasta do Drive (CSVs)','configurarPastaDrive').addSeparator() 
    .addItem('2. Criar estrutura','criarEstrutura') 
    .addItem('3. Importar CSVs','importarCSVs') 
    .addItem('4. Executar homologação completa','executarHomologacaoCompleta') 
    .addItem('5. Validar contagens','validarContagens').addSeparator() 
    .addItem('6. Normalizar Clientes e Pets','normalizarClientesPets') 
    .addItem('7. Validar Cliente → Pet → Agendamento','validarRelacionamento') 
    .addItem('8. Gerar relatório da etapa 3A.1','gerarRelatorioEtapa3A1').addSeparator() 
    .addItem('9. Analisar pendências de reconciliação','analisarPendenciasReconciliacao') 
    .addItem('10. Preparar aprovação das reconciliações','prepararAprovacaoReconciliacoes') 
    .addItem('11. Aplicar reconciliações APROVADAS','aplicarReconciliacoesAprovadas').addSeparator() 
    .addItem('12. Etapa 3A.4 — Preparar revisão das pendências','executarEtapa3A4') 
    .addItem('13. Etapa 3A.4 — Validar revisão','validarEtapa3A4') 
    .addItem('14. Etapa 3A.4 — Sincronizar decisões','sincronizarDecisoesEtapa3A4')
    .addItem('15. Testar API somente leitura','testarApiLeitura')
    .addItem('16. ETAPA 4A — Testar API de escrita controlada','testarApiEscrita4A').addSeparator()
    .addItem('Limpar base de homologação (cuidado)','limparBaseHomologacao').addToUi(); 
} 
 
function configurarPastaDrive(){ 
  const ui=SpreadsheetApp.getUi(); 
  const r=ui.prompt('Pasta do Drive com os CSVs','Cole o ID ou link da pasta que contém os 5 CSVs de staging.',ui.ButtonSet.OK_CANCEL); 
  if(r.getSelectedButton()!==ui.Button.OK)return; 
  const raw=r.getResponseText().trim(), m=raw.match(/[-\w]{25,}/), id=m?m[0]:raw; 
  try{const f=DriveApp.getFolderById(id);PropertiesService.getScriptProperties().setProperty(CSV_FOLDER_PROP,id);ui.alert('Pasta configurada: '+f.getName());} 
  catch(e){ui.alert('Não foi possível abrir a pasta.\n\n'+e.message);} 
} 
 
function criarEstrutura(){ 
  const ss=SpreadsheetApp.getActiveSpreadsheet(); 
  SHEET_NAMES.forEach(function(n){let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);const h=HEADERS[n];garantirCabecalhos_(s,h);s.getRange(1,1,1,h.length).setFontWeight('bold');if(s.getFrozenRows()<1)s.setFrozenRows(1);}); 
  const d=ss.getSheetByName('Sheet1')||ss.getSheetByName('Página1'); 
  if(d&&ss.getSheets().length>1&&d.getLastRow()===0)ss.deleteSheet(d); 
  registrarAuditoria_('CRIAR_ESTRUTURA','sistema','-','Estrutura verificada/criada.'); 
  SpreadsheetApp.getUi().alert('Estrutura criada/verificada com sucesso.'); 
} 
 
function importarCSVs(){ 
  const ss=SpreadsheetApp.getActiveSpreadsheet(),res=[]; 
  Object.keys(CSV_FILES).forEach(function(ent){ 
    const s=ss.getSheetByName(ent);if(!s)throw new Error('Aba '+ent+' não existe. Rode 2. Criar estrutura.'); 
    const rows=lerCsv_(CSV_FILES[ent]), header=rows[0], esperado=LEGACY_HEADERS[ent]; 
    if(!arraysIguais_(header,esperado))throw new Error('Cabeçalho de '+CSV_FILES[ent]+' não confere.\nEsperado: '+esperado.join(', ')+'\nEncontrado: '+header.join(', ')); 
    const dados=rows.slice(1);if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).clearContent(); 
    if(dados.length){s.getRange(2,1,dados.length,esperado.length).setValues(dados);} 
    // As colunas novas permanecem vazias para a etapa 3A.1. 
    if(ent==='pets')s.getRange(2,10,dados.length,1).clearContent(); 
    if(ent==='agendamentos')s.getRange(2,15,dados.length,2).clearContent(); 
    res.push(ent+': '+dados.length);registrarAuditoria_('IMPORTAR_CSV',ent,'-',dados.length+' registros importados.'); 
  }); 
  SpreadsheetApp.getUi().alert('Importação concluída:\n\n'+res.join('\n')); 
} 
 
function executarHomologacaoCompleta(){criarEstrutura();importarCSVs();validarContagens();} 
 
function validarContagens(){ 
  const ss=SpreadsheetApp.getActiveSpreadsheet(),lin=[],ok0={v:true}; 
  Object.keys(EXPECTED_COUNTS).forEach(function(e){const s=ss.getSheetByName(e);if(!s){lin.push(e+': ABA NÃO ENCONTRADA');ok0.v=false;return;}const total=Math.max(s.getLastRow()-1,0),exp=EXPECTED_COUNTS[e],ok=total===exp;if(!ok)ok0.v=false;lin.push(e+': '+total+' / '+exp+(ok?' OK':' DIVERGENTE'));}); 
  SHEETS_SEM_UNIDADE_LEGADA.forEach(function(e){const s=ss.getSheetByName(e);if(!s)return;const c=HEADERS[e].indexOf('unidade')+1,n=Math.max(s.getLastRow()-1,0);if(!n)return;const vals=s.getRange(2,c,n,1).getValues(),com=vals.filter(v=>String(v[0]).trim()!=='').length;if(com!==0)ok0.v=false;lin.push(e+' com unidade no legado: '+com+' / 0'+(com===0?' OK':' DIVERGENTE'));}); 
  const msg=(ok0.v?'VALIDAÇÃO OK':'DIVERGÊNCIA ENCONTRADA — PARAR')+'\n\n'+lin.join('\n');registrarAuditoria_('VALIDAR_CONTAGENS','sistema','-',msg);SpreadsheetApp.getUi().alert(msg);return {ok:ok0.v,detalhes:lin}; 
} 
 
function normalizarClientesPets(){ 
  const ui=SpreadsheetApp.getUi();if(ui.alert('Normalizar Clientes e Pets','Criará clientes e preencherá cliente_id/pet_id apenas quando houver correspondência segura. Unidade legada continuará vazia. Ambiguidades serão auditadas. Continuar?',ui.ButtonSet.YES_NO)!==ui.Button.YES)return; 
  garantirAbaEstrutura_('clientes');garantirAbaEstrutura_('auditoria_migracao'); 
  const ss=SpreadsheetApp.getActiveSpreadsheet(),ps=ss.getSheetByName('pets'),as=ss.getSheetByName('agendamentos'),cs=ss.getSheetByName('clientes'),aud=ss.getSheetByName('auditoria_migracao'); 
  const pets=readSheetObjects_(ps),ags=readSheetObjects_(as),clientes=readSheetObjects_(cs),porNome={}; 
  clientes.forEach(c=>{if(c.id)porNome[normalizarNome_(c.nome)]=c;}); 
  const novos=[]; 
  pets.forEach(p=>{const nome=String(p.dono||'').trim(),k=normalizarNome_(nome);if(!k)return;if(!porNome[k]){const c={id:gerarIdEstavel_('CLI',k),nome:nome,telefone:String(p.telefone||''),endereco:String(p.endereco||''),observacoes:'',origem:'normalizacao_3A1',status:'ativo'};porNome[k]=c;novos.push(c);}}); 
  if(novos.length)cs.getRange(cs.getLastRow()+1,1,novos.length,7).setValues(novos.map(c=>[c.id,c.nome,c.telefone,c.endereco,c.observacoes,c.origem,c.status])); 
  const petMap={};pets.forEach(p=>{const k=normalizarNome_(p.dono)+'|'+normalizarNome_(p.pet);(petMap[k]||(petMap[k]=[])).push({petId:String(p.id||''),clienteId:porNome[normalizarNome_(p.dono)]?porNome[normalizarNome_(p.dono)].id:'',dono:p.dono,pet:p.pet});}); 
  ps.getRange(2,10,pets.length,1).setValues(pets.map(p=>[porNome[normalizarNome_(p.dono)]?porNome[normalizarNome_(p.dono)].id:''])); 
  const rel=[],audRows=[];ags.forEach(a=>{const cand=petMap[normalizarNome_(a.dono)+'|'+normalizarNome_(a.pet)]||[];if(cand.length===1)rel.push([cand[0].clienteId,cand[0].petId]);else{rel.push(['','']);audRows.push(criarLinhaAuditoriaMigracao_({tipo:cand.length?'AGENDAMENTO_AMBIGUO':'AGENDAMENTO_SEM_PET',entidade:'agendamentos',registroId:a.id,status:'PENDENTE',descricao:cand.length?'Mais de um pet corresponde a dono + pet.':'Nenhuma combinação única de dono + pet encontrada.',valorOriginal:JSON.stringify({dono:a.dono,pet:a.pet}),valorSugerido:cand.length?JSON.stringify(cand):''}));}}); 
  as.getRange(2,15,ags.length,2).setValues(rel);gravarAuditoriasSemDuplicar_(aud,audRows); 
  registrarAuditoria_('NORMALIZAR_CLIENTES_PETS','sistema','-','Clientes novos: '+novos.length+'; pets: '+pets.length+'; agendamentos: '+ags.length+'; pendências: '+audRows.length); 
  ui.alert('ETAPA 3A.1 concluída.\n\nClientes novos: '+novos.length+'\nPets com cliente_id: '+pets.filter((p,i)=>String(porNome[normalizarNome_(p.dono)]?.id||'')!=='').length+'\nAgendamentos com pet_id: '+rel.filter(r=>r[1]).length+'\nPendências: '+audRows.length+'\n\nExecute a opção 7.'); 
} 
 
function validarRelacionamento(){ 
  const ss=SpreadsheetApp.getActiveSpreadsheet(),c=readSheetObjects_(ss.getSheetByName('clientes')),p=readSheetObjects_(ss.getSheetByName('pets')),a=readSheetObjects_(ss.getSheetByName('agendamentos')),aud=readSheetObjects_(ss.getSheetByName('auditoria_migracao')); 
  const cids={};c.forEach(x=>{if(x.id)cids[String(x.id)]=1;});const pids={},pc={};let pOk=0,pSem=0,pInv=0;p.forEach(x=>{pids[String(x.id)]=1;pc[String(x.id)]=String(x.cliente_id||'');if(!x.cliente_id)pSem++;else if(!cids[String(x.cliente_id)])pInv++;else pOk++;}); 
  let aPet=0,aSemPet=0,aInvPet=0,aCli=0,aSemCli=0,aInvCli=0,cons=0,incons=0;a.forEach(x=>{const pid=String(x.pet_id||''),cid=String(x.cliente_id||'');if(!pid)aSemPet++;else if(!pids[pid])aInvPet++;else{aPet++;if(cid&&pc[pid]&&cid===pc[pid])cons++;else if(cid||pc[pid])incons++;}if(!cid)aSemCli++;else if(!cids[cid])aInvCli++;else aCli++;}); 
  const pend=aud.filter(x=>String(x.status||'').toUpperCase()!=='RESOLVIDO').length,ok=pInv===0&&aInvPet===0&&aInvCli===0&&incons===0; 
  const msg=['VALIDAÇÃO CLIENTE → PET → AGENDAMENTO','', 'Clientes: '+c.length,'', 'PETS','Total: '+p.length,'Com cliente_id válido: '+pOk,'Sem cliente_id: '+pSem,'cliente_id inválido: '+pInv,'','AGENDAMENTOS','Total: '+a.length,'Com pet_id válido: '+aPet,'Sem pet_id: '+aSemPet,'pet_id inválido: '+aInvPet,'Com cliente_id válido: '+aCli,'Sem cliente_id: '+aSemCli,'cliente_id inválido: '+aInvCli,'','Consistentes pet/cliente: '+cons,'Inconsistentes pet/cliente: '+incons,'Pendências de auditoria: '+pend,'','RESULTADO: '+(ok?'OK':'EXISTEM PENDÊNCIAS — NÃO AVANÇAR PARA API')].join('\n');registrarAuditoria_('VALIDAR_RELACIONAMENTO','sistema','-',msg);SpreadsheetApp.getUi().alert(msg);return {ok:ok}; 
} 
 
function gerarRelatorioEtapa3A1(){ 
  const ss=SpreadsheetApp.getActiveSpreadsheet(),p=readSheetObjects_(ss.getSheetByName('pets')),a=readSheetObjects_(ss.getSheetByName('agendamentos')),c=readSheetObjects_(ss.getSheetByName('clientes')),aud=readSheetObjects_(ss.getSheetByName('auditoria_migracao'));let s=ss.getSheetByName('RELATORIO_NORMALIZACAO');if(!s)s=ss.insertSheet('RELATORIO_NORMALIZACAO');else s.clear(); 
  const linhas=[['LANE PETS — RELATÓRIO ETAPA 3A.1',''],['Gerado em',new Date()],['',''],['Métrica','Quantidade'],['Clientes',c.length],['Pets',p.length],['Pets com cliente_id',p.filter(x=>x.cliente_id).length],['Pets sem cliente_id',p.filter(x=>!x.cliente_id).length],['Agendamentos',a.length],['Agendamentos com pet_id',a.filter(x=>x.pet_id).length],['Agendamentos sem pet_id',a.filter(x=>!x.pet_id).length],['Agendamentos com cliente_id',a.filter(x=>x.cliente_id).length],['Agendamentos sem cliente_id',a.filter(x=>!x.cliente_id).length],['Pendências de auditoria',aud.filter(x=>String(x.status||'').toUpperCase()!=='RESOLVIDO').length],['Agendamentos sem pet',aud.filter(x=>x.tipo==='AGENDAMENTO_SEM_PET').length],['Agendamentos ambíguos',aud.filter(x=>x.tipo==='AGENDAMENTO_AMBIGUO').length],['',''],['Contagem pets esperada',EXPECTED_COUNTS.pets],['Contagem agendamentos esperada',EXPECTED_COUNTS.agendamentos],['',''],['Próxima etapa','Resolver pendências e validar antes da API.']];s.getRange(1,1,linhas.length,2).setValues(linhas);s.getRange(1,1,1,2).setFontWeight('bold');s.getRange(4,1,1,2).setFontWeight('bold');s.autoResizeColumns(1,2);registrarAuditoria_('GERAR_RELATORIO_3A1','sistema','-','Relatório gerado.');SpreadsheetApp.getUi().alert('Relatório gerado na aba RELATORIO_NORMALIZACAO.'); 
} 
 
function limparBaseHomologacao(){const ui=SpreadsheetApp.getUi();if(ui.alert('Confirmar limpeza','Apagar todos os dados das abas de homologação, mantendo cabeçalhos? Backup e CSVs não serão afetados.',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;const ss=SpreadsheetApp.getActiveSpreadsheet();SHEET_NAMES.forEach(n=>{const s=ss.getSheetByName(n);if(s&&s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).clearContent();});const r=ss.getSheetByName('RELATORIO_NORMALIZACAO');if(r)r.clear();registrarAuditoria_('LIMPAR_BASE','sistema','-','Limpeza manual.');ui.alert('Base de homologação limpa.');} 
 
function garantirAbaEstrutura_(n){const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);garantirCabecalhos_(s,HEADERS[n]);if(s.getFrozenRows()<1)s.setFrozenRows(1);return s;} 
function garantirCabecalhos_(s,h){const atual=s.getRange(1,1,1,h.length).getValues()[0];let dif=false;for(let i=0;i<h.length;i++)if(String(atual[i]||'').trim()!==String(h[i]).trim()){dif=true;break;}if(dif)s.getRange(1,1,1,h.length).setValues([h]);} 
function lerCsv_(name){const f=getCsvFile_(name),txt=f.getBlob().getDataAsString('UTF-8'),clean=txt.charCodeAt(0)===0xFEFF?txt.slice(1):txt,r=Utilities.parseCsv(clean);if(!r.length)throw new Error('CSV vazio: '+name);return r;} 
function getCsvFile_(name){const id=PropertiesService.getScriptProperties().getProperty(CSV_FOLDER_PROP);if(id){const it=DriveApp.getFolderById(id).getFilesByName(name);if(it.hasNext())return it.next();}const it2=DriveApp.getFilesByName(name);if(it2.hasNext())return it2.next();throw new Error('Arquivo '+name+' não encontrado. Configure a pasta no item 1.');} 
function arraysIguais_(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(String(a[i]).trim()!==String(b[i]).trim())return false;return true;} 
function readSheetObjects_(s){if(!s||s.getLastRow()<2)return [];const v=s.getDataRange().getValues(),h=v[0].map(x=>String(x).trim());return v.slice(1).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o;});} 
function normalizarNome_(v){return String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');} 
function gerarIdEstavel_(prefixo,chave){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,chave,Utilities.Charset.UTF_8);return prefixo+'-'+bytes.map(b=>('0'+(b<0?b+256:b).toString(16)).slice(-2)).join('').substring(0,12).toUpperCase();} 
function criarLinhaAuditoriaMigracao_(d){return ['AUD-'+Utilities.getUuid().slice(0,12).toUpperCase(),new Date(),d.tipo||'',d.entidade||'',d.registroId||'',d.status||'PENDENTE',d.descricao||'',d.valorOriginal||'',d.valorSugerido||''];} 
function gravarAuditoriasSemDuplicar_(s,rows){if(!s||!rows.length)return;const old=readSheetObjects_(s),keys={};old.forEach(x=>{if(String(x.status||'').toUpperCase()!=='RESOLVIDO')keys[String(x.tipo)+'|'+String(x.entidade)+'|'+String(x.registro_id)]=1;});const add=rows.filter(r=>{const k=r[2]+'|'+r[3]+'|'+r[4];if(keys[k])return false;keys[k]=1;return true;});if(add.length)s.getRange(s.getLastRow()+1,1,add.length,9).setValues(add);} 
function registrarAuditoria_(acao,entidade,registroId,detalhes){const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('auditoria');if(!s)return;const id='LOG-'+Utilities.getUuid().slice(0,8).toUpperCase(),dt=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd HH:mm:ss');s.appendRow([id,dt,acao,entidade,registroId,detalhes]);} 
// ============================================================ 
// LANE PETS — ETAPA 3A.2 
// RECONCILIAÇÃO SEGURA DE AGENDAMENTOS 
// ============================================================ 
// 
// Esta etapa é SOMENTE DE ANÁLISE. 
// - Não altera pets. 
// - Não altera agendamentos. 
// - Não atribui Franco/Caieiras. 
// - Analisa apenas agendamentos sem pet_id. 
// - Cria/atualiza a aba reconciliacao_migracao. 
// - Toda sugestão permanece PENDENTE. 
// ============================================================ 
 
function analisarPendenciasReconciliacao() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
  const petsSheet = ss.getSheetByName('pets'); 
  const agSheet = ss.getSheetByName('agendamentos'); 
 
  if (!petsSheet || !agSheet) { 
    ui.alert('As abas "pets" e "agendamentos" são obrigatórias.'); 
    return; 
  } 
 
  const pets = dadosComoObjetosReconciliacao_(petsSheet); 
  const agendamentos = dadosComoObjetosReconciliacao_(agSheet); 
 
  const camposPet = ['id', 'dono', 'pet', 'telefone', 'cliente_id']; 
  const camposAg = ['id', 'dono', 'pet', 'telefone', 'pet_id', 'cliente_id']; 
 
  validarCamposReconciliacao_(pets, camposPet, 'pets'); 
  validarCamposReconciliacao_(agendamentos, camposAg, 'agendamentos'); 
 
  const pendentes = agendamentos.filter(function (ag) { 
    return String(ag.pet_id || '').trim() === ''; 
  }); 
 
  const resultados = pendentes.map(function (ag) { 
    const candidatos = pets.map(function (pet) { 
      const avaliacao = pontuarCandidatoReconciliacao_(ag, pet); 
      return { 
        pet: pet, 
        score: avaliacao.score, 
        motivo: avaliacao.motivo 
      }; 
    }).filter(function (c) { 
      return c.score >= 60; 
    }).sort(function (a, b) { 
      return b.score - a.score; 
    }); 
 
    const melhor = candidatos[0] || null; 
    const segundo = candidatos[1] || null; 
 
    let classificacao = 'SEM CANDIDATO'; 
    let acao = 'REVISAR MANUALMENTE'; 
    let observacao = 'Nenhum candidato atingiu o limite mínimo.'; 
 
    if (melhor) { 
      const margem = segundo ? melhor.score - segundo.score : 999; 
      const empate = segundo && melhor.score === segundo.score; 
 
      if (empate || margem < 5) { 
        classificacao = 'AMBÍGUO'; 
        acao = 'NÃO APLICAR'; 
        observacao = 'Há mais de um candidato próximo; não escolher automaticamente.'; 
      } else if (melhor.score >= 90 && margem >= 8) { 
        classificacao = 'ALTA CONFIANÇA'; 
        acao = 'REVISAR E APROVAR'; 
        observacao = 'Candidato forte e suficientemente separado do segundo resultado.'; 
      } else if (melhor.score >= 75 && margem >= 5) { 
        classificacao = 'MÉDIA CONFIANÇA'; 
        acao = 'REVISAR MANUALMENTE'; 
        observacao = 'Há evidências de correspondência, mas exige conferência.'; 
      } else { 
        classificacao = 'AMBÍGUO'; 
        acao = 'NÃO APLICAR'; 
        observacao = 'Pontuação insuficiente para uma decisão segura.'; 
      } 
    } 
 
    const segundoTexto = segundo 
      ? [segundo.pet.id, segundo.pet.dono, segundo.pet.pet, segundo.pet.telefone, segundo.score].join(' | ') 
      : ''; 
 
    return [ 
      'REC-' + Utilities.getUuid().slice(0, 12).toUpperCase(), 
      new Date(), 
      ag.id, 
      ag.dono, 
      ag.pet, 
      ag.telefone, 
      classificacao, 
      melhor ? melhor.score : 0, 
      melhor ? melhor.pet.id : '', 
      melhor ? melhor.pet.dono : '', 
      melhor ? melhor.pet.pet : '', 
      melhor ? melhor.pet.telefone : '', 
      melhor ? melhor.pet.cliente_id : '', 
      melhor ? melhor.motivo : '', 
      segundoTexto, 
      acao, 
      observacao, 
      'PENDENTE' 
    ]; 
  }); 
 
  const nomeAba = 'reconciliacao_migracao'; 
  let sheet = ss.getSheetByName(nomeAba); 
  if (!sheet) sheet = ss.insertSheet(nomeAba); 
 
  const headers = [ 
    'id', 'data_hora', 'agendamento_id', 'dono_historico', 'pet_historico', 
    'telefone_historico', 'classificacao', 'pontuacao', 'candidato_pet_id', 
    'candidato_dono', 'candidato_pet', 'candidato_telefone', 'candidato_cliente_id', 
    'motivo', 'segundo_candidato', 'acao_recomendada', 'observacao', 'status' 
  ]; 
 
  sheet.clearContents(); 
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]); 
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold'); 
  sheet.setFrozenRows(1); 
 
  if (resultados.length) { 
    sheet.getRange(2, 1, resultados.length, headers.length).setValues(resultados); 
  } 
  sheet.autoResizeColumns(1, headers.length); 
 
  const altas = resultados.filter(r => r[6] === 'ALTA CONFIANÇA').length; 
  const medias = resultados.filter(r => r[6] === 'MÉDIA CONFIANÇA').length; 
  const ambiguos = resultados.filter(r => r[6] === 'AMBÍGUO').length; 
  const semCandidato = resultados.filter(r => r[6] === 'SEM CANDIDATO').length; 
 
  if (typeof registrarAuditoria_ === 'function') { 
    registrarAuditoria_( 
      'ANALISAR_RECONCILIACAO_3A2', 
      'agendamentos', 
      '-', 
      'Pendentes: ' + resultados.length + 
      ' | Alta: ' + altas + 
      ' | Média: ' + medias + 
      ' | Ambíguos: ' + ambiguos + 
      ' | Sem candidato: ' + semCandidato + 
      ' | Nenhuma alteração aplicada.' 
    ); 
  } 
 
  ui.alert( 
    'ETAPA 3A.2 — ANÁLISE CONCLUÍDA\n\n' + 
    'Agendamentos pendentes: ' + resultados.length + '\n' + 
    'Alta confiança: ' + altas + '\n' + 
    'Média confiança: ' + medias + '\n' + 
    'Ambíguos: ' + ambiguos + '\n' + 
    'Sem candidato: ' + semCandidato + '\n\n' + 
    'Nenhum agendamento foi alterado.\n' + 
    'Revise a aba "reconciliacao_migracao" antes da próxima etapa.' 
  ); 
} 
 
function pontuarCandidatoReconciliacao_(ag, pet) { 
  const donoAg = normalizarTextoReconciliacao_(ag.dono); 
  const petAg = normalizarTextoReconciliacao_(ag.pet); 
  const telAg = normalizarTelefoneReconciliacao_(ag.telefone); 
  const donoPet = normalizarTextoReconciliacao_(pet.dono); 
  const nomePet = normalizarTextoReconciliacao_(pet.pet); 
  const telPet = normalizarTelefoneReconciliacao_(pet.telefone); 
 
  const donoExato = donoAg && donoAg === donoPet; 
  const petExato = petAg && petAg === nomePet; 
  const telefoneIgual = telefonesCompativeisReconciliacao_(telAg, telPet); 
  const simDono = similaridadeTextoReconciliacao_(donoAg, donoPet); 
  const simPet = similaridadeTextoReconciliacao_(petAg, nomePet); 
 
  let score = 0; 
  const motivos = []; 
 
  if (donoExato) { score += 45; motivos.push('dono exato'); } 
  else if (simDono >= 0.92) { score += 35; motivos.push('dono muito semelhante'); } 
  else if (simDono >= 0.78) { score += 22; motivos.push('dono semelhante'); } 
 
  if (petExato) { score += 45; motivos.push('pet exato'); } 
  else if (simPet >= 0.92) { score += 35; motivos.push('pet muito semelhante'); } 
  else if (simPet >= 0.78) { score += 22; motivos.push('pet semelhante'); } 
 
  if (telefoneIgual) { score += 25; motivos.push('telefone compatível'); } 
  if (petExato && telefoneIgual) score += 20; 
  if (donoExato && petExato) score += 15; 
 
  return { 
    score: Math.min(score, 100), 
    motivo: motivos.length ? motivos.join(' + ') : 'similaridade insuficiente' 
  }; 
} 
 
function normalizarTextoReconciliacao_(valor) { 
  return String(valor || '') 
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase() 
    .replace(/[^a-z0-9]+/g, ' ') 
    .trim() 
    .replace(/\s+/g, ' '); 
} 
 
function normalizarTelefoneReconciliacao_(valor) { 
  const digits = String(valor || '').replace(/\D/g, ''); 
  if (!digits) return ''; 
  return digits.length > 11 ? digits.slice(-11) : digits; 
} 
 
function telefonesCompativeisReconciliacao_(a, b) { 
  if (!a || !b) return false; 
  if (a === b) return true; 
  return a.length >= 10 && b.length >= 10 && a.slice(-10) === b.slice(-10); 
} 
 
function similaridadeTextoReconciliacao_(a, b) { 
  if (!a || !b) return 0; 
  if (a === b) return 1; 
  const tamanho = Math.max(a.length, b.length); 
  if (!tamanho) return 0; 
  return 1 - distanciaLevenshteinReconciliacao_(a, b) / tamanho; 
} 
 
function distanciaLevenshteinReconciliacao_(a, b) { 
  const matriz = []; 
  for (let i = 0; i <= b.length; i++) matriz[i] = [i]; 
  for (let j = 0; j <= a.length; j++) matriz[0][j] = j; 
 
  for (let i = 1; i <= b.length; i++) { 
    for (let j = 1; j <= a.length; j++) { 
      const custo = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1; 
      matriz[i][j] = Math.min( 
        matriz[i - 1][j] + 1, 
        matriz[i][j - 1] + 1, 
        matriz[i - 1][j - 1] + custo 
      ); 
    } 
  } 
  return matriz[b.length][a.length]; 
} 
 
function validarCamposReconciliacao_(dados, campos, entidade) { 
  if (!dados.length) throw new Error('Aba "' + entidade + '" não possui dados.'); 
  campos.forEach(function(campo) { 
    if (!(campo in dados[0])) { 
      throw new Error('Aba "' + entidade + '" não possui a coluna obrigatória: ' + campo); 
    } 
  }); 
} 
 
function dadosComoObjetosReconciliacao_(sheet) { 
  if (sheet.getLastRow() < 2) return []; 
  const values = sheet.getDataRange().getValues(); 
  const headers = values[0].map(h => String(h).trim()); 
  return values.slice(1).map(function(row) { 
    const obj = {}; 
    headers.forEach(function(header, i) { obj[header] = row[i]; }); 
    return obj; 
  }); 
} 
 
// ============================================================ 
// ONOPEN — ADICIONE ESTA OPÇÃO AO MENU EXISTENTE 
// ============================================================ 
// Dentro do onOpen(), antes de .addToUi(), acrescente: 
// 
// .addSeparator() 
// .addItem( 
//   '9. Analisar pendências de reconciliação', 
//   'analisarPendenciasReconciliacao' 
// ) 
// 
// Não substitua o onOpen() inteiro se o seu já contém as opções 1–8. 
// ============================================================ 
// LANE PETS — ETAPA 3A.3 — APROVAÇÃO CONTROLADA 
// ============================================================ 
// Esta etapa NÃO altera agendamentos ao preparar a revisão. 
// 23 casos de ALTA CONFIANÇA serão marcados como APROVAR. 
// AGD-F487A4E98F07 (Marcio + Nina) ficará INVESTIGAR. 
// A aplicação real exige status APROVADO explícito. 
// ============================================================ 
 
function prepararAprovacaoReconciliacoes() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
  const sheet = ss.getSheetByName('reconciliacao_migracao'); 
 
  if (!sheet) { 
    ui.alert('A aba "reconciliacao_migracao" não existe. Execute primeiro a Etapa 3A.2.'); 
    return; 
  } 
 
  if (sheet.getLastRow() < 2) { 
    ui.alert('Não existem registros para revisar.'); 
    return; 
  } 
 
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] 
    .map(function(h) { return String(h).trim(); }); 
 
  const idx = {}; 
  headers.forEach(function(h, i) { idx[h] = i; }); 
 
  ['agendamento_id', 'classificacao', 'acao_recomendada', 'status'] 
    .forEach(function(c) { 
      if (idx[c] === undefined) { 
        throw new Error('Coluna obrigatória ausente: ' + c); 
      } 
    }); 
 
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues(); 
 
  const AG_INVESTIGAR = 'AGD-F487A4E98F07'; 
  let altas = 0; 
  let aprovar = 0; 
  let investigar = 0; 
 
  values.forEach(function(row) { 
    const id = String(row[idx.agendamento_id] || '').trim(); 
    const classificacao = String(row[idx.classificacao] || '').trim(); 
 
    if (classificacao !== 'ALTA CONFIANÇA') return; 
 
    altas++; 
 
    if (id === AG_INVESTIGAR) { 
      row[idx.acao_recomendada] = 'INVESTIGAR'; 
      row[idx.status] = 'INVESTIGAR'; 
      investigar++; 
    } else { 
      row[idx.acao_recomendada] = 'APROVAR'; 
      row[idx.status] = 'APROVAR'; 
      aprovar++; 
    } 
  }); 
 
  sheet.getRange(2, 1, values.length, sheet.getLastColumn()).setValues(values); 
 
  registrarAuditoria_( 
    'PREPARAR_APROVACAO_3A3', 
    'reconciliacao_migracao', 
    '-', 
    'Alta confiança: ' + altas + 
    ' | APROVAR: ' + aprovar + 
    ' | INVESTIGAR: ' + investigar + 
    ' | Nenhum agendamento alterado.' 
  ); 
 
  ui.alert( 
    'ETAPA 3A.3 — REVISÃO PREPARADA\n\n' + 
    'Alta confiança: ' + altas + '\n' + 
    'Marcados APROVAR: ' + aprovar + '\n' + 
    'Marcado INVESTIGAR: ' + investigar + '\n\n' + 
    'Nenhum agendamento foi alterado.' 
  ); 
} 
 
function aplicarReconciliacoesAprovadas() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
 
  const rec = ss.getSheetByName('reconciliacao_migracao'); 
  const ag = ss.getSheetByName('agendamentos'); 
 
  if (!rec || !ag) { 
    ui.alert('As abas reconciliacao_migracao e agendamentos são obrigatórias.'); 
    return; 
  } 
 
  const confirmacao = ui.alert( 
    'CONFIRMAÇÃO — APLICAÇÃO', 
    'Somente linhas com status APROVADO serão aplicadas.\n\n' + 
    'Serão preenchidos somente pet_id e cliente_id.\n' + 
    'IDs e demais dados históricos serão preservados.\n\n' + 
    'Deseja continuar?', 
    ui.ButtonSet.YES_NO 
  ); 
 
  if (confirmacao !== ui.Button.YES) { 
    ui.alert('Operação cancelada. Nenhum agendamento foi alterado.'); 
    return; 
  } 
 
  const rh = rec.getRange(1, 1, 1, rec.getLastColumn()).getValues()[0] 
    .map(function(h) { return String(h).trim(); }); 
  const ah = ag.getRange(1, 1, 1, ag.getLastColumn()).getValues()[0] 
    .map(function(h) { return String(h).trim(); }); 
 
  const ri = {}; 
  const ai = {}; 
  rh.forEach(function(h, i) { ri[h] = i; }); 
  ah.forEach(function(h, i) { ai[h] = i; }); 
 
  ['agendamento_id', 'candidato_pet_id', 'candidato_cliente_id', 'status'] 
    .forEach(function(c) { 
      if (ri[c] === undefined) throw new Error('reconciliacao_migracao sem coluna: ' + c); 
    }); 
 
  ['id', 'pet_id', 'cliente_id'].forEach(function(c) { 
    if (ai[c] === undefined) throw new Error('agendamentos sem coluna: ' + c); 
  }); 
 
  const recValues = rec.getRange(2, 1, rec.getLastRow() - 1, rec.getLastColumn()).getValues(); 
  const agValues = ag.getRange(2, 1, ag.getLastRow() - 1, ag.getLastColumn()).getValues(); 
 
  const porId = {}; 
  agValues.forEach(function(row, i) { 
    const id = String(row[ai.id] || '').trim(); 
    if (id) porId[id] = i; 
  }); 
 
  let aplicadas = 0; 
  let bloqueadas = 0; 
 
  recValues.forEach(function(row) { 
    if (String(row[ri.status] || '').trim().toUpperCase() !== 'APROVADO') return; 
 
    const agId = String(row[ri.agendamento_id] || '').trim(); 
    const petId = String(row[ri.candidato_pet_id] || '').trim(); 
    const clienteId = String(row[ri.candidato_cliente_id] || '').trim(); 
 
    if (!agId || !petId || !clienteId || porId[agId] === undefined) { 
      bloqueadas++; 
      return; 
    } 
 
    const pos = porId[agId]; 
 
    // Proteção: nunca sobrescrever vínculo existente. 
    if (String(agValues[pos][ai.pet_id] || '').trim() || 
        String(agValues[pos][ai.cliente_id] || '').trim()) { 
      bloqueadas++; 
      return; 
    } 
 
    agValues[pos][ai.pet_id] = petId; 
    agValues[pos][ai.cliente_id] = clienteId; 
    row[ri.status] = 'APLICADO'; 
    aplicadas++; 
  }); 
 
  if (agValues.length) { 
    ag.getRange(2, 1, agValues.length, ag.getLastColumn()).setValues(agValues); 
  } 
  if (recValues.length) { 
    rec.getRange(2, 1, recValues.length, rec.getLastColumn()).setValues(recValues); 
  } 
 
  registrarAuditoria_( 
    'APLICAR_RECONCILIACOES_3A3', 
    'agendamentos', 
    '-', 
    'Aplicadas: ' + aplicadas + ' | Bloqueadas: ' + bloqueadas + 
    ' | Alterados somente pet_id e cliente_id.' 
  ); 
 
  ui.alert( 
    'APLICAÇÃO CONCLUÍDA\n\n' + 
    'Reconciliações aplicadas: ' + aplicadas + '\n' + 
    'Bloqueadas: ' + bloqueadas + '\n\n' + 
    'Somente pet_id e cliente_id foram alterados.' 
  ); 
} 
// ============================================================ 
// LANE PETS — ETAPA 3A.4 
// TRATAMENTO CONTROLADO DAS PENDÊNCIAS RESTANTES 
// ============================================================ 
// 
// OBJETIVO: 
// - Trabalhar somente os agendamentos ainda sem pet_id. 
// - Não alterar agendamentos automaticamente. 
// - Não escolher candidatos automaticamente. 
// - Organizar os casos para revisão manual. 
// - Registrar os 23 casos já aplicados como RESOLVIDOS 
//   na auditoria de migração. 
// - Preparar os 36 casos restantes para decisão manual. 
// 
// CLASSIFICAÇÕES ESPERADAS APÓS A ETAPA 3A.3: 
// 
//   INVESTIGAR 
//   MÉDIA CONFIANÇA 
//   AMBÍGUO 
//   SEM CANDIDATO 
// 
// IMPORTANTE: 
// Esta etapa NÃO altera: 
// - pets 
// - clientes 
// - agendamentos 
// - pet_id 
// - cliente_id 
// 
// A aplicação continua sendo responsabilidade do item 11. 
// ============================================================ 
 
 
function executarEtapa3A4() { 
 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
 
  const rec = ss.getSheetByName('reconciliacao_migracao'); 
  const ag = ss.getSheetByName('agendamentos'); 
  const aud = ss.getSheetByName('auditoria_migracao'); 
 
  if (!rec) { 
    ui.alert( 
      'ETAPA 3A.4\n\n' + 
      'A aba "reconciliacao_migracao" não existe.\n\n' + 
      'Execute primeiro a Etapa 3A.2.' 
    ); 
    return; 
  } 
 
  if (!ag) { 
    ui.alert('A aba "agendamentos" não existe.'); 
    return; 
  } 
 
  if (!aud) { 
    ui.alert('A aba "auditoria_migracao" não existe.'); 
    return; 
  } 
 
  if (rec.getLastRow() < 2) { 
    ui.alert( 
      'ETAPA 3A.4\n\n' + 
      'Não existem registros na aba reconciliacao_migracao.' 
    ); 
    return; 
  } 
 
 
  // ---------------------------------------------------------- 
  // 1. Ler cabeçalhos da reconciliação 
  // ---------------------------------------------------------- 
 
  const rh = rec 
    .getRange(1, 1, 1, rec.getLastColumn()) 
    .getValues()[0] 
    .map(function(h) { 
      return String(h).trim(); 
    }); 
 
  const ri = {}; 
 
  rh.forEach(function(h, i) { 
    ri[h] = i; 
  }); 
 
 
  const camposObrigatoriosRec = [ 
    'agendamento_id', 
    'dono_historico', 
    'pet_historico', 
    'telefone_historico', 
    'classificacao', 
    'pontuacao', 
    'candidato_pet_id', 
    'candidato_dono', 
    'candidato_pet', 
    'candidato_telefone', 
    'candidato_cliente_id', 
    'motivo', 
    'segundo_candidato', 
    'acao_recomendada', 
    'observacao', 
    'status' 
  ]; 
 
  camposObrigatoriosRec.forEach(function(campo) { 
 
    if (ri[campo] === undefined) { 
      throw new Error( 
        'Aba reconciliacao_migracao sem a coluna obrigatória: ' + 
        campo 
      ); 
    } 
 
  }); 
 
 
  // ---------------------------------------------------------- 
  // 2. Ler agendamentos atuais 
  // ---------------------------------------------------------- 
 
  const ah = ag 
    .getRange(1, 1, 1, ag.getLastColumn()) 
    .getValues()[0] 
    .map(function(h) { 
      return String(h).trim(); 
    }); 
 
  const ai = {}; 
 
  ah.forEach(function(h, i) { 
    ai[h] = i; 
  }); 
 
 
  ['id', 'pet_id', 'cliente_id'].forEach(function(campo) { 
 
    if (ai[campo] === undefined) { 
      throw new Error( 
        'Aba agendamentos sem a coluna obrigatória: ' + 
        campo 
      ); 
    } 
 
  }); 
 
 
  const agValues = ag.getLastRow() >= 2 
    ? ag.getRange( 
        2, 
        1, 
        ag.getLastRow() - 1, 
        ag.getLastColumn() 
      ).getValues() 
    : []; 
 
 
  const agPorId = {}; 
 
  agValues.forEach(function(row) { 
 
    const id = String(row[ai.id] || '').trim(); 
 
    if (id) { 
      agPorId[id] = row; 
    } 
 
  }); 
 
 
  // ---------------------------------------------------------- 
  // 3. Ler reconciliações 
  // ---------------------------------------------------------- 
 
  const recValues = rec.getRange( 
    2, 
    1, 
    rec.getLastRow() - 1, 
    rec.getLastColumn() 
  ).getValues(); 
 
 
  // ---------------------------------------------------------- 
  // 4. Atualizar auditoria dos 23 já aplicados 
  // ---------------------------------------------------------- 
 
  const auditoriaAtualizada = 
    atualizarAuditoriaReconcilicoesAplicadas_( 
      aud, 
      recValues, 
      ri 
    ); 
 
 
  // ---------------------------------------------------------- 
  // 5. Separar somente os casos ainda não aplicados 
  // ---------------------------------------------------------- 
 
  const pendencias = []; 
 
  recValues.forEach(function(row) { 
 
    const status = String( 
      row[ri.status] || '' 
    ).trim().toUpperCase(); 
 
    if (status === 'APLICADO') { 
      return; 
    } 
 
    const agId = String( 
      row[ri.agendamento_id] || '' 
    ).trim(); 
 
    const agAtual = agPorId[agId]; 
 
    // Proteção adicional: 
    // se o agendamento já possuir vínculo, não entra 
    // novamente como pendência de 3A.4. 
    if (agAtual) { 
 
      const possuiPet = String( 
        agAtual[ai.pet_id] || '' 
      ).trim(); 
 
      const possuiCliente = String( 
        agAtual[ai.cliente_id] || '' 
      ).trim(); 
 
      if (possuiPet || possuiCliente) { 
        return; 
      } 
 
    } 
 
 
    pendencias.push({ 
      id: row[ri.id], 
      agendamento_id: agId, 
      dono_historico: row[ri.dono_historico], 
      pet_historico: row[ri.pet_historico], 
      telefone_historico: row[ri.telefone_historico], 
      classificacao: row[ri.classificacao], 
      pontuacao: row[ri.pontuacao], 
      candidato_pet_id: row[ri.candidato_pet_id], 
      candidato_dono: row[ri.candidato_dono], 
      candidato_pet: row[ri.candidato_pet], 
      candidato_telefone: row[ri.candidato_telefone], 
      candidato_cliente_id: row[ri.candidato_cliente_id], 
      motivo: row[ri.motivo], 
      segundo_candidato: row[ri.segundo_candidato], 
      acao_recomendada: row[ri.acao_recomendada], 
      observacao: row[ri.observacao], 
      status: status || 'PENDENTE' 
    }); 
 
  }); 
 
 
  // ---------------------------------------------------------- 
  // 6. Criar painel de revisão 
  // ---------------------------------------------------------- 
 
  const nomeAba = 'REVISAO_ETAPA_3A4'; 
 
  let painel = ss.getSheetByName(nomeAba); 
 
  if (!painel) { 
    painel = ss.insertSheet(nomeAba); 
  } else { 
    painel.clearContents(); 
    painel.clearFormats(); 
  } 
 
 
  const headersPainel = [ 
    'agendamento_id', 
    'classificacao', 
    'pontuacao', 
    'dono_historico', 
    'pet_historico', 
    'telefone_historico', 
    'candidato_pet_id', 
    'candidato_dono', 
    'candidato_pet', 
    'candidato_telefone', 
    'candidato_cliente_id', 
    'motivo', 
    'segundo_candidato', 
    'acao_recomendada', 
    'observacao', 
    'status_atual', 
    'decisao_manual', 
    'observacao_manual' 
  ]; 
 
 
  const linhasPainel = pendencias.map(function(p) { 
 
    return [ 
      p.agendamento_id, 
      p.classificacao, 
      p.pontuacao, 
      p.dono_historico, 
      p.pet_historico, 
      p.telefone_historico, 
      p.candidato_pet_id, 
      p.candidato_dono, 
      p.candidato_pet, 
      p.candidato_telefone, 
      p.candidato_cliente_id, 
      p.motivo, 
      p.segundo_candidato, 
      p.acao_recomendada, 
      p.observacao, 
      p.status, 
      '', 
      '' 
    ]; 
 
  }); 
 
 
  painel 
    .getRange( 
      1, 
      1, 
      1, 
      headersPainel.length 
    ) 
    .setValues([headersPainel]); 
 
 
  if (linhasPainel.length) { 
 
    painel 
      .getRange( 
        2, 
        1, 
        linhasPainel.length, 
        headersPainel.length 
      ) 
      .setValues(linhasPainel); 
 
  } 
 
 
  painel 
    .getRange( 
      1, 
      1, 
      1, 
      headersPainel.length 
    ) 
    .setFontWeight('bold'); 
 
 
  painel.setFrozenRows(1); 
 
 
  // ---------------------------------------------------------- 
  // 7. Criar filtro 
  // ---------------------------------------------------------- 
 
  if (painel.getFilter()) { 
    painel.getFilter().remove(); 
  } 
 
  if (painel.getLastRow() >= 2) { 
 
    painel 
      .getRange( 
        1, 
        1, 
        painel.getLastRow(), 
        headersPainel.length 
      ) 
      .createFilter(); 
 
  } 
 
 
  painel.autoResizeColumns( 
    1, 
    headersPainel.length 
  ); 
 
 
  // ---------------------------------------------------------- 
  // 8. Criar resumo 
  // ---------------------------------------------------------- 
 
  const resumo = { 
    total: pendencias.length, 
    investigar: 0, 
    media: 0, 
    ambiguos: 0, 
    semCandidato: 0, 
    outros: 0 
  }; 
 
 
  pendencias.forEach(function(p) { 
 
    const c = String( 
      p.classificacao || '' 
    ).trim().toUpperCase(); 
 
    if (c === 'INVESTIGAR') { 
 
      resumo.investigar++; 
 
    } else if (c === 'MÉDIA CONFIANÇA') { 
 
      resumo.media++; 
 
    } else if (c === 'AMBÍGUO') { 
 
      resumo.ambiguos++; 
 
    } else if (c === 'SEM CANDIDATO') { 
 
      resumo.semCandidato++; 
 
    } else { 
 
      resumo.outros++; 
 
    } 
 
  }); 
 
 
  // ---------------------------------------------------------- 
  // 9. Auditoria 
  // ---------------------------------------------------------- 
 
  registrarAuditoria_( 
    'ETAPA_3A4_REVISAO_PENDENCIAS', 
    'reconciliacao_migracao', 
    '-', 
    'Pendências restantes: ' + resumo.total + 
    ' | Investigar: ' + resumo.investigar + 
    ' | Média: ' + resumo.media + 
    ' | Ambíguos: ' + resumo.ambiguos + 
    ' | Sem candidato: ' + resumo.semCandidato + 
    ' | Outros: ' + resumo.outros + 
    ' | Auditorias resolvidas: ' + auditoriaAtualizada + 
    ' | Nenhum agendamento alterado.' 
  ); 
 
 
  // ---------------------------------------------------------- 
  // 10. Resultado 
  // ---------------------------------------------------------- 
 
  ui.alert( 
    'ETAPA 3A.4 — REVISÃO PREPARADA\n\n' + 
 
    'Agendamentos ainda sem vínculo: ' + 
    resumo.total + '\n\n' + 
 
    'INVESTIGAR: ' + 
    resumo.investigar + '\n' + 
 
    'MÉDIA CONFIANÇA: ' + 
    resumo.media + '\n' + 
 
    'AMBÍGUOS: ' + 
    resumo.ambiguos + '\n' + 
 
    'SEM CANDIDATO: ' + 
    resumo.semCandidato + '\n\n' + 
 
    'Auditorias resolvidas: ' + 
    auditoriaAtualizada + '\n\n' + 
 
    'Nenhum agendamento foi alterado.\n\n' + 
 
    'Foi criada a aba:\n' + 
    'REVISAO_ETAPA_3A4' 
  ); 
 
} 
 
 
/** 
 * Marca na auditoria_migracao os registros correspondentes 
 * às reconciliações que já foram aplicadas. 
 * 
 * NÃO altera agendamentos. 
 */ 
function atualizarAuditoriaReconcilicoesAplicadas_( 
  aud, 
  recValues, 
  ri 
) { 
 
  if (!aud || aud.getLastRow() < 2) { 
    return 0; 
  } 
 
 
  const ah = aud 
    .getRange( 
      1, 
      1, 
      1, 
      aud.getLastColumn() 
    ) 
    .getValues()[0] 
    .map(function(h) { 
      return String(h).trim(); 
    }); 
 
 
  const ai = {}; 
 
  ah.forEach(function(h, i) { 
    ai[h] = i; 
  }); 
 
 
  const obrigatorias = [ 
    'id', 
    'data_hora', 
    'tipo', 
    'entidade', 
    'registro_id', 
    'status', 
    'descricao' 
  ]; 
 
 
  obrigatorias.forEach(function(campo) { 
 
    if (ai[campo] === undefined) { 
      throw new Error( 
        'auditoria_migracao sem coluna: ' + 
        campo 
      ); 
    } 
 
  }); 
 
 
  const values = aud 
    .getRange( 
      2, 
      1, 
      aud.getLastRow() - 1, 
      aud.getLastColumn() 
    ) 
    .getValues(); 
 
 
  const aplicados = {}; 
 
  recValues.forEach(function(row) { 
 
    const status = String( 
      row[ri.status] || '' 
    ).trim().toUpperCase(); 
 
    if (status !== 'APLICADO') { 
      return; 
    } 
 
    const agId = String( 
      row[ri.agendamento_id] || '' 
    ).trim(); 
 
    if (agId) { 
      aplicados[agId] = true; 
    } 
 
  }); 
 
 
  let alterados = 0; 
 
 
  values.forEach(function(row) { 
 
    const entidade = String( 
      row[ai.entidade] || '' 
    ).trim(); 
 
    const registroId = String( 
      row[ai.registro_id] || '' 
    ).trim(); 
 
    if ( 
      entidade === 'agendamentos' && 
      aplicados[registroId] 
    ) { 
 
      const statusAtual = String( 
        row[ai.status] || '' 
      ).trim().toUpperCase(); 
 
      if (statusAtual !== 'RESOLVIDO') { 
 
        row[ai.status] = 'RESOLVIDO'; 
 
        row[ai.descricao] = 
          String(row[ai.descricao] || '') + 
          ' | Reconciliação aplicada na Etapa 3A.3.'; 
 
        alterados++; 
 
      } 
 
    } 
 
  }); 
 
 
  if (values.length) { 
 
    aud 
      .getRange( 
        2, 
        1, 
        values.length, 
        aud.getLastColumn() 
      ) 
      .setValues(values); 
 
  } 
 
 
  return alterados; 
 
} 
 
 
/** 
 * ============================================================ 
 * ETAPA 3A.4 — VALIDAÇÃO DO PAINEL 
 * ============================================================ 
 * 
 * Confere se: 
 * - existem exatamente os casos ainda sem pet_id; 
 * - nenhum caso aplicado voltou para a fila; 
 * - as classificações estão coerentes; 
 * - nenhum agendamento é alterado. 
 */ 
function validarEtapa3A4() { 
 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
 
  const painel = ss.getSheetByName( 
    'REVISAO_ETAPA_3A4' 
  ); 
 
  const ag = ss.getSheetByName( 
    'agendamentos' 
  ); 
 
 
  if (!painel || !ag) { 
 
    ui.alert( 
      'Execute primeiro a opção de preparação da Etapa 3A.4.' 
    ); 
 
    return; 
 
  } 
 
 
  const ags = readSheetObjects_(ag); 
 
  const pendentes = ags.filter(function(a) { 
 
    return String( 
      a.pet_id || '' 
    ).trim() === ''; 
 
  }); 
 
 
  const totalPainel = 
    Math.max( 
      painel.getLastRow() - 1, 
      0 
    ); 
 
 
  const classificacoes = { 
    'INVESTIGAR': 0, 
    'MÉDIA CONFIANÇA': 0, 
    'AMBÍGUO': 0, 
    'SEM CANDIDATO': 0 
  }; 
 
 
  if (totalPainel > 0) { 
 
    const dados = painel 
      .getRange( 
        2, 
        1, 
        totalPainel, 
        painel.getLastColumn() 
      ) 
      .getValues(); 
 
 
    dados.forEach(function(row) { 
 
      const c = String( 
        row[1] || '' 
      ).trim().toUpperCase(); 
 
      if (classificacoes[c] !== undefined) { 
        classificacoes[c]++; 
      } 
 
    }); 
 
  } 
 
 
  const esperado = 
    pendentes.length; 
 
 
  const ok = 
    esperado === totalPainel; 
 
 
  registrarAuditoria_( 
    'VALIDAR_ETAPA_3A4', 
    'reconciliacao_migracao', 
    '-', 
    'Agendamentos sem pet_id: ' + 
    esperado + 
    ' | Painel: ' + 
    totalPainel + 
    ' | Resultado: ' + 
    (ok ? 'OK' : 'DIVERGENTE') 
  ); 
 
 
  ui.alert( 
 
    'VALIDAÇÃO ETAPA 3A.4\n\n' + 
 
    'Agendamentos sem pet_id: ' + 
    esperado + '\n' + 
 
    'Registros no painel: ' + 
    totalPainel + '\n\n' + 
 
    'INVESTIGAR: ' + 
    classificacoes['INVESTIGAR'] + '\n' + 
 
    'MÉDIA CONFIANÇA: ' + 
    classificacoes['MÉDIA CONFIANÇA'] + '\n' + 
 
    'AMBÍGUO: ' + 
    classificacoes['AMBÍGUO'] + '\n' + 
 
    'SEM CANDIDATO: ' + 
    classificacoes['SEM CANDIDATO'] + '\n\n' + 
 
    'RESULTADO: ' + 
    (ok ? 'OK' : 'DIVERGÊNCIA') + '\n\n' + 
 
    'Nenhum agendamento foi alterado.' 
 
  ); 
 
} 
 
 
/** 
 * ============================================================ 
 * ETAPA 3A.4 — SINCRONIZAR DECISÕES MANUAIS 
 * ============================================================ 
 * 
 * Esta função NÃO aplica nada. 
 * 
 * Ela pega a decisão feita na aba REVISAO_ETAPA_3A4 
 * e transfere somente a decisão para a aba 
 * reconciliacao_migracao. 
 * 
 * Valores permitidos: 
 * 
 *   APROVADO 
 *   INVESTIGAR 
 *   NÃO APLICAR 
 * 
 * Para APROVADO: 
 * o item 11 continuará sendo responsável pela aplicação real. 
 */ 
function sincronizarDecisoesEtapa3A4() { 
 
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const ui = SpreadsheetApp.getUi(); 
 
  const painel = ss.getSheetByName( 
    'REVISAO_ETAPA_3A4' 
  ); 
 
  const rec = ss.getSheetByName( 
    'reconciliacao_migracao' 
  ); 
 
 
  if (!painel || !rec) { 
 
    ui.alert( 
      'Execute primeiro a preparação da Etapa 3A.4.' 
    ); 
 
    return; 
 
  } 
 
 
  if (painel.getLastRow() < 2) { 
 
    ui.alert( 
      'Não existem pendências no painel.' 
    ); 
 
    return; 
 
  } 
 
 
  const confirmacao = ui.alert( 
 
    'SINCRONIZAR DECISÕES', 
 
    'As decisões preenchidas manualmente serão copiadas ' + 
    'para a aba reconciliacao_migracao.\n\n' + 
 
    'Nenhum agendamento será alterado.\n\n' + 
 
    'Somente os status de revisão serão atualizados.\n\n' + 
 
    'Deseja continuar?', 
 
    ui.ButtonSet.YES_NO 
 
  ); 
 
 
  if ( 
    confirmacao !== 
    ui.Button.YES 
  ) { 
 
    ui.alert( 
      'Operação cancelada.' 
    ); 
 
    return; 
 
  } 
 
 
  // ---------------------------------------------------------- 
  // Ler painel 
  // ---------------------------------------------------------- 
 
  const ph = painel 
    .getRange( 
      1, 
      1, 
      1, 
      painel.getLastColumn() 
    ) 
    .getValues()[0] 
    .map(function(h) { 
      return String(h).trim(); 
    }); 
 
 
  const pi = {}; 
 
  ph.forEach(function(h, i) { 
    pi[h] = i; 
  }); 
 
 
  const painelValues = 
    painel.getRange( 
      2, 
      1, 
      painel.getLastRow() - 1, 
      painel.getLastColumn() 
    ).getValues(); 
 
 
  // ---------------------------------------------------------- 
  // Ler reconciliação 
  // ---------------------------------------------------------- 
 
  const rh = rec 
    .getRange( 
      1, 
      1, 
      1, 
      rec.getLastColumn() 
    ) 
    .getValues()[0] 
    .map(function(h) { 
      return String(h).trim(); 
    }); 
 
 
  const ri = {}; 
 
  rh.forEach(function(h, i) { 
    ri[h] = i; 
  }); 
 
 
  const recValues = 
    rec.getRange( 
      2, 
      1, 
      rec.getLastRow() - 1, 
      rec.getLastColumn() 
    ).getValues(); 
 
 
  const porAgendamento = {}; 
 
  recValues.forEach(function(row, i) { 
 
    const id = String( 
      row[ri.agendamento_id] || '' 
    ).trim(); 
 
    if (id) { 
      porAgendamento[id] = i; 
    } 
 
  }); 
 
 
  let aprovados = 0; 
  let investigar = 0; 
  let naoAplicar = 0; 
  let ignorados = 0; 
 
 
  // ---------------------------------------------------------- 
  // Aplicar decisões somente na aba de reconciliação 
  // ---------------------------------------------------------- 
 
  painelValues.forEach(function(row) { 
 
    const agId = String( 
      row[pi.agendamento_id] || '' 
    ).trim(); 
 
    const decisao = String( 
      row[pi.decisao_manual] || '' 
    ) 
      .trim() 
      .toUpperCase(); 
 
 
    if (!agId || !decisao) { 
      ignorados++; 
      return; 
    } 
 
 
    const pos = 
      porAgendamento[agId]; 
 
 
    if (pos === undefined) { 
      ignorados++; 
      return; 
    } 
 
 
    if (decisao === 'APROVADO') { 
 
      recValues[pos][ri.status] = 
        'APROVADO'; 
 
      recValues[pos][ri.acao_recomendada] = 
        'APROVADO'; 
 
      aprovados++; 
 
    } else if ( 
      decisao === 'INVESTIGAR' 
    ) { 
 
      recValues[pos][ri.status] = 
        'INVESTIGAR'; 
 
      recValues[pos][ri.acao_recomendada] = 
        'INVESTIGAR'; 
 
      investigar++; 
 
    } else if ( 
      decisao === 'NÃO APLICAR' || 
      decisao === 'NAO APLICAR' 
    ) { 
 
      recValues[pos][ri.status] = 
        'NÃO APLICAR'; 
 
      recValues[pos][ri.acao_recomendada] = 
        'NÃO APLICAR'; 
 
      naoAplicar++; 
 
    } else { 
 
      ignorados++; 
 
    } 
 
  }); 
 
 
  rec 
    .getRange( 
      2, 
      1, 
      recValues.length, 
      rec.getLastColumn() 
    ) 
    .setValues(recValues); 
 
 
  registrarAuditoria_( 
    'SINCRONIZAR_DECISOES_3A4', 
    'reconciliacao_migracao', 
    '-', 
    'APROVADOS: ' + 
    aprovados + 
    ' | INVESTIGAR: ' + 
    investigar + 
    ' | NÃO APLICAR: ' + 
    naoAplicar + 
    ' | Ignorados: ' + 
    ignorados + 
    ' | Nenhum agendamento alterado.' 
  ); 
 
 
  ui.alert( 
 
    'DECISÕES SINCRONIZADAS\n\n' + 
 
    'APROVADOS: ' + 
    aprovados + '\n' + 
 
    'INVESTIGAR: ' + 
    investigar + '\n' + 
 
    'NÃO APLICAR: ' + 
    naoAplicar + '\n' + 
 
    'Ignorados: ' + 
    ignorados + '\n\n' + 
 
    'Nenhum agendamento foi alterado.'
  );
}
// API — ETAPA 4A: ESCRITA CONTROLADA
// ============================================================
//
// A leitura (GET) permanece compatível com a etapa 3A.4.
// A escrita NÃO fica aberta para dados reais nesta etapa.
//
// Por segurança, POST aceita somente três ações de teste:
//   teste_criar
//   teste_atualizar
//   teste_excluir
//
// Todas exigem a confirmação LANE_PETS_TESTE_4A.
// O registro criado precisa começar por TEST4A- e só ele pode
// ser atualizado/excluído pela API nesta fase.
//
// Depois que a 4A for validada, abriremos a escrita real em uma
// etapa separada, com validações específicas para cada entidade.
// ============================================================

/* ============================================================
 * ETAPA 4B — AUTENTICAÇÃO E PERMISSÕES
 * ============================================================ */

const AUTH_CONFIG_ = {
  SESSION_MINUTES: 120,
  FINANCIAL_SESSION_MINUTES: 30,
  PROP_ADMIN_HASH: 'LANE_AUTH_ADMIN_HASH',
  PROP_FINANCEIRO_HASH: 'LANE_AUTH_FINANCEIRO_HASH',
  PROP_AUTH_INITIALIZED: 'LANE_AUTH_INITIALIZED'
};

/**
 * Retorna propriedades privadas do sistema.
 */
function authProps_() {
  return PropertiesService.getScriptProperties();
}

/**
 * Gera SHA-256 em hexadecimal.
 */
function hashSenha_(senha) {
  const texto = String(senha || '');

  if (!texto) {
    throw new Error('Senha não informada.');
  }

  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    texto,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(byte) {
    const v = byte < 0 ? byte + 256 : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/**
 * Inicializa as credenciais.
 *
 * IMPORTANTE:
 * As senhas iniciais são definidas apenas uma vez.
 *
 * Depois de executar esta função, altere as senhas
 * através da função alterarSenhaAuth().
 */
function inicializarAutenticacao4B() {
  const props = authProps_();

  const existente = props.getProperty(AUTH_CONFIG_.PROP_AUTH_INITIALIZED);

  if (existente === 'true') {
    throw new Error(
      'A autenticação já foi inicializada. ' +
      'Não execute esta função novamente.'
    );
  }

  /*
   * SENHAS INICIAIS TEMPORÁRIAS
   *
   * Troque imediatamente depois da primeira execução.
   */
  const senhaAdminInicial = 'LanePets@Admin4B';
  const senhaFinanceiroInicial = 'LanePets@Financeiro4B';

  props.setProperties({
    [AUTH_CONFIG_.PROP_ADMIN_HASH]: hashSenha_(senhaAdminInicial),
    [AUTH_CONFIG_.PROP_FINANCEIRO_HASH]: hashSenha_(senhaFinanceiroInicial),
    [AUTH_CONFIG_.PROP_AUTH_INITIALIZED]: 'true'
  }, true);

  SpreadsheetApp.getUi().alert(
    'AUTENTICAÇÃO 4B INICIALIZADA\n\n' +
    'Administrador: ' + senhaAdminInicial + '\n' +
    'Financeiro: ' + senhaFinanceiroInicial + '\n\n' +
    'IMPORTANTE:\n' +
    'Altere as duas senhas imediatamente.'
  );
}

/**
 * Altera uma senha administrativa.
 *
 * tipo:
 *   admin
 *   financeiro
 */
function alterarSenhaAuth(tipo, senhaAtual, novaSenha) {
  const t = String(tipo || '').trim().toLowerCase();

  if (t !== 'admin' && t !== 'financeiro') {
    throw new Error(
      'Tipo de senha inválido. Use "admin" ou "financeiro".'
    );
  }

  if (!senhaAtual || !novaSenha) {
    throw new Error('Senha atual e nova senha são obrigatórias.');
  }

  if (String(novaSenha).length < 8) {
    throw new Error(
      'A nova senha deve possuir pelo menos 8 caracteres.'
    );
  }

  const props = authProps_();

  const chave =
    t === 'admin'
      ? AUTH_CONFIG_.PROP_ADMIN_HASH
      : AUTH_CONFIG_.PROP_FINANCEIRO_HASH;

  const hashAtual = props.getProperty(chave);

  if (!hashAtual) {
    throw new Error(
      'Autenticação ainda não foi inicializada.'
    );
  }

  if (hashSenha_(senhaAtual) !== hashAtual) {
    throw new Error('Senha atual incorreta.');
  }

  props.setProperty(chave, hashSenha_(novaSenha));

  return {
    ok: true,
    tipo: t,
    message: 'Senha alterada com sucesso.'
  };
}

/**
 * Valida uma senha e retorna o nível de acesso.
 */
function autenticarSenha4B_(senha) {
  const props = authProps_();

  const adminHash =
    props.getProperty(AUTH_CONFIG_.PROP_ADMIN_HASH);

  const financeiroHash =
    props.getProperty(AUTH_CONFIG_.PROP_FINANCEIRO_HASH);

  if (!adminHash || !financeiroHash) {
    throw new Error(
      'Autenticação não inicializada. ' +
      'Execute inicializarAutenticacao4B().'
    );
  }

  const hash = hashSenha_(senha);

  if (hash === adminHash) {
    return {
      autenticado: true,
      perfil: 'admin'
    };
  }

  if (hash === financeiroHash) {
    return {
      autenticado: true,
      perfil: 'financeiro'
    };
  }

  throw new Error('Senha inválida.');
}

/**
 * Cria uma sessão temporária.
 */
function criarSessaoAuth4B_(perfil) {
  const token = Utilities.getUuid();

  const cache = CacheService.getScriptCache();

  const dados = {
    perfil: perfil,
    criadoEm: new Date().toISOString()
  };

  cache.put(
    'LANE_AUTH_' + token,
    JSON.stringify(dados),
    AUTH_CONFIG_.SESSION_MINUTES * 60
  );

  return token;
}

/**
 * Recupera uma sessão.
 */
function obterSessaoAuth4B_(token) {
  if (!token) {
    throw new Error('Sessão não informada.');
  }

  const cache = CacheService.getScriptCache();

  const bruto = cache.get('LANE_AUTH_' + String(token));

  if (!bruto) {
    throw new Error(
      'Sessão inválida ou expirada.'
    );
  }

  try {
    return JSON.parse(bruto);
  } catch (err) {
    throw new Error('Sessão inválida.');
  }
}

/**
 * Exige uma sessão autenticada.
 */
function exigirAuth4B_(token, perfilMinimo) {
  const sessao = obterSessaoAuth4B_(token);

  const perfil = String(sessao.perfil || '').toLowerCase();

  if (perfilMinimo === 'admin' && perfil !== 'admin') {
    throw new Error(
      'Acesso negado. Requer perfil administrador.'
    );
  }

  if (
    perfilMinimo === 'financeiro' &&
    perfil !== 'financeiro' &&
    perfil !== 'admin'
  ) {
    throw new Error(
      'Acesso negado. Requer perfil financeiro.'
    );
  }

  return sessao;
}

/**
 * Login da API.
 *
 * Exemplo:
 * ?action=login&senha=...
 */
function apiLogin4B_(p) {
  const senha = String(p.senha || '');

  if (!senha) {
    throw new Error('Senha obrigatória.');
  }

  const props = authProps_();
  const adminHash = props.getProperty(AUTH_CONFIG_.PROP_ADMIN_HASH);
  const financeiroHash = props.getProperty(AUTH_CONFIG_.PROP_FINANCEIRO_HASH);

  if (!adminHash || !financeiroHash) {
    throw new Error(
      'Autenticação não inicializada. Execute inicializarAutenticacao4B().'
    );
  }

  const hash = hashSenha_(senha);

  if (hash === financeiroHash) {
    throw new Error(
      'A senha financeira é uma autorização adicional. ' +
      'Faça primeiro o login administrativo.'
    );
  }

  if (hash !== adminHash) {
    throw new Error('Senha administrativa inválida.');
  }

  const token = criarSessaoAuth4B_('admin');

  return {
    autenticado: true,
    perfil: 'admin',
    token: token,
    expiresInMinutes: AUTH_CONFIG_.SESSION_MINUTES
  };
}

/**
 * Verifica uma sessão.
 */
function apiAuthStatus4B_(p) {
  const sessao = obterSessaoAuth4B_(
    String(p.token || '')
  );

  return {
    ok: true,
    autenticado: true,
    perfil: sessao.perfil,
    criadoEm: sessao.criadoEm
  };
}

/**
 * Encerra uma sessão.
 */
function apiLogout4B_(p) {
  const token = String(p.token || '');

  if (!token) {
    return {
      ok: true,
      encerrado: false
    };
  }

  CacheService.getScriptCache()
    .remove('LANE_AUTH_' + token);

  return {
    ok: true,
    encerrado: true
  };
}

/**
 * ETAPA M2 — Autorização financeira adicional.
 * A senha financeira nunca cria uma sessão administrativa.
 * Ela só pode ser usada enquanto houver uma sessão admin válida.
 */
function criarSessaoFinanceira4B_(adminToken) {
  const adminSessao = exigirAuth4B_(adminToken, 'admin');
  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const dados = {
    perfil: 'financeiro',
    adminToken: String(adminToken),
    criadoEm: new Date().toISOString(),
    adminCriadoEm: adminSessao.criadoEm
  };

  cache.put(
    'LANE_FIN_AUTH_' + token,
    JSON.stringify(dados),
    AUTH_CONFIG_.FINANCIAL_SESSION_MINUTES * 60
  );

  return token;
}

function obterSessaoFinanceira4B_(token) {
  if (!token) throw new Error('Autorização financeira não informada.');

  const cache = CacheService.getScriptCache();
  const bruto = cache.get('LANE_FIN_AUTH_' + String(token));
  if (!bruto) throw new Error('Autorização financeira inválida ou expirada.');

  let sessao;
  try { sessao = JSON.parse(bruto); }
  catch (err) { throw new Error('Autorização financeira inválida.'); }

  // A autorização financeira depende da sessão administrativa original.
  exigirAuth4B_(String(sessao.adminToken || ''), 'admin');
  return sessao;
}

function exigirAuthFinanceira4B_(token) {
  return obterSessaoFinanceira4B_(token);
}

function apiFinanceiroLogin4B_(p) {
  const adminToken = String(p.token || '');
  exigirAuth4B_(adminToken, 'admin');

  const senha = String(p.senha || '');
  if (!senha) throw new Error('Senha financeira obrigatória.');

  const hash = hashSenha_(senha);
  const financeiroHash = authProps_().getProperty(AUTH_CONFIG_.PROP_FINANCEIRO_HASH);

  if (!financeiroHash || hash !== financeiroHash) {
    throw new Error('Senha financeira inválida.');
  }

  const tokenFinanceiro = criarSessaoFinanceira4B_(adminToken);
  return {
    autorizado: true,
    perfil: 'financeiro',
    token: tokenFinanceiro,
    expiresInMinutes: AUTH_CONFIG_.FINANCIAL_SESSION_MINUTES
  };
}

function apiFinanceiroStatus4B_(p) {
  const sessao = exigirAuthFinanceira4B_(String(p.financeiro_token || p.token_financeiro || ''));
  return {
    autorizado: true,
    perfil: 'financeiro',
    criadoEm: sessao.criadoEm,
    expiresInMinutes: AUTH_CONFIG_.FINANCIAL_SESSION_MINUTES
  };
}

function apiFinanceiroLogout4B_(p) {
  const token = String(p.financeiro_token || p.token_financeiro || '');
  if (!token) return { encerrado: false };
  CacheService.getScriptCache().remove('LANE_FIN_AUTH_' + token);
  return { encerrado: true };
}

function apiFinanceiroListar4B_(p) {
  const token = String(
    p.financeiro_token ||
    p.token_financeiro ||
    ''
  );

  exigirAuthFinanceira4B_(token);

  const sheet = requireSheet_('entradasESaidas');
  let dados = readSheetObjects_(sheet);

  const de = String(p.de || '').trim();
  const ate = String(p.ate || '').trim();
  const unidade = normalizarUnidadeApi_(p.unidade || '');

  dados = dados.filter(function(item) {
    const data = dataApi_(item.data);

    if (de && data < de) return false;
    if (ate && data > ate) return false;

    if (
      unidade &&
      normalizarUnidadeApi_(item.unidade || '') !== unidade
    ) {
      return false;
    }

    return true;
  });

  dados = dados.map(function(item) {
    return {
      id: String(item.id || ''),
      data: dataApi_(item.data),
      descricao: String(item.descricao || ''),
      tipo: String(item.tipo || ''),
      valor: numeroApi_(item.valor),
      unidade: normalizarUnidadeApi_(item.unidade || ''),
      origem: String(item.origem || '')
    };
  });

  dados.sort(function(a, b) {
    return String(a.data).localeCompare(String(b.data));
  });

  const limite = Math.min(
    Math.max(Number(p.limite || 500), 1),
    2000
  );

  const offset = Math.max(
    Number(p.offset || 0),
    0
  );

  return {
    ok: true,
    total: dados.length,
    offset: offset,
    limite: limite,
    hasMore: offset + limite < dados.length,
    lancamentos: dados.slice(offset, offset + limite)
  };
}


function apiFinanceiroResumo4B_(p) {
  const token = String(
    p.financeiro_token ||
    p.token_financeiro ||
    ''
  );

  exigirAuthFinanceira4B_(token);

  const sheet = requireSheet_('entradasESaidas');
  let dados = readSheetObjects_(sheet);

  const de = String(p.de || '').trim();
  const ate = String(p.ate || '').trim();
  const unidade = normalizarUnidadeApi_(p.unidade || '');

  dados = dados.filter(function(item) {
    const data = dataApi_(item.data);

    if (de && data < de) return false;
    if (ate && data > ate) return false;

    if (
      unidade &&
      normalizarUnidadeApi_(item.unidade || '') !== unidade
    ) {
      return false;
    }

    return true;
  });

  let entradas = 0;
  let saidas = 0;

  dados.forEach(function(item) {
    const tipo = normalizarTextoApi_(item.tipo || '');
    const valor = numeroApi_(item.valor);

    if (tipo === 'entrada') {
      entradas += valor;
    }

    if (
      tipo === 'saida' ||
      tipo === 'saída'
    ) {
      saidas += valor;
    }
  });

  const saldo = entradas - saidas;

  return {
    ok: true,
    de: de || null,
    ate: ate || null,
    unidade: unidade || null,
    entradas: entradas,
    saidas: saidas,
    saldo: saldo,
    totalLancamentos: dados.length
  };
}

function respostaApi_(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      data: data,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ETAPA M2 — Contrato/API.
 *
 * Regras públicas:
 *   GET  health
 *   GET  auth_status?token=...
 *   POST login { action:"login", senha:"..." }
 *   POST logout { action:"logout", token:"..." }
 *
 * Rotas administrativas (exigem token de perfil admin):
 *   GET dashboard | metricas
 *   GET agendamentos | appointments
 *   GET pets | clientes | servicos | unidades
 *
 * A escrita de produção permanece bloqueada nesta etapa.
 * Somente os testes controlados da Etapa 4A continuam disponíveis.
 */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'health').trim().toLowerCase();
    let payload;

    // Health é público por desenho.
    if (action === 'health') {
      payload = apiHealth_();
      return respostaApi_(payload);
    }

    // GET nunca recebe senha. Login definitivo é POST.
    if (action === 'login') {
      throw new Error('Login deve ser realizado por POST. A senha não deve ser enviada na URL.');
    }

    if (action === 'auth_status') {
      payload = apiAuthStatus4B_(p);
      return respostaApi_(payload);
    }

    if (action === 'logout') {
      payload = apiLogout4B_(p);
      return respostaApi_(payload);
    }

    if (action === 'financeiro_status') {
  payload = apiFinanceiroStatus4B_(p);
  return respostaApi_(payload);
}

if (action === 'financeiro_listar') {
  payload = apiFinanceiroListar4B_(p);
  return respostaApi_(payload);
}

if (action === 'financeiro_resumo') {
  payload = apiFinanceiroResumo4B_(p);
  return respostaApi_(payload);
}

if (action === 'financeiro_login') {
  throw new Error('financeiro_login deve ser realizado por POST.');
}

// Todas as demais rotas de dados do sistema exigem sessão administrativa.
exigirAuth4B_(String(p.token || ''), 'admin');

    if (action === 'dashboard' || action === 'metricas') {
      payload = apiDashboard_(p);
    } else if (action === 'agendamentos' || action === 'appointments') {
      payload = apiAgendamentos_(p);
    } else if (action === 'pets') {
      payload = apiLista_('pets', p);
    } else if (action === 'cliente_buscar') {
      payload = apiBuscarCliente_(p);
    } else if (action === 'clientes') {
      payload = apiLista_('clientes', p);
    } else if (action === 'servicos') {
      payload = apiLista_('servicos', p);
    } else if (action === 'unidades') {
      payload = { unidades: UNIDADES_ };
    } else {
      throw new Error('Ação não suportada: ' + action);
    }

    return respostaApi_(payload);
  } catch (err) {
    return apiJsonErro_(err);
  }
}

function doPost(e) {
  try {
    const body = apiLerBodyPost_(e);
    const action = String(body.action || '').trim().toLowerCase();
    let payload;

    // ============================================================
    // AUTENTICAÇÃO — NÃO ALTERAR
    // ============================================================

    // Autenticação não exige sessão prévia.
    if (action === 'login') {
      payload = apiLogin4B_(body);
      return respostaApi_(payload);
    }

    if (action === 'auth_status') {
      payload = apiAuthStatus4B_(body);
      return respostaApi_(payload);
    }

    if (action === 'logout') {
      payload = apiLogout4B_(body);
      return respostaApi_(payload);
    }

    if (action === 'financeiro_login') {
      payload = apiFinanceiroLogin4B_(body);
      return respostaApi_(payload);
    }

    if (action === 'financeiro_status') {
      payload = apiFinanceiroStatus4B_(body);
      return respostaApi_(payload);
    }

    if (action === 'financeiro_logout') {
      payload = apiFinanceiroLogout4B_(body);
      return respostaApi_(payload);
    }

    // ============================================================
    // CLIENTES — ETAPA F1
    // ============================================================

    if (action === 'clientes_criar') {
      payload = apiCriarCliente_(body);
      return respostaApi_(payload);
    }

    // ============================================================
    // ESCRITA CONTROLADA 4A — NÃO REMOVER
    // ============================================================

    if (
      action === 'teste_criar' ||
      action === 'teste_atualizar' ||
      action === 'teste_excluir'
    ) {
      exigirAuth4B_(String(body.token || ''), 'admin');
      payload = apiEscritaControlada_(body);
      return respostaApi_(payload);
    }

    throw new Error(
      'Ação POST não suportada nesta etapa: ' + action
    );

  } catch (err) {
    return apiJsonErro_(err);
  }
}

const UNIDADES_ = ['Franco','Caieiras'];
const STATUS_CANONICOS_ = {
  pendente:'Pendente',
  aguardando:'Pendente',
  agendado:'Pendente',
  'em andamento':'Em andamento',
  em_andamento:'Em andamento',
  andamento:'Em andamento',
  iniciado:'Em andamento',
  'em processo':'Em andamento',
  entregue:'Entregue',
  finalizado:'Entregue',
  'finalizado/entregue':'Entregue',
  concluido:'Entregue',
  concluído:'Entregue',
  cancelado:'Cancelado'
};

function apiHealth_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  return {
    ok:true,
    system:'Lane Pets',
    version:'M2-api-contract-security-1',
    timestamp:new Date().toISOString(),
    timezone:Session.getScriptTimeZone()||'America/Sao_Paulo',
    sheets:SHEET_NAMES.filter(n=>!!ss.getSheetByName(n)),
    unidades:UNIDADES_,
    api:'contracted-read + controlled-test-write',
    escrita:{
      habilitada:true,
      modo:'CONTROLADO',
      acoesPermitidas:['teste_criar','teste_atualizar','teste_excluir'],
      prefixoTeste:'TEST4A-'
    }
  };
}

function apiDashboard_(p){
  const ags=obterAgendamentosApi_();
  const unidade=normalizarUnidadeApi_(p.unidade||'');
  const dataRef=p.data||formatarDataApi_(new Date());
  const base=ags.filter(a=>!unidade||a.unidade===unidade);
  const hoje=base.filter(a=>dataApi_(a.dataHora)===dataRef);
  const metrics={
    total:base.length,
    hoje:hoje.length,
    pendentes:base.filter(a=>a.statusCanonico==='Pendente').length,
    emAndamento:base.filter(a=>a.statusCanonico==='Em andamento').length,
    entregues:base.filter(a=>a.statusCanonico==='Entregue').length,
    cancelados:base.filter(a=>a.statusCanonico==='Cancelado').length
  };
  const porUnidade={};
  UNIDADES_.forEach(function(u){
    const x=ags.filter(a=>a.unidade===u);
    porUnidade[u]={
      total:x.length,
      hoje:x.filter(a=>dataApi_(a.dataHora)===dataRef).length,
      pendentes:x.filter(a=>a.statusCanonico==='Pendente').length,
      emAndamento:x.filter(a=>a.statusCanonico==='Em andamento').length,
      entregues:x.filter(a=>a.statusCanonico==='Entregue').length,
      cancelados:x.filter(a=>a.statusCanonico==='Cancelado').length
    };
  });
  return {
    ok:true,
    data:dataRef,
    unidade:unidade||null,
    metrics:metrics,
    porUnidade:porUnidade,
    semUnidade:ags.filter(a=>!a.unidade).length
  };
}

function apiAgendamentos_(p){
  let dados=obterAgendamentosApi_();
  const unidade=normalizarUnidadeApi_(p.unidade||'');
  const status=normalizarStatusApi_(p.status||'');
  const data=p.data||'';
  const de=p.de||'', ate=p.ate||'';
  if(unidade)dados=dados.filter(a=>a.unidade===unidade);
  if(status)dados=dados.filter(a=>a.statusCanonico===status);
  if(data)dados=dados.filter(a=>dataApi_(a.dataHora)===data);
  if(de)dados=dados.filter(a=>dataApi_(a.dataHora)>=de);
  if(ate)dados=dados.filter(a=>dataApi_(a.dataHora)<=ate);
  if(p.busca){
    const q=normalizarTextoApi_(p.busca);
    dados=dados.filter(a=>[a.dono,a.pet,a.telefone,a.id].some(v=>normalizarTextoApi_(v).indexOf(q)>=0));
  }
  dados.sort((a,b)=>new Date(a.dataHora||0)-new Date(b.dataHora||0));
  const limite=Math.min(Math.max(Number(p.limite||500),1),2000),inicio=Math.max(Number(p.offset||0),0);
  const pagina=dados.slice(inicio,inicio+limite);
  return {
    ok:true,
    total:dados.length,
    offset:inicio,
    limite:limite,
    hasMore:inicio+limite<dados.length,
    agendamentos:pagina
  };
}

function obterAgendamentosApi_(){
  const s=requireSheet_('agendamentos');
  return readSheetObjects_(s).map(function(a){
    const o={};
    Object.keys(a).forEach(k=>o[k]=a[k]);
    o.id=String(o.id||'');
    o.unidade=normalizarUnidadeApi_(o.unidade||'');
    o.statusCanonico=normalizarStatusApi_(o.status||'');
    o.dataHora=normalizarDataHoraApi_(o.dataHora);
    o.total=numeroApi_(o.total);
    o.valorTransporte=numeroApi_(o.valorTransporte);
    o.servicos=parseJsonSeguroApi_(o.servicos_json,[]);
    return o;
  });
}

function apiLista_(nome,p){
  const rows=readSheetObjects_(requireSheet_(nome));
  const busca=normalizarTextoApi_(p.busca||'');
  let out=rows.filter(r=>!busca||Object.keys(r).some(k=>normalizarTextoApi_(r[k]).indexOf(busca)>=0));
  const limite=Math.min(Math.max(Number(p.limite||500),1),2000),offset=Math.max(Number(p.offset||0),0);
  return {ok:true,total:out.length,offset:offset,limite:limite,items:out.slice(offset,offset+limite)};
}

function requireSheet_(nome){
  const s=typeof nome==='string'
    ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome)
    : nome;
  if(!s)throw new Error('Aba obrigatória não encontrada: '+(typeof nome==='string'?nome:'desconhecida'));
  return s;
}

function normalizarUnidadeApi_(v){
  const x=normalizarTextoApi_(v);
  if(x==='franco')return 'Franco';
  if(x==='caieiras')return 'Caieiras';
  return '';
}

function normalizarStatusApi_(v){
  const x=normalizarTextoApi_(v);
  return STATUS_CANONICOS_[x]||'';
}

function normalizarTextoApi_(v){
  return String(v==null?'':v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .trim()
    .replace(/\s+/g,' ');
}

function numeroApi_(v){
  if(typeof v==='number')return isFinite(v)?v:0;
  const x=String(v==null?'':v).trim();
  if(!x)return 0;
  const limpo=x.replace(/R\$\s?/gi,'').replace(/\s/g,'');
  let normalizado=limpo;
  if(limpo.indexOf(',')>=0)normalizado=limpo.replace(/\./g,'').replace(',','.');
  const n=Number(normalizado);
  return isNaN(n)?0:n;
}

function parseJsonSeguroApi_(v,def){
  if(!v)return def;
  try{return JSON.parse(String(v));}
  catch(e){return def;}
}

function normalizarDataHoraApi_(v){
  if(v instanceof Date&&!isNaN(v))return v.toISOString();
  const x=String(v||'').trim();
  if(!x)return '';
  const d=new Date(x);
  return isNaN(d)?x:d.toISOString();
}

function dataApi_(v){
  if(!v)return '';
  const d=v instanceof Date?v:new Date(v);
  if(isNaN(d))return String(v).slice(0,10);
  return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');
}

function formatarDataApi_(d){
  return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/Sao_Paulo','yyyy-MM-dd');
}

function apiJsonErro_(err){
  return ContentService
    .createTextOutput(JSON.stringify({
      ok:false,
      error:String(err&&err.message||err),
      timestamp:new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiLerBodyPost_(e){
  if(!e)throw new Error('Requisição POST ausente.');
  const raw=(e.postData&&e.postData.contents)||'';
  if(!raw)throw new Error('Corpo JSON da requisição não informado.');
  let body;
  try{body=JSON.parse(raw);}catch(err){throw new Error('Corpo POST inválido: JSON esperado.');}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Corpo POST deve ser um objeto JSON.');
  return body;
}

function validarTokenTesteApi_(body){
  if(String(body.confirmacao||'')!=='LANE_PETS_TESTE_4A'){
    throw new Error('Escrita bloqueada. Informe confirmacao=LANE_PETS_TESTE_4A para o teste controlado.');
  }
}

function apiEscritaControlada_(body){
  validarTokenTesteApi_(body);
  const action=String(body.action||'').trim().toLowerCase();
  if(['teste_criar','teste_atualizar','teste_excluir'].indexOf(action)===-1){
    throw new Error('Nesta etapa somente teste_criar, teste_atualizar e teste_excluir são permitidos.');
  }

  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    if(action==='teste_criar')return apiTesteCriarAgendamento_(body);
    if(action==='teste_atualizar')return apiTesteAtualizarAgendamento_(body);
    return apiTesteExcluirAgendamento_(body);
  }finally{
    lock.releaseLock();
  }
}

function apiTesteCriarAgendamento_(body){
  const s=requireSheet_('agendamentos');
  const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String);
  const idx=apiMapaCabecalhos_(h);
  const id='TEST4A-'+Utilities.getUuid().slice(0,12).toUpperCase();
  const dataHora=String(body.dataHora||'2099-12-31T12:00:00-03:00');
  const status=normalizarStatusApi_(body.status||'Pendente')||'Pendente';
  const unidade=normalizarUnidadeApi_(body.unidade||'Franco')||'Franco';
  const row=new Array(h.length).fill('');

  apiSetCell_(row,idx,'id',id);
  apiSetCell_(row,idx,'pet','TESTE API 4A');
  apiSetCell_(row,idx,'dono','TESTE API 4A');
  apiSetCell_(row,idx,'telefone','0000000000');
  apiSetCell_(row,idx,'dataHora',dataHora);
  apiSetCell_(row,idx,'servicos_json','[]');
  apiSetCell_(row,idx,'total',0);
  apiSetCell_(row,idx,'transporte','Não');
  apiSetCell_(row,idx,'valorTransporte',0);
  apiSetCell_(row,idx,'status',status);
  apiSetCell_(row,idx,'pagamentoStatus','Pendente');
  apiSetCell_(row,idx,'formaPagamento','');
  apiSetCell_(row,idx,'obs','REGISTRO DE TESTE — ETAPA 4A');
  apiSetCell_(row,idx,'unidade',unidade);
  apiSetCell_(row,idx,'cliente_id','');
  apiSetCell_(row,idx,'pet_id','');

  s.getRange(s.getLastRow()+1,1,1,row.length).setValues([row]);
  SpreadsheetApp.flush();

  return {
    ok:true,
    action:'teste_criar',
    id:id,
    entidade:'agendamentos',
    unidade:unidade,
    status:status,
    message:'Registro de teste criado com sucesso. Nenhum registro real foi alterado.'
  };
}

function apiTesteAtualizarAgendamento_(body){
  const id=String(body.id||'').trim();
  apiValidarIdTeste_(id);
  const s=requireSheet_('agendamentos');
  const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String);
  const idx=apiMapaCabecalhos_(h);
  const dados=s.getDataRange().getValues();
  let linha=-1;
  for(let i=1;i<dados.length;i++){
    if(String(dados[i][idx.id]||'')===id){linha=i+1;break;}
  }
  if(linha<0)throw new Error('Registro de teste não encontrado: '+id);

  const status=normalizarStatusApi_(body.status||'Em andamento')||'Em andamento';
  const unidade=normalizarUnidadeApi_(body.unidade||'Caieiras')||'Caieiras';
  const alteracoes={
    dono:'TESTE API 4A ATUALIZADO',
    pet:'TESTE API 4A ATUALIZADO',
    status:status,
    unidade:unidade,
    obs:'REGISTRO DE TESTE — ETAPA 4A — ATUALIZADO'
  };
  Object.keys(alteracoes).forEach(function(k){
    if(idx[k]!==undefined)s.getRange(linha,idx[k]+1).setValue(alteracoes[k]);
  });
  SpreadsheetApp.flush();

  return {
    ok:true,
    action:'teste_atualizar',
    id:id,
    alteracoes:alteracoes,
    message:'Registro de teste atualizado com sucesso. Nenhum registro real foi alterado.'
  };
}

function apiTesteExcluirAgendamento_(body){
  const id=String(body.id||'').trim();
  apiValidarIdTeste_(id);
  const s=requireSheet_('agendamentos');
  const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String);
  const idx=apiMapaCabecalhos_(h);
  const dados=s.getDataRange().getValues();
  let linha=-1;
  for(let i=1;i<dados.length;i++){
    if(String(dados[i][idx.id]||'')===id){linha=i+1;break;}
  }
  if(linha<0)throw new Error('Registro de teste não encontrado: '+id);
  s.deleteRow(linha);
  SpreadsheetApp.flush();

  return {
    ok:true,
    action:'teste_excluir',
    id:id,
    message:'Registro de teste excluído com sucesso. Nenhum registro real foi alterado.'
  };
}

function apiValidarIdTeste_(id){
  id=String(id||'').trim().toUpperCase();
  // IDs gerados pela ETAPA 4A usam TEST4A- + fragmento de UUID,
  // que pode conter hífens. Somente esse padrão é aceito.
  if(!/^TEST4A-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(id)){
    throw new Error('Operação bloqueada: somente IDs TEST4A-* podem ser alterados nesta etapa.');
  }
  return id;
}

function apiMapaCabecalhos_(h){
  const idx={};
  h.forEach(function(x,i){idx[String(x).trim()]=i;});
  if(idx.id===undefined)throw new Error('Aba agendamentos não possui coluna id.');
  return idx;
}

function apiSetCell_(row,idx,key,value){
  if(idx[key]!==undefined)row[idx[key]]=value;
}

function testarApiEscrita4A(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const ag=requireSheet_('agendamentos');
  const antes=ag.getLastRow()-1;
  let id='';
  let criado=false,atualizado=false,excluido=false;
  const token='LANE_PETS_TESTE_4A';

  try{
    const criar=apiEscritaControlada_({
      action:'teste_criar',
      confirmacao:token,
      unidade:'Franco',
      status:'Pendente',
      dataHora:'2099-12-31T12:00:00-03:00'
    });
    if(!criar.ok)throw new Error('Falha no teste de criação.');
    id=criar.id;
    criado=true;

    const leituraCriado=apiAgendamentos_({busca:id,limite:10});
    if(leituraCriado.total!==1)throw new Error('GET não encontrou exatamente o registro recém-criado.');

    const atualizar=apiEscritaControlada_({
      action:'teste_atualizar',
      confirmacao:token,
      id:id,
      unidade:'Caieiras',
      status:'Em andamento'
    });
    if(!atualizar.ok)throw new Error('Falha no teste de atualização.');
    atualizado=true;

    const leituraAtualizado=apiAgendamentos_({busca:id,limite:10});
    if(leituraAtualizado.total!==1)throw new Error('GET não encontrou o registro após atualização.');
    const item=leituraAtualizado.agendamentos[0];
    if(item.statusCanonico!=='Em andamento'||item.unidade!=='Caieiras'){
      throw new Error('GET não confirmou corretamente a atualização do registro de teste.');
    }

    const excluir=apiEscritaControlada_({
      action:'teste_excluir',
      confirmacao:token,
      id:id
    });
    if(!excluir.ok)throw new Error('Falha no teste de exclusão.');
    excluido=true;

    const leituraFinal=apiAgendamentos_({busca:id,limite:10});
    if(leituraFinal.total!==0)throw new Error('O registro de teste ainda aparece após exclusão.');

    SpreadsheetApp.flush();
    const depois=ag.getLastRow()-1;
    if(depois!==antes)throw new Error('A contagem de agendamentos não retornou ao valor original: antes='+antes+', depois='+depois+'.');

    registrarAuditoria_('TESTE_API_ESCRITA_4A','agendamentos',id,'Criar + GET + atualizar + GET + excluir + GET. Contagem final restaurada: '+depois+'.');

    SpreadsheetApp.getUi().alert(
      'ETAPA 4A — API DE ESCRITA CONTROLADA\n\n'+
      'RESULTADO: OK\n\n'+
      'Criar: OK\n'+
      'GET após criar: OK\n'+
      'Atualizar: OK\n'+
      'GET após atualizar: OK\n'+
      'Excluir: OK\n'+
      'GET após excluir: OK\n\n'+
      'Agendamentos antes: '+antes+'\n'+
      'Agendamentos depois: '+depois+'\n\n'+
      'O banco voltou exatamente à contagem original.\n'+
      'Nenhum dado real foi alterado.'
    );
    return {ok:true,id:id,antes:antes,depois:depois};
  }catch(err){
    // Se qualquer etapa falhar depois da criação, tentamos remover
    // automaticamente somente o registro TEST4A criado nesta execução.
    if(id&&criado&&!excluido){
      try{
        apiEscritaControlada_({action:'teste_excluir',confirmacao:token,id:id});
      }catch(cleanErr){
        registrarAuditoria_('ERRO_LIMPEZA_TESTE_API_4A','agendamentos',id,String(cleanErr.message||cleanErr));
      }
    }
    registrarAuditoria_('ERRO_TESTE_API_ESCRITA_4A','agendamentos',id,String(err.message||err));
    SpreadsheetApp.getUi().alert(
      'ETAPA 4A — FALHA\n\n'+
      String(err.message||err)+'\n\n'+
      (criado&&!excluido
        ? 'Foi tentada a limpeza automática do registro de teste '+id+'.\nVerifique a aba agendamentos antes de continuar.'
        : 'Nenhum dado real deveria ter sido alterado.')
    );
    throw err;
  }
}

function testarApiLeitura(){
  const r=apiHealth_();
  const a=apiDashboard_({});
  SpreadsheetApp.getUi().alert(
    'API somente leitura / base 4A\n\n'+
    'Status: '+(r.ok?'OK':'ERRO')+'\n'+
    'Versão: '+r.version+'\n'+
    'Agendamentos lidos: '+a.metrics.total+'\n'+
    'Hoje: '+a.metrics.hoje+'\n'+
    'Pendentes: '+a.metrics.pendentes+'\n'+
    'Em andamento: '+a.metrics.emAndamento+'\n'+
    'Entregues: '+a.metrics.entregues+'\n\n'+
    'Escrita: CONTROLADA (somente teste 4A).'
  );
}

function apiBuscarCliente_(p) {
  const token = String(p.token || '').trim();

  // Mantém a mesma autenticação administrativa.
  exigirAuth4B_(token, 'admin');

  const nome = String(p.nome || '').trim();
  const telefone = String(p.telefone || '').trim();

  if (!nome && !telefone) {
    throw new Error('Informe nome ou telefone para buscar o cliente.');
  }

  const sheet = requireSheet_('clientes');
  const rows = readSheetObjects_(sheet);

  const nomeBusca = normalizarTextoApi_(nome);
  const telefoneBusca = String(telefone).replace(/\D/g, '');

  const encontrados = rows.filter(function(cliente) {
    const nomeCliente = normalizarTextoApi_(cliente.nome || '');
    const telefoneCliente = String(cliente.telefone || '').replace(/\D/g, '');

    const nomeConfere = nomeBusca && nomeCliente === nomeBusca;
    const telefoneConfere =
      telefoneBusca && telefoneCliente === telefoneBusca;

    /*
     * Regra de identificação:
     * - Se temos nome e telefone, os dois precisam conferir.
     * - Se só temos um dos dois, usamos o campo disponível.
     */
    if (nomeBusca && telefoneBusca) {
      return nomeConfere && telefoneConfere;
    }

    if (nomeBusca) {
      return nomeConfere;
    }

    return telefoneConfere;
  });

  return {
    ok: true,
    encontrado: encontrados.length > 0,
    total: encontrados.length,
    cliente: encontrados.length > 0 ? encontrados[0] : null
  };
}

function apiCriarCliente_(body) {
  // ============================================================
  // CLIENTES — CRIAÇÃO
  // ============================================================

  const token = String(body.token || '').trim();

  // ------------------------------------------------------------
  // 1. AUTENTICAÇÃO ADMINISTRATIVA
  // ------------------------------------------------------------
  const sessao = exigirAuth4B_(token, 'admin');

  // ------------------------------------------------------------
  // 2. RECEBER DADOS
  // ------------------------------------------------------------
  const dados = body.dados || body.cliente;

  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error('Dados do cliente inválidos.');
  }

  // ------------------------------------------------------------
  // 3. NORMALIZAR CAMPOS
  // ------------------------------------------------------------
  const nome = String(dados.nome || '').trim();
  const telefone = String(dados.telefone || '').trim();
  const endereco = String(dados.endereco || '').trim();
  const observacoes = String(dados.observacoes || '').trim();
  const origem = String(dados.origem || 'sistema').trim();
  const status = String(dados.status || 'ativo').trim().toLowerCase();

  // ------------------------------------------------------------
  // 4. VALIDAÇÕES
  // ------------------------------------------------------------
  if (!nome) {
    throw new Error('Nome do cliente é obrigatório.');
  }

  if (status !== 'ativo' && status !== 'inativo') {
    throw new Error('Status do cliente deve ser "ativo" ou "inativo".');
  }

  // ------------------------------------------------------------
  // 5. LOCK DE ESCRITA
  // ------------------------------------------------------------
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    // ----------------------------------------------------------
    // 6. LOCALIZAR ABA
    // ----------------------------------------------------------
    const sheet = requireSheet_('clientes');

    // ----------------------------------------------------------
    // 7. LER CABEÇALHOS
    // ----------------------------------------------------------
    const lastColumn = sheet.getLastColumn();

    if (lastColumn < 1) {
      throw new Error('A aba clientes não possui cabeçalho.');
    }

    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(function(h) {
        return String(h).trim();
      });

    const indices = {};

    headers.forEach(function(header, index) {
      indices[header] = index;
    });

    const camposObrigatorios = [
      'id',
      'nome',
      'telefone',
      'endereco',
      'observacoes',
      'origem',
      'status'
    ];

    camposObrigatorios.forEach(function(campo) {
      if (indices[campo] === undefined) {
        throw new Error(
          'A aba clientes não possui a coluna obrigatória: ' + campo
        );
      }
    });

    // ----------------------------------------------------------
    // 8. GERAR ID NO SERVIDOR
    // ----------------------------------------------------------
    const id =
      'CLI-' +
      Utilities.getUuid()
        .replace(/-/g, '')
        .substring(0, 12)
        .toUpperCase();

    // ----------------------------------------------------------
    // 9. MONTAR LINHA
    // ----------------------------------------------------------
    const row = new Array(headers.length).fill('');

    row[indices.id] = id;
    row[indices.nome] = nome;
    row[indices.telefone] = telefone;
    row[indices.endereco] = endereco;
    row[indices.observacoes] = observacoes;
    row[indices.origem] = origem;
    row[indices.status] = status;

    // ----------------------------------------------------------
    // 10. GRAVAR
    // ----------------------------------------------------------
    sheet
      .getRange(sheet.getLastRow() + 1, 1, 1, row.length)
      .setValues([row]);

    SpreadsheetApp.flush();

    // ----------------------------------------------------------
    // 11. AUDITORIA
    // ----------------------------------------------------------
    registrarAuditoria_(
      'CRIAR',
      'clientes',
      id,
      'Cliente criado pela API. Usuário: ' +
        String(sessao.perfil || 'admin') +
        '.'
    );

    // ----------------------------------------------------------
    // 12. RESPOSTA PADRONIZADA
    // ----------------------------------------------------------
    return {
      ok: true,
      data: {
        id: id,
        cliente: {
          id: id,
          nome: nome,
          telefone: telefone,
          endereco: endereco,
          observacoes: observacoes,
          origem: origem,
          status: status
        }
      },
      timestamp: new Date().toISOString()
    };

  } finally {
    lock.releaseLock();
  }
}




