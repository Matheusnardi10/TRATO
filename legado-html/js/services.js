/* ============================================================
   TRATO — services.js
   Regras de negócio. As telas NUNCA falam com o LocalStorage
   diretamente: elas chamam estes services.
   Para plugar a API depois, basta trocar o corpo dos métodos
   (Store.all -> fetch('/api/...')).
   ============================================================ */

/* ---------- Cálculos ---------- */
var Calc = {
  // Soma todas as categorias de custo de um objeto { material: 100, ... }
  custoTotal: function (custos) {
    if (!custos) return 0;
    return Object.keys(custos).reduce(function (soma, chave) {
      return soma + (Number(custos[chave]) || 0);
    }, 0);
  },
  // Valor final a partir do custo e da margem desejada (%)
  valorComMargem: function (custo, margemPercent) {
    var m = Number(margemPercent) || 0;
    if (m >= 100) m = 99;
    return custo / (1 - m / 100);
  },
  lucro: function (valor, custo) {
    return (Number(valor) || 0) - (Number(custo) || 0);
  },
  margem: function (valor, custo) {
    var v = Number(valor) || 0;
    if (v === 0) return 0;
    return (Calc.lucro(v, custo) / v) * 100;
  },
  lucroPorHora: function (lucro, horas) {
    var h = Number(horas) || 0;
    if (h === 0) return 0;
    return lucro / h;
  },
  diferenca: function (real, previsto) {
    return (Number(real) || 0) - (Number(previsto) || 0);
  }
};

/* ---------- Autenticação simulada ---------- */
var AuthService = {
  entrar: function (email, senha) {
    var usuario = Store.all('usuarios').filter(function (u) {
      return u.email.toLowerCase() === String(email).toLowerCase().trim();
    })[0];
    if (!usuario) return { ok: false, erro: 'Não encontramos uma conta com esse e-mail.' };
    if (usuario.senha !== senha) return { ok: false, erro: 'Senha incorreta. Tente novamente.' };
    return { ok: true, usuario: usuario };
  },
  criar: function (dados) {
    var existe = Store.all('usuarios').some(function (u) {
      return u.email.toLowerCase() === String(dados.email).toLowerCase().trim();
    });
    if (existe) return { ok: false, erro: 'Este e-mail já está cadastrado.' };
    var usuario = {
      id: Utils.uid('user'),
      nome: dados.nome,
      nomeProfissional: dados.nomeProfissional || dados.nome,
      email: String(dados.email).trim(),
      telefone: dados.telefone,
      senha: dados.senha,
      nicho: dados.nicho || null,
      criadoEm: Utils.hojeISO(),
      negocio: {}
    };
    Store.insert('usuarios', usuario);
    return { ok: true, usuario: usuario };
  },
  atualizar: function (id, mudancas) {
    return Store.update('usuarios', id, mudancas);
  },
  usuarioAtual: function () { return Store.Sessao.atual(); },
  sair: function () { Store.Sessao.encerrar(); }
};

/* ---------- Clientes ---------- */
var ClientService = {
  listar: function () { return Store.all('clientes'); },
  buscar: function (id) { return Store.find('clientes', id); },
  nome: function (id) {
    var c = Store.find('clientes', id);
    return c ? c.nome : 'Cliente removido';
  },
  criar: function (dados) {
    dados.id = Utils.uid('cli');
    dados.criadoEm = Utils.hojeISO();
    dados.status = dados.status || 'ativo';
    return Store.insert('clientes', dados);
  },
  atualizar: function (id, mudancas) { return Store.update('clientes', id, mudancas); },
  excluir: function (id) { Store.remove('clientes', id); },
  possuiVinculos: function (id) {
    return BudgetService.listar().some(function (o) { return o.clienteId === id; }) ||
      ContractService.listar().some(function (c) { return c.clienteId === id; }) ||
      ServiceService.porCliente(id).length > 0;
  },
  // Histórico completo do cliente: orçamentos, contratos, serviços e pagamentos
  historico: function (id) {
    var orcamentos = BudgetService.listar().filter(function (o) { return o.clienteId === id; });
    var contratos = ContractService.listar().filter(function (c) { return c.clienteId === id; });
    var servicos = ServiceService.porCliente(id);
    var pagamentos = PaymentService.listar().filter(function (p) { return p.clienteId === id; });
    return { orcamentos: orcamentos, contratos: contratos, servicos: servicos, pagamentos: pagamentos };
  },
  // Total já movimentado pelo cliente
  resumo: function (id) {
    var servicos = ServiceService.porCliente(id);
    var total = servicos.reduce(function (s, sv) { return s + sv.valor; }, 0);
    var ultimo = servicos.slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; })[0];
    return { quantidade: servicos.length, total: total, ultimoServico: ultimo || null };
  }
};

/* ---------- Orçamentos ---------- */
var BudgetService = {
  listar: function () { return Store.all('orcamentos'); },
  buscar: function (id) { return Store.find('orcamentos', id); },
  porStatus: function (status) {
    if (!status || status === 'todos') return this.listar();
    return Store.where('orcamentos', function (o) { return o.status === status; });
  },
  criar: function (dados) {
    dados.id = Utils.uid('orc');
    dados.numero = Utils.proximoNumero(Store.all('orcamentos'), 'numero');
    dados.criadoEm = Utils.hojeISO();
    dados.status = dados.status || 'rascunho';
    return Store.insert('orcamentos', dados);
  },
  atualizar: function (id, mudancas) { return Store.update('orcamentos', id, mudancas); },
  excluir: function (id) { Store.remove('orcamentos', id); },
  duplicar: function (id) {
    var original = this.buscar(id);
    if (!original) return null;
    var copia = Object.assign({}, original);
    delete copia.id;
    copia.numero = Utils.proximoNumero(Store.all('orcamentos'), 'numero');
    copia.status = 'rascunho';
    copia.criadoEm = Utils.hojeISO();
    copia.titulo = copia.titulo + ' (cópia)';
    return Store.insert('orcamentos', copia);
  },
  enviar: function (id) {
    var orcamento = Store.update('orcamentos', id, { status: 'aguardando' });
    NotificationService.criar({
      tipo: 'info',
      titulo: 'Orçamento enviado',
      texto: 'O orçamento #' + orcamento.numero + ' foi enviado para ' + ClientService.nome(orcamento.clienteId) + '.'
    });
    return orcamento;
  },
  possuiContrato: function (id) {
    return ContractService.listar().some(function (c) { return c.orcamentoId === id; });
  },
  aprovar: function (id) {
    var orcamento = Store.update('orcamentos', id, { status: 'aprovado' });
    NotificationService.criar({
      tipo: 'success',
      titulo: 'Orçamento aprovado',
      texto: 'O orçamento #' + orcamento.numero + ' foi aprovado por ' + ClientService.nome(orcamento.clienteId) + '.'
    });
    return orcamento;
  },
  recusar: function (id) { return Store.update('orcamentos', id, { status: 'recusado' }); },
  totalItens: function (orcamento) {
    return (orcamento.itens || []).reduce(function (s, i) {
      return s + (Number(i.quantidade) || 0) * (Number(i.valorUnitario) || 0);
    }, 0);
  }
};

/* ---------- Contratos ---------- */
var ContractService = {
  listar: function () { return Store.all('contratos'); },
  buscar: function (id) { return Store.find('contratos', id); },
  porStatus: function (status) {
    if (!status || status === 'todos') return this.listar();
    return Store.where('contratos', function (c) { return c.status === status; });
  },
  // Gera o contrato a partir de um orçamento aprovado, usando o modelo do nicho
  gerarDoOrcamento: function (orcamentoId) {
    var orcamento = BudgetService.buscar(orcamentoId);
    if (!orcamento) return null;
    var existente = this.buscarPorOrcamento(orcamentoId);
    if (existente) return existente;
    var contrato = {
      id: Utils.uid('ctr'),
      numero: Utils.proximoNumero(Store.all('contratos'), 'numero'),
      orcamentoId: orcamento.id,
      clienteId: orcamento.clienteId,
      nicho: orcamento.nicho,
      titulo: orcamento.titulo,
      valor: orcamento.valor,
      status: 'rascunho',
      dataInicio: orcamento.dataPrevista,
      clausulas: Data.clausulasDoNicho(orcamento.nicho),
      aditivos: [],
      criadoEm: Utils.hojeISO()
    };
    var salvo = Store.insert('contratos', contrato);
    NotificationService.criar({
      tipo: 'info',
      titulo: 'Contrato gerado',
      texto: 'O contrato #' + salvo.numero + ' foi gerado a partir do orçamento #' + orcamento.numero + '.'
    });
    return salvo;
  },
  buscarPorOrcamento: function (orcamentoId) {
    return Store.where('contratos', function (c) { return c.orcamentoId === orcamentoId; })[0] || null;
  },
  enviarParaAceite: function (id) {
    var contrato = Store.update('contratos', id, { status: 'aguardando' });
    NotificationService.criar({
      tipo: 'warning',
      titulo: 'Contrato aguardando aceite',
      texto: 'O contrato #' + contrato.numero + ' foi enviado para ' + ClientService.nome(contrato.clienteId) + '.'
    });
    return contrato;
  },
  marcarAceito: function (id) {
    var contrato = Store.update('contratos', id, { status: 'ativo' });
    NotificationService.criar({
      tipo: 'success',
      titulo: 'Contrato aceito',
      texto: ClientService.nome(contrato.clienteId) + ' aceitou o contrato #' + contrato.numero + '.'
    });
    return contrato;
  },
  concluir: function (id) { return Store.update('contratos', id, { status: 'concluido' }); },
  cancelar: function (id) { return Store.update('contratos', id, { status: 'cancelado' }); },
  atualizarClausulas: function (id, clausulas) { return Store.update('contratos', id, { clausulas: clausulas }); },
  atualizar: function (id, mudancas) { return Store.update('contratos', id, mudancas); },
  excluir: function (id) { Store.remove('contratos', id); },
  valorTotal: function (contrato) {
    var aditivos = (contrato.aditivos || []).reduce(function (s, a) { return s + (Number(a.valor) || 0); }, 0);
    return (Number(contrato.valor) || 0) + aditivos;
  },
  adicionarAditivo: function (contratoId, aditivo) {
    var contrato = this.buscar(contratoId);
    if (!contrato) return null;
    var lista = contrato.aditivos || [];
    aditivo.id = Utils.uid('adt');
    aditivo.numero = String(lista.length + 1).padStart(2, '0');
    aditivo.data = aditivo.data || Utils.hojeISO();
    aditivo.tipo = aditivo.tipo || 'valor';
    lista.push(aditivo);
    var salvo = Store.update('contratos', contratoId, { aditivos: lista });
    NotificationService.criar({
      tipo: 'info',
      titulo: 'Aditivo criado',
      texto: 'Aditivo #' + aditivo.numero + ' adicionado ao contrato #' + contrato.numero + '.'
    });
    return salvo;
  },
  removerAditivo: function (contratoId, aditivoId) {
    var contrato = this.buscar(contratoId);
    if (!contrato) return null;
    var lista = (contrato.aditivos || []).filter(function (a) { return a.id !== aditivoId; });
    return Store.update('contratos', contratoId, { aditivos: lista });
  }
};

/* ---------- Serviços ---------- */
var ServiceService = {
  listar: function () { return Store.all('servicos'); },
  buscar: function (id) { return Store.find('servicos', id); },
  porCliente: function (clienteId) {
    return Store.where('servicos', function (s) { return s.clienteId === clienteId; });
  },
  porContrato: function (contratoId) {
    return Store.where('servicos', function (s) { return s.contratoId === contratoId; });
  },
  porOrcamento: function (orcamentoId) {
    return Store.where('servicos', function (s) { return s.orcamentoId === orcamentoId; });
  },
  porStatus: function (status) {
    if (!status || status === 'todos') return this.listar();
    return Store.where('servicos', function (s) { return s.status === status; });
  },
  criar: function (dados) {
    dados.id = Utils.uid('svc');
    dados.numero = Utils.proximoNumero(Store.all('servicos'), 'numero');
    dados.status = dados.status || 'agendado';
    dados.custoPrevisto = dados.custoPrevisto || 0;
    dados.custoReal = dados.custoReal || 0;
    dados.horasTrabalhadas = dados.horasTrabalhadas || 0;
    var servico = Store.insert('servicos', dados);

    // Todo serviço novo já nasce com um pagamento pendente vinculado
    if (!dados.semPagamentoAutomatico) {
      PaymentService.criar({
        servicoId: servico.id,
        clienteId: servico.clienteId,
        valorTotal: servico.valor,
        valorRecebido: 0,
        forma: dados.formaPagamento || 'A combinar',
        dataPrevista: servico.data,
        dataRecebida: null,
        status: 'pendente'
      });
    }
    return servico;
  },
  atualizar: function (id, mudancas) {
    var atualizado = Store.update('servicos', id, mudancas);
    // Se valor do serviço mudar, mantém o pagamento vinculado coerente
    if (atualizado && mudancas.valor !== undefined) {
      var pagamentos = PaymentService.porServico(id);
      if (pagamentos[0]) {
        Store.update('pagamentos', pagamentos[0].id, {
          valorTotal: mudancas.valor,
          status: pagamentos[0].valorRecebido >= mudancas.valor ? 'pago' :
            (pagamentos[0].valorRecebido > 0 ? 'parcial' : 'pendente')
        });
      }
    }
    return atualizado;
  },
  excluir: function (id) {
    ExpenseService.porServico(id).forEach(function (d) { Store.remove('despesas', d.id); });
    PaymentService.porServico(id).forEach(function (p) { Store.remove('pagamentos', p.id); });
    Store.remove('servicos', id);
  },
  alterarStatus: function (id, status) {
    var servico = Store.update('servicos', id, { status: status });
    if (status === 'concluido') {
      NotificationService.criar({
        tipo: 'success',
        titulo: 'Serviço concluído',
        texto: '#' + servico.numero + ' ' + servico.titulo + ' foi marcado como concluído.'
      });
    }
    return servico;
  },
  // Rentabilidade em tempo real de um serviço
  rentabilidade: function (servico) {
    var custoReal = ExpenseService.totalDoServico(servico.id) || servico.custoReal || 0;
    var lucroPrevisto = Calc.lucro(servico.valor, servico.custoPrevisto);
    var lucroAtual = Calc.lucro(servico.valor, custoReal);
    return {
      valor: servico.valor,
      custoPrevisto: servico.custoPrevisto,
      custoReal: custoReal,
      lucroPrevisto: lucroPrevisto,
      lucroAtual: lucroAtual,
      margem: Calc.margem(servico.valor, custoReal),
      diferencaCusto: Calc.diferenca(custoReal, servico.custoPrevisto),
      acimaDoPrevisto: custoReal > servico.custoPrevisto,
      lucroPorHora: Calc.lucroPorHora(lucroAtual, servico.horasTrabalhadas)
    };
  },
  recentes: function (quantidade) {
    return this.listar().slice().sort(function (a, b) {
      return a.data < b.data ? 1 : -1;
    }).slice(0, quantidade || 5);
  }
};

/* ---------- Despesas ---------- */
var ExpenseService = {
  listar: function () { return Store.all('despesas'); },
  porServico: function (servicoId) {
    return Store.where('despesas', function (d) { return d.servicoId === servicoId; });
  },
  totalDoServico: function (servicoId) {
    return this.porServico(servicoId).reduce(function (s, d) { return s + (Number(d.valor) || 0); }, 0);
  },
  criar: function (dados) {
    dados.id = Utils.uid('exp');
    dados.data = dados.data || Utils.hojeISO();
    var despesa = Store.insert('despesas', dados);
    // Recalcula o custo real do serviço relacionado
    if (dados.servicoId) {
      ServiceService.atualizar(dados.servicoId, {
        custoReal: ExpenseService.totalDoServico(dados.servicoId)
      });
    }
    return despesa;
  },
  excluir: function (id) {
    var despesa = Store.find('despesas', id);
    Store.remove('despesas', id);
    if (despesa && despesa.servicoId) {
      ServiceService.atualizar(despesa.servicoId, {
        custoReal: ExpenseService.totalDoServico(despesa.servicoId)
      });
    }
  }
};

/* ---------- Agenda ---------- */
var ScheduleService = {
  // Serviços de hoje em diante, ordenados por data e hora
  proximos: function (quantidade) {
    var hoje = Utils.hojeISO();
    return ServiceService.listar()
      .filter(function (s) { return s.data >= hoje && s.status !== 'cancelado' && s.status !== 'concluido'; })
      .sort(function (a, b) {
        if (a.data === b.data) return a.hora < b.hora ? -1 : 1;
        return a.data < b.data ? -1 : 1;
      })
      .slice(0, quantidade || 6);
  },
  porDia: function (iso) {
    return ServiceService.listar().filter(function (s) { return s.data === iso; })
      .sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
  },
  // Agrupa os próximos serviços por data (para a agenda financeira)
  agrupadosPorDia: function (quantidade) {
    var lista = this.proximos(quantidade || 8);
    var dias = [];
    lista.forEach(function (servico) {
      var dia = dias.filter(function (d) { return d.data === servico.data; })[0];
      if (!dia) {
        dia = { data: servico.data, servicos: [], valor: 0, lucro: 0 };
        dias.push(dia);
      }
      dia.servicos.push(servico);
      dia.valor += servico.valor;
      dia.lucro += Calc.lucro(servico.valor, servico.custoPrevisto);
    });
    return dias;
  },
  // Dois serviços no mesmo dia e horário = conflito
  conflitos: function () {
    var lista = ServiceService.listar().filter(function (s) {
      return s.status !== 'cancelado' && s.data >= Utils.hojeISO();
    });
    var conflitos = [];
    lista.forEach(function (a, i) {
      lista.slice(i + 1).forEach(function (b) {
        if (a.data === b.data && a.hora === b.hora) conflitos.push([a, b]);
      });
    });
    return conflitos;
  },
  temConflito: function (data, hora, ignorarId) {
    return ServiceService.listar().some(function (s) {
      return s.data === data && s.hora === hora && s.id !== ignorarId && s.status !== 'cancelado';
    });
  }
};

/* ---------- Pagamentos ---------- */
var PaymentService = {
  listar: function () { return Store.all('pagamentos'); },
  buscar: function (id) { return Store.find('pagamentos', id); },
  porServico: function (servicoId) {
    return Store.where('pagamentos', function (p) { return p.servicoId === servicoId; });
  },
  porCliente: function (clienteId) {
    return Store.where('pagamentos', function (p) { return p.clienteId === clienteId; });
  },
  pendentes: function () {
    return Store.where('pagamentos', function (p) { return p.status !== 'pago'; });
  },
  // Recalcula "atrasado" com base na data prevista, sem alterar quem já foi pago
  statusAtual: function (pagamento) {
    if (pagamento.status === 'pago') return 'pago';
    if (pagamento.dataPrevista < Utils.hojeISO()) return 'atrasado';
    return (Number(pagamento.valorRecebido) || 0) > 0 ? 'parcial' : 'pendente';
  },
  atualizarStatusVencidos: function () {
    var lista = this.listar().map(function (p) {
      var status = PaymentService.statusAtual(p);
      return status === p.status ? p : Object.assign({}, p, { status: status });
    });
    Store.saveAll('pagamentos', lista);
  },
  totalAReceber: function () {
    return this.listar().reduce(function (s, p) {
      return s + Math.max(0, (Number(p.valorTotal) || 0) - (Number(p.valorRecebido) || 0));
    }, 0);
  },
  criar: function (dados) {
    dados.id = Utils.uid('pag');
    dados.status = this.statusAtual(dados);
    return Store.insert('pagamentos', dados);
  },
  atualizar: function (id, mudancas) { return Store.update('pagamentos', id, mudancas); },
  excluir: function (id) { Store.remove('pagamentos', id); },
  registrarRecebimento: function (id, valor, forma, data) {
    var pagamento = Store.find('pagamentos', id);
    if (!pagamento) return null;
    var recebido = (Number(pagamento.valorRecebido) || 0) + (Number(valor) || 0);
    var status = recebido >= pagamento.valorTotal ? 'pago' : 'parcial';
    var atualizado = Store.update('pagamentos', id, {
      valorRecebido: Math.min(recebido, pagamento.valorTotal),
      forma: forma || pagamento.forma,
      status: status,
      dataRecebida: status === 'pago' ? (data || Utils.hojeISO()) : pagamento.dataRecebida
    });
    if (status === 'pago') {
      NotificationService.criar({
        tipo: 'success',
        titulo: 'Pagamento recebido',
        texto: Utils.formatBRL(atualizado.valorTotal) + ' de ' + ClientService.nome(atualizado.clienteId) + ' foi recebido.'
      });
    }
    return atualizado;
  }
};

/* ---------- Notificações ---------- */
var NotificationService = {
  listar: function () { return Store.all('notificacoes'); },
  naoLidas: function () {
    return Store.where('notificacoes', function (n) { return !n.lida; });
  },
  criar: function (dados) {
    dados.id = Utils.uid('not');
    dados.data = new Date().toISOString();
    dados.lida = false;
    return Store.insert('notificacoes', dados);
  },
  // Evita duplicar a mesma notificação a cada vez que a página recarrega
  criarSeNaoExiste: function (chave, dados) {
    var jaExiste = this.listar().some(function (n) { return n.chave === chave; });
    if (jaExiste) return null;
    dados.chave = chave;
    return this.criar(dados);
  },
  marcarComoLida: function (id) { return Store.update('notificacoes', id, { lida: true }); },
  marcarTodasComoLidas: function () {
    var lista = Store.all('notificacoes').map(function (n) {
      return Object.assign({}, n, { lida: true });
    });
    return Store.saveAll('notificacoes', lista);
  },
  // Roda a cada carregamento do painel: cria notificações reais para eventos
  // que ainda não foram avisados (usa "chave" para não duplicar).
  checarAutomaticas: function () {
    PaymentService.listar().forEach(function (p) {
      if (PaymentService.statusAtual(p) === 'atrasado') {
        NotificationService.criarSeNaoExiste('pagamento-atrasado-' + p.id, {
          tipo: 'danger',
          titulo: 'Pagamento atrasado',
          texto: Utils.formatBRL(p.valorTotal - p.valorRecebido) + ' de ' + ClientService.nome(p.clienteId) +
            ' venceu em ' + Utils.formatDate(p.dataPrevista) + '.'
        });
      }
    });

    ScheduleService.conflitos().forEach(function (par) {
      var chave = 'conflito-' + [par[0].id, par[1].id].sort().join('-');
      NotificationService.criarSeNaoExiste(chave, {
        tipo: 'danger',
        titulo: 'Conflito de agenda em ' + Utils.formatDate(par[0].data),
        texto: 'Às ' + par[0].hora + ': "' + par[0].titulo + '" e "' + par[1].titulo + '" ocupam o mesmo horário.'
      });
    });

    ScheduleService.proximos(20).forEach(function (s) {
      if (Utils.diffDias(s.data) === 1) {
        NotificationService.criarSeNaoExiste('servico-amanha-' + s.id, {
          tipo: 'info',
          titulo: 'Serviço amanhã às ' + s.hora,
          texto: s.titulo + ' — ' + ClientService.nome(s.clienteId) + '.'
        });
      }
    });
  }
};

/* ---------- Dashboard ---------- */
var DashboardService = {
  resumoMes: function () {
    var servicos = ServiceService.listar().filter(function (s) {
      return Utils.mesmoMes(s.data) && s.status !== 'cancelado';
    });
    var faturamento = servicos.reduce(function (s, sv) { return s + (Number(sv.valor) || 0); }, 0);
    var custos = servicos.reduce(function (s, sv) { return s + (Number(sv.custoReal) || 0); }, 0);
    var emAndamento = servicos.filter(function (s) {
      return s.status === 'agendado' || s.status === 'em_andamento';
    }).length;

    var historico = Store.all('historico');
    var mesAnterior = historico.length > 1 ? historico[historico.length - 2] : null;

    return {
      faturamento: faturamento,
      custos: custos,
      lucro: faturamento - custos,
      margem: Calc.margem(faturamento, custos),
      emAndamento: emAndamento,
      aReceber: PaymentService.totalAReceber(),
      variacaoFaturamento: mesAnterior ? ((faturamento - mesAnterior.faturamento) / mesAnterior.faturamento) * 100 : 0,
      variacaoLucro: mesAnterior ? (((faturamento - custos) - mesAnterior.lucro) / mesAnterior.lucro) * 100 : 0
    };
  },

  historico: function () { return Store.all('historico'); },

  // Alertas exibidos no dashboard
  alertas: function () {
    var alertas = [];

    BudgetService.porStatus('aguardando').forEach(function (o) {
      alertas.push({
        tipo: 'info',
        icone: '📑',
        titulo: 'Orçamento #' + o.numero + ' aguardando aprovação',
        texto: ClientService.nome(o.clienteId) + ' ainda não respondeu — ' + Utils.formatBRL(o.valor) + '.'
      });
    });

    ContractService.porStatus('aguardando').forEach(function (c) {
      alertas.push({
        tipo: 'info',
        icone: '📄',
        titulo: 'Contrato #' + c.numero + ' aguardando aceite',
        texto: 'Enviado para ' + ClientService.nome(c.clienteId) + '.'
      });
    });

    ServiceService.listar().forEach(function (s) {
      if ((Number(s.custoReal) || 0) > (Number(s.custoPrevisto) || 0) && s.status !== 'cancelado') {
        alertas.push({
          tipo: 'warning',
          icone: '⚠️',
          titulo: 'Serviço #' + s.numero + ' acima do custo previsto',
          texto: s.titulo + ' está ' + Utils.formatBRL(s.custoReal - s.custoPrevisto) + ' acima do previsto.'
        });
      }
    });

    ScheduleService.conflitos().forEach(function (par) {
      alertas.push({
        tipo: 'danger',
        icone: '⚠️',
        titulo: 'Conflito de agenda em ' + Utils.formatDate(par[0].data),
        texto: 'Às ' + par[0].hora + ': "' + par[0].titulo + '" e "' + par[1].titulo + '" ocupam o mesmo horário.'
      });
    });

    PaymentService.listar().forEach(function (p) {
      if (p.status === 'atrasado') {
        alertas.push({
          tipo: 'danger',
          icone: '💰',
          titulo: 'Pagamento atrasado',
          texto: Utils.formatBRL(p.valorTotal - p.valorRecebido) + ' de ' + ClientService.nome(p.clienteId) +
            ' venceu em ' + Utils.formatDate(p.dataPrevista) + '.'
        });
      }
    });

    var proximo = ScheduleService.proximos(1)[0];
    if (proximo && Utils.diffDias(proximo.data) <= 1) {
      alertas.push({
        tipo: 'success',
        icone: '📅',
        titulo: Utils.diffDias(proximo.data) === 0 ? 'Serviço hoje às ' + proximo.hora : 'Serviço amanhã às ' + proximo.hora,
        texto: proximo.titulo + ' — ' + ClientService.nome(proximo.clienteId) + '.'
      });
    }

    return alertas;
  }
};

/* ---------- Financeiro ---------- */
var FinanceService = {
  // Filtra serviços/despesas/pagamentos por período: 'dia' | 'semana' | 'mes' | 'ano' | 'todos'
  intervaloPeriodo: function (periodo) {
    var hoje = Utils.hojeISO();
    if (periodo === 'dia') return { inicio: hoje, fim: hoje };
    if (periodo === 'semana') return { inicio: Utils.addDias(hoje, -7), fim: hoje };
    if (periodo === 'ano') return { inicio: Utils.addDias(hoje, -365), fim: Utils.addDias(hoje, 365) };
    if (periodo === 'mes') {
      var d = Utils.toDate(hoje);
      var inicioMes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
      return { inicio: inicioMes, fim: Utils.addDias(hoje, 60) };
    }
    return { inicio: '2000-01-01', fim: '2100-01-01' };
  },

  resumo: function (periodo) {
    var intervalo = this.intervaloPeriodo(periodo || 'mes');
    var servicos = ServiceService.listar().filter(function (s) {
      return s.data >= intervalo.inicio && s.data <= intervalo.fim && s.status !== 'cancelado';
    });
    var receitas = servicos.reduce(function (s, sv) { return s + (Number(sv.valor) || 0); }, 0);
    var despesas = ExpenseService.listar().filter(function (d) {
      return d.data >= intervalo.inicio && d.data <= intervalo.fim;
    }).reduce(function (s, d) { return s + (Number(d.valor) || 0); }, 0);
    var pagamentos = PaymentService.listar();
    var aReceber = PaymentService.totalAReceber();
    var recebidoNoPeriodo = pagamentos.filter(function (p) {
      return p.dataRecebida && p.dataRecebida >= intervalo.inicio && p.dataRecebida <= intervalo.fim;
    }).reduce(function (s, p) { return s + (Number(p.valorRecebido) || 0); }, 0);

    return {
      receitas: receitas,
      despesas: despesas,
      lucro: receitas - despesas,
      aReceber: aReceber,
      recebidoNoPeriodo: recebidoNoPeriodo,
      saldo: recebidoNoPeriodo - despesas
    };
  },

  // Total de despesas por categoria (para gráfico/relatório)
  despesasPorCategoria: function (periodo) {
    var intervalo = this.intervaloPeriodo(periodo || 'todos');
    var totais = {};
    Data.CATEGORIAS_DESPESA.forEach(function (c) { totais[c.id] = 0; });
    ExpenseService.listar().forEach(function (d) {
      if (d.data >= intervalo.inicio && d.data <= intervalo.fim) {
        totais[d.categoria] = (totais[d.categoria] || 0) + (Number(d.valor) || 0);
      }
    });
    return Data.CATEGORIAS_DESPESA.map(function (c) {
      return { id: c.id, nome: c.nome, emoji: c.emoji, valor: totais[c.id] || 0 };
    }).sort(function (a, b) { return b.valor - a.valor; });
  },

  fluxoCaixa: function (dias) {
    var pontos = [];
    for (var i = (dias || 14) - 1; i >= 0; i--) {
      var data = Utils.addDias(Utils.hojeISO(), -i);
      var entradas = PaymentService.listar().filter(function (p) { return p.dataRecebida === data; })
        .reduce(function (s, p) { return s + (Number(p.valorRecebido) || 0); }, 0);
      var saidas = ExpenseService.listar().filter(function (d) { return d.data === data; })
        .reduce(function (s, d) { return s + (Number(d.valor) || 0); }, 0);
      pontos.push({ data: data, entradas: entradas, saidas: saidas, saldo: entradas - saidas });
    }
    return pontos;
  }
};

/* ---------- Relatórios ---------- */
var ReportService = {
  servicosMaisRentaveis: function (quantidade) {
    return ServiceService.listar()
      .map(function (s) { return Object.assign({ servico: s }, ServiceService.rentabilidade(s)); })
      .sort(function (a, b) { return b.lucroAtual - a.lucroAtual; })
      .slice(0, quantidade || 5);
  },

  clientesPorMovimentacao: function (quantidade) {
    return ClientService.listar()
      .map(function (c) { return Object.assign({ cliente: c }, ClientService.resumo(c.id)); })
      .filter(function (r) { return r.quantidade > 0; })
      .sort(function (a, b) { return b.total - a.total; })
      .slice(0, quantidade || 10);
  },

  orcamentosPorStatus: function () {
    var todos = BudgetService.listar();
    var mapa = {};
    Object.keys(Data.STATUS_ORCAMENTO).forEach(function (s) { mapa[s] = { quantidade: 0, valor: 0 }; });
    todos.forEach(function (o) {
      if (!mapa[o.status]) mapa[o.status] = { quantidade: 0, valor: 0 };
      mapa[o.status].quantidade++;
      mapa[o.status].valor += Number(o.valor) || 0;
    });
    return mapa;
  },

  previstoXRealizado: function () {
    var servicos = ServiceService.listar();
    var previstoTotal = 0, realTotal = 0;
    servicos.forEach(function (s) {
      previstoTotal += Number(s.custoPrevisto) || 0;
      realTotal += ExpenseService.totalDoServico(s.id) || Number(s.custoReal) || 0;
    });
    return {
      previsto: previstoTotal,
      real: realTotal,
      diferenca: realTotal - previstoTotal,
      servicos: servicos.map(function (s) {
        var real = ExpenseService.totalDoServico(s.id) || Number(s.custoReal) || 0;
        return {
          numero: s.numero, titulo: s.titulo, previsto: s.custoPrevisto, real: real,
          diferenca: real - s.custoPrevisto
        };
      })
    };
  },

  lucroPorHora: function () {
    return ServiceService.listar()
      .filter(function (s) { return (Number(s.horasTrabalhadas) || 0) > 0; })
      .map(function (s) {
        var rent = ServiceService.rentabilidade(s);
        return { numero: s.numero, titulo: s.titulo, horas: s.horasTrabalhadas, lucroPorHora: rent.lucroPorHora };
      })
      .sort(function (a, b) { return b.lucroPorHora - a.lucroPorHora; });
  },

  // Gera e baixa um CSV simples a partir de linhas [ {coluna: valor} ]
  exportarCSV: function (nomeArquivo, linhas) {
    if (!linhas || !linhas.length) return false;
    var colunas = Object.keys(linhas[0]);
    var csv = colunas.join(';') + '\n' + linhas.map(function (linha) {
      return colunas.map(function (c) {
        var valor = linha[c] === undefined || linha[c] === null ? '' : String(linha[c]);
        return '"' + valor.replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\n');

    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo.replace(/\.csv$/, '') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
};
