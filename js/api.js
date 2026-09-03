/**
 * Lane Pets — Cliente da API
 * Versão: integração financeira corrigida
 *
 * Regras:
 * - sessão administrativa em sessionStorage
 * - autorização financeira é vinculada à sessão administrativa
 * - não existe token financeiro separado no backend atual
 * - GETs protegidos enviam o token administrativo na query string
 */

(function () {
  'use strict';

  const cfg = window.LANE_PETS_CONFIG || {};
  const API_URL = String(cfg.API_URL || '').trim();

  const TOKEN_KEY = 'lanePetsAuthToken';

  function assertConfigured() {
    if (!API_URL || API_URL.includes('COLE_AQUI')) {
      throw new Error(
        'API do Google Apps Script ainda não configurada em js/config.js.'
      );
    }
  }

  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  function setToken(token) {
    if (!token) {
      throw new Error('Token de sessão não informado.');
    }

    sessionStorage.setItem(TOKEN_KEY, String(token));
  }

  function clearToken() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  async function parseResponse(response) {
    const text = await response.text();

    let envelope;

    try {
      envelope = JSON.parse(text);
    } catch (_) {
      throw new Error(
        'Resposta inválida da API: ' + text.slice(0, 300)
      );
    }

    if (!envelope || envelope.ok !== true) {
      throw new Error(
        envelope && envelope.error
          ? envelope.error
          : 'Erro desconhecido na API.'
      );
    }

    return envelope.data;
  }

  async function get(action, params = {}) {
    assertConfigured();

    const url = new URL(API_URL);

    url.searchParams.set('action', action);

    const token = getToken();

    if (token) {
      url.searchParams.set('token', token);
    }

    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        url.searchParams.set(key, value);
      }
    });

    return parseResponse(
      await fetch(url.toString(), {
        method: 'GET'
      })
    );
  }

  async function post(action, data = {}) {
    assertConfigured();

    const body = {
      action,
      ...data
    };

    const token = getToken();

    if (token) {
      body.token = token;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    return parseResponse(response);
  }

  /*
   * ============================================================
   * LOGIN ADMINISTRATIVO
   * ============================================================
   */

  async function login(senha) {
    if (!senha) {
      throw new Error('Senha obrigatória.');
    }

    const data = await post('login', {
      senha: String(senha)
    });

    setToken(data.token);

    return data;
  }

  async function authStatus() {
    const token = getToken();

    if (!token) {
      return {
        autenticado: false
      };
    }

    try {
      return await get('auth_status');
    } catch (err) {
      clearToken();
      throw err;
    }
  }

  async function logout() {
    const token = getToken();

    try {
      if (token) {
        await post('logout');
      }
    } finally {
      clearToken();
    }

    return {
      encerrado: true
    };
  }

  /*
   * ============================================================
   * AUTORIZAÇÃO FINANCEIRA
   * ============================================================
   *
   * O backend atual NÃO cria um segundo token.
   *
   * A autorização financeira fica vinculada
   * ao token da sessão administrativa.
   */

  async function financeiroLogin(senha) {
  if (!getToken()) {
    throw new Error(
      'Faça o login administrativo antes da autorização financeira.'
    );
  }

  if (!senha) {
    throw new Error('Senha financeira obrigatória.');
  }

  const data = await post('financeiro_login', {
    senha: String(senha)
  });

  if (!data || !data.token) {
    throw new Error(
      'A API autorizou o acesso financeiro, mas não retornou o token financeiro.'
    );
  }

  sessionStorage.setItem(
    'lanePetsFinanceiroToken',
    String(data.token)
  );

  return data;
}

  async function financeiroStatus() {
  const tokenFinanceiro =
    sessionStorage.getItem('lanePetsFinanceiroToken');

  if (!tokenFinanceiro) {
    return {
      autorizado: false
    };
  }

  return get('financeiro_status', {
    financeiro_token: tokenFinanceiro
  });
}
  async function financeiroLogout() {
  const tokenFinanceiro =
    sessionStorage.getItem('lanePetsFinanceiroToken');

  if (!tokenFinanceiro) {
    return {
      encerrado: true
    };
  }

  try {
    return await post('financeiro_logout', {
      financeiroToken: tokenFinanceiro
    });
  } finally {
    sessionStorage.removeItem(
      'lanePetsFinanceiroToken'
    );
  }
}

  /*
   * ============================================================
   * FINANCEIRO
   * ============================================================
   */
  async function financeiroListar(params = {}) {
    const tokenFinanceiro =
      sessionStorage.getItem('lanePetsFinanceiroToken');

    if (!tokenFinanceiro) {
      throw new Error('Autorização financeira não informada.');
    }

    return get(
      'financeiro_listar',
      {
        ...params,
        financeiro_token: tokenFinanceiro
      }
    );
  }

  async function financeiroResumo(params = {}) {
  const tokenFinanceiro =
    sessionStorage.getItem('lanePetsFinanceiroToken');

  if (!tokenFinanceiro) {
    throw new Error('Autorização financeira não informada.');
  }

  return get(
    'financeiro_resumo',
    {
      ...params,
      financeiro_token: tokenFinanceiro
    }
  );
}

  /*
   * ============================================================
   * CLIENTES
   * ============================================================
   */

  async function clientesBuscar(params = {}) {
    return get(
      'cliente_buscar',
      {
        nome: params.nome || '',
        telefone: params.telefone || ''
      }
    );
  }

  /*
   * ============================================================
   * API PÚBLICA
   * ============================================================
   */

  window.LaneAPI = {

    // ------------------------------------------
    // Sessão administrativa
    // ------------------------------------------

    login,

    authStatus,

    logout,

    getToken,

    setToken,

    clearToken,


    // ------------------------------------------
    // Autorização financeira
    // ------------------------------------------

    financeiroLogin,

    financeiroStatus,

    financeiroLogout,

    financeiroListar,

    financeiroResumo,


    // ------------------------------------------
    // Consultas gerais
    // ------------------------------------------

    health: () =>
      get('health'),

    dashboard: params =>
      get(
        'dashboard',
        params || {}
      ),

    metricas: params =>
      get(
        'metricas',
        params || {}
      ),

    agendamentos: params =>
      get(
        'agendamentos',
        params || {}
      ),

    appointments: params =>
      get(
        'appointments',
        params || {}
      ),

    pets: params =>
      get(
        'pets',
        params || {}
      ),

    clientes: params =>
      get(
        'clientes',
        params || {}
      ),

    clientesBuscar,

    clientesCriar: dados =>
      post(
        'clientes_criar',
        {
          dados: dados
        }
      ),

    servicos: params =>
      get(
        'servicos',
        params || {}
      ),

    unidades: () =>
      get('unidades'),


    // ------------------------------------------
    // Interface futura / CRUD controlado
    // ------------------------------------------

    getAll: entity =>
      get(entity),

    getById: (entity, id) =>
      get(
        entity,
        {
          id
        }
      ),

    create: () =>
      Promise.reject(
        new Error(
          'CRUD de produção ainda não liberado.'
        )
      ),

    update: () =>
      Promise.reject(
        new Error(
          'CRUD de produção ainda não liberado.'
        )
      ),

    remove: () =>
      Promise.reject(
        new Error(
          'CRUD de produção ainda não liberado.'
        )
      ),

    movement: () =>
      Promise.reject(
        new Error(
          'Movimentação de estoque ainda não liberada.'
        )
      ),

    report: () =>
      Promise.reject(
        new Error(
          'Relatórios API ainda não liberados.'
        )
      )
  };

})();