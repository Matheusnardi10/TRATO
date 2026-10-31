/* ============================================================
   TRATO — data.js
   Todos os dados fictícios (mock) do sistema ficam aqui.
   Quando existir uma API, este arquivo continua servindo como
   fallback/documentação das estruturas de dados.

   ESTRUTURAS
   ----------
   User        { id, nome, nomeProfissional, email, telefone, senha, nicho, criadoEm }
   Business    { nomeProfissional, cidade, logo, telefone, email, pix,
                 formaPagamentoPadrao, prazoPadrao }
   Niche       { id, nome, emoji, descricao, camposOrcamento[], contrato{} }
   Client      { id, nome, telefone, email, documento, endereco, observacoes,
                 status, criadoEm }
   Budget      { id, numero, clienteId, titulo, descricao, nicho, dataPrevista,
                 prazoEstimado, formaPagamento, validade, itens[], custos{},
                 margem, valor, status, camposNicho{}, criadoEm }
   BudgetItem  { descricao, quantidade, valorUnitario }
   Contract    { id, numero, orcamentoId, clienteId, nicho, titulo, valor,
                 status, dataInicio, clausulas[], aditivos[], criadoEm }
   Addendum    { id, numero, descricao, valor, data, condicoes }
   Service     { id, numero, contratoId, orcamentoId, clienteId, titulo, nicho,
                 data, hora, duracaoHoras, valor, custoPrevisto, custoReal,
                 horasTrabalhadas, status }
   Expense     { id, servicoId, categoria, descricao, valor, data }
   Payment     { id, servicoId, clienteId, valorTotal, valorRecebido, forma,
                 dataPrevista, dataRecebida, status }
   Notification{ id, tipo, titulo, texto, data, lida, link }
   ============================================================ */

var Data = (function () {

  /* ---------- Identidade da marca (troque aqui para renomear) ---------- */
  var BRAND = {
    nome: 'Trato',
    slogan: 'Do orçamento ao lucro, tudo em um só lugar.',
    descricao: 'Gestão completa para quem trabalha por conta própria.',
    versaoDados: 'trato.v1'
  };

  /* ---------- Nichos, campos dinâmicos e modelos de contrato ---------- */

  var CLAUSULAS_BASE = [
    { titulo: 'Identificação das partes', texto: 'São partes deste instrumento o CONTRATADO {{profissional}} e o CONTRATANTE {{cliente}}, qualificados nos dados acima.' },
    { titulo: 'Objeto', texto: 'O presente contrato tem como objeto a prestação do serviço de {{servico}}, conforme descrito no orçamento nº {{orcamento}}.' },
    { titulo: 'Valor e forma de pagamento', texto: 'O valor total dos serviços é de {{valor}}, a ser pago da seguinte forma: {{formaPagamento}}.' },
    { titulo: 'Prazo de execução', texto: 'O serviço será executado a partir de {{dataInicio}}, no prazo estimado de {{prazo}}.' },
    { titulo: 'Cancelamento e remarcação', texto: 'O cancelamento com menos de 48 horas de antecedência poderá acarretar a retenção do valor de entrada. A remarcação depende da disponibilidade de agenda do CONTRATADO.' },
    { titulo: 'Responsabilidades', texto: 'O CONTRATADO se responsabiliza pela execução técnica do serviço. O CONTRATANTE se responsabiliza por garantir o acesso ao local e as condições necessárias para a execução.' },
    { titulo: 'Aceite', texto: 'As partes declaram estar de acordo com todas as condições descritas neste documento.' }
  ];

  var NICHOS = [
    {
      id: 'fotografo',
      nome: 'Fotógrafo',
      emoji: '📸',
      descricao: 'Ensaios, eventos e coberturas',
      camposOrcamento: [
        { id: 'tipoEnsaio', label: 'Tipo de ensaio ou evento', tipo: 'select', opcoes: ['Ensaio individual', 'Ensaio de casal', 'Gestante', 'Aniversário', 'Casamento', 'Corporativo', 'Produto'], obrigatorio: true },
        { id: 'local', label: 'Local', tipo: 'text', obrigatorio: true },
        { id: 'horario', label: 'Horário', tipo: 'time' },
        { id: 'duracao', label: 'Duração (horas)', tipo: 'number' },
        { id: 'qtdFotos', label: 'Quantidade de fotografias entregues', tipo: 'number' },
        { id: 'prazoEntrega', label: 'Prazo de entrega', tipo: 'text' },
        { id: 'formaEntrega', label: 'Forma de entrega', tipo: 'select', opcoes: ['Galeria online', 'Pen drive', 'Álbum impresso', 'Link para download'] },
        { id: 'edicao', label: 'Tipo de edição', tipo: 'select', opcoes: ['Básica', 'Completa', 'Artística'] },
        { id: 'direitosImagem', label: 'Uso das imagens pelo profissional', tipo: 'select', opcoes: ['Autorizado', 'Autorizado apenas para portfólio', 'Não autorizado'] },
        { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
      ],
      contrato: {
        titulo: 'Contrato de prestação de serviços fotográficos',
        clausulasExtras: [
          { titulo: 'Descrição do ensaio', texto: 'O serviço compreende {{tipoEnsaio}}, realizado em {{local}}, com duração aproximada de {{duracao}} hora(s).' },
          { titulo: 'Entrega das fotografias', texto: 'Serão entregues {{qtdFotos}} fotografias tratadas, no prazo de {{prazoEntrega}}, através de {{formaEntrega}}. A edição contratada é do tipo {{edicao}}.' },
          { titulo: 'Direitos de imagem e divulgação', texto: 'O uso das imagens pelo CONTRATADO para portfólio e divulgação está: {{direitosImagem}}. Os arquivos brutos (não editados) não fazem parte da entrega.' }
        ]
      }
    },
    {
      id: 'eletricista',
      nome: 'Eletricista',
      emoji: '🔌',
      descricao: 'Instalações, reparos e manutenção',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de serviço', tipo: 'select', opcoes: ['Instalação', 'Reparo', 'Troca de quadro', 'Manutenção preventiva', 'Emergência'], obrigatorio: true },
        { id: 'local', label: 'Local do serviço', tipo: 'text', obrigatorio: true },
        { id: 'materiais', label: 'Materiais necessários', tipo: 'textarea' },
        { id: 'materiaisPor', label: 'Materiais fornecidos por', tipo: 'select', opcoes: ['Profissional', 'Cliente', 'Ambos'] },
        { id: 'prazo', label: 'Prazo de execução', tipo: 'text' },
        { id: 'garantia', label: 'Garantia do serviço', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses', '1 ano'] },
        { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
      ],
      contrato: {
        titulo: 'Contrato de prestação de serviços elétricos',
        clausulasExtras: [
          { titulo: 'Descrição do serviço', texto: 'O serviço contratado é {{tipoServico}}, a ser executado em {{local}}.' },
          { titulo: 'Materiais', texto: 'Os materiais serão fornecidos por: {{materiaisPor}}. Relação prevista: {{materiais}}.' },
          { titulo: 'Garantia', texto: 'O serviço executado possui garantia de {{garantia}}, contada a partir da conclusão, exceto em casos de mau uso, alteração por terceiros ou falha da rede elétrica do imóvel.' }
        ]
      }
    },
    {
      id: 'ar-condicionado',
      nome: 'Técnico de ar-condicionado',
      emoji: '❄️',
      descricao: 'Instalação, limpeza e manutenção',
      camposOrcamento: [
        { id: 'equipamento', label: 'Tipo de equipamento', tipo: 'select', opcoes: ['Split', 'Janela', 'Multi split', 'Cassete', 'Portátil'], obrigatorio: true },
        { id: 'marca', label: 'Marca', tipo: 'text' },
        { id: 'modelo', label: 'Modelo', tipo: 'text' },
        { id: 'tipoManutencao', label: 'Tipo de manutenção', tipo: 'select', opcoes: ['Instalação', 'Limpeza', 'Preventiva', 'Corretiva', 'Recarga de gás'], obrigatorio: true },
        { id: 'local', label: 'Local do serviço', tipo: 'text' },
        { id: 'pecas', label: 'Peças previstas', tipo: 'textarea' },
        { id: 'garantia', label: 'Garantia', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses', '1 ano'] },
        { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
      ],
      contrato: {
        titulo: 'Contrato de manutenção de ar-condicionado',
        clausulasExtras: [
          { titulo: 'Equipamento', texto: 'Equipamento: {{equipamento}}, marca {{marca}}, modelo {{modelo}}, instalado em {{local}}.' },
          { titulo: 'Serviço executado', texto: 'Será realizada {{tipoManutencao}}, incluindo as peças previstas: {{pecas}}.' },
          { titulo: 'Garantia', texto: 'A garantia do serviço é de {{garantia}}. Peças substituídas seguem a garantia do fabricante.' }
        ]
      }
    },
    {
      id: 'pintor', nome: 'Pintor', emoji: '🎨', descricao: 'Pintura residencial e comercial',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de pintura', tipo: 'select', opcoes: ['Interna', 'Externa', 'Textura', 'Grafiato', 'Repintura'], obrigatorio: true },
        { id: 'local', label: 'Local', tipo: 'text', obrigatorio: true },
        { id: 'area', label: 'Área aproximada (m²)', tipo: 'number' },
        { id: 'materiais', label: 'Materiais', tipo: 'textarea' },
        { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
      ],
      contrato: { titulo: 'Contrato de prestação de serviços de pintura', clausulasExtras: [] }
    },
    {
      id: 'pedreiro', nome: 'Pedreiro', emoji: '🧱', descricao: 'Obras, reformas e acabamentos',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de obra', tipo: 'text', obrigatorio: true },
        { id: 'local', label: 'Local', tipo: 'text', obrigatorio: true },
        { id: 'materiais', label: 'Materiais', tipo: 'textarea' },
        { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
      ],
      contrato: { titulo: 'Contrato de prestação de serviços de construção', clausulasExtras: [] }
    },
    {
      id: 'marceneiro', nome: 'Marceneiro', emoji: '🪚', descricao: 'Móveis sob medida e reparos',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de móvel', tipo: 'text', obrigatorio: true },
        { id: 'medidas', label: 'Medidas', tipo: 'text' },
        { id: 'material', label: 'Material', tipo: 'text' },
        { id: 'prazo', label: 'Prazo de entrega', tipo: 'text' }
      ],
      contrato: { titulo: 'Contrato de fabricação de móveis sob medida', clausulasExtras: [] }
    },
    {
      id: 'tecnico', nome: 'Técnico / Manutenção', emoji: '🔧', descricao: 'Assistência e manutenção geral',
      camposOrcamento: [
        { id: 'equipamento', label: 'Equipamento', tipo: 'text', obrigatorio: true },
        { id: 'tipoServico', label: 'Tipo de atendimento', tipo: 'select', opcoes: ['Diagnóstico', 'Reparo', 'Instalação', 'Manutenção preventiva'] },
        { id: 'pecas', label: 'Peças previstas', tipo: 'textarea' },
        { id: 'garantia', label: 'Garantia', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses'] }
      ],
      contrato: { titulo: 'Contrato de prestação de serviços técnicos', clausulasExtras: [] }
    },
    {
      id: 'freelancer', nome: 'Freelancer', emoji: '💻', descricao: 'Projetos digitais e criativos',
      camposOrcamento: [
        { id: 'tipoProjeto', label: 'Tipo de projeto', tipo: 'text', obrigatorio: true },
        { id: 'entregaveis', label: 'Entregáveis', tipo: 'textarea' },
        { id: 'revisoes', label: 'Rodadas de revisão incluídas', tipo: 'number' },
        { id: 'prazo', label: 'Prazo de entrega', tipo: 'text' }
      ],
      contrato: { titulo: 'Contrato de prestação de serviços', clausulasExtras: [] }
    },
    {
      id: 'designer', nome: 'Designer', emoji: '🖌️', descricao: 'Identidade visual e materiais gráficos',
      camposOrcamento: [
        { id: 'tipoProjeto', label: 'Tipo de projeto', tipo: 'select', opcoes: ['Identidade visual', 'Logotipo', 'Material impresso', 'Social media (peças)', 'Embalagem', 'Apresentação'], obrigatorio: true },
        { id: 'entregaveis', label: 'Entregáveis', tipo: 'textarea', obrigatorio: true },
        { id: 'formatosEntrega', label: 'Formatos de entrega', tipo: 'text' },
        { id: 'revisoes', label: 'Rodadas de revisão incluídas', tipo: 'number' },
        { id: 'usoComercial', label: 'Uso das artes', tipo: 'select', opcoes: ['Uso comercial ilimitado', 'Uso comercial limitado', 'Uso pessoal'] },
        { id: 'prazoEntrega', label: 'Prazo de entrega', tipo: 'text' },
        { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
      ],
      contrato: {
        titulo: 'Contrato de prestação de serviços de design',
        clausulasExtras: [
          { titulo: 'Escopo do projeto', texto: 'O serviço compreende {{tipoProjeto}}, com os seguintes entregáveis: {{entregaveis}}.' },
          { titulo: 'Revisões e entrega', texto: 'Estão incluídas {{revisoes}} rodada(s) de revisão. Os arquivos finais serão entregues nos formatos {{formatosEntrega}}, no prazo de {{prazoEntrega}}.' },
          { titulo: 'Uso das artes', texto: 'O uso das artes produzidas está definido como: {{usoComercial}}. Revisões adicionais às previstas poderão gerar custo extra, mediante aditivo.' }
        ]
      }
    },
    {
      id: 'social-media', nome: 'Social Media', emoji: '📱', descricao: 'Gestão e criação de conteúdo',
      camposOrcamento: [
        { id: 'redes', label: 'Redes atendidas', tipo: 'text', obrigatorio: true },
        { id: 'servicoContratado', label: 'Serviço contratado', tipo: 'select', opcoes: ['Gestão mensal', 'Criação de conteúdo', 'Gestão de tráfego', 'Cobertura de evento', 'Consultoria pontual'] },
        { id: 'qtdPostagens', label: 'Quantidade de postagens por mês', tipo: 'number' },
        { id: 'periodicidade', label: 'Periodicidade', tipo: 'select', opcoes: ['Mensal', 'Quinzenal', 'Por pacote de posts', 'Pontual'] },
        { id: 'entregaveis', label: 'Entregáveis inclusos', tipo: 'textarea' },
        { id: 'renovacaoAutomatica', label: 'Renovação', tipo: 'select', opcoes: ['Automática mensal', 'Sem renovação automática'] },
        { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
      ],
      contrato: {
        titulo: 'Contrato de prestação de serviços de social media',
        clausulasExtras: [
          { titulo: 'Escopo do serviço', texto: 'O serviço contratado é {{servicoContratado}}, para as redes {{redes}}, com periodicidade {{periodicidade}}.' },
          { titulo: 'Entregáveis', texto: 'Estão previstas {{qtdPostagens}} postagens por mês, incluindo: {{entregaveis}}.' },
          { titulo: 'Renovação', texto: 'Este contrato segue o regime de renovação: {{renovacaoAutomatica}}. O cancelamento deve ser solicitado com antecedência mínima de 15 dias.' }
        ]
      }
    },
    {
      id: 'geral', nome: 'Prestador de serviços gerais', emoji: '🧰', descricao: 'Serviços diversos sob demanda',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de serviço', tipo: 'text', obrigatorio: true },
        { id: 'local', label: 'Local do serviço', tipo: 'text' },
        { id: 'materiais', label: 'Materiais previstos', tipo: 'textarea' },
        { id: 'materiaisPor', label: 'Materiais fornecidos por', tipo: 'select', opcoes: ['Profissional', 'Cliente', 'Ambos'] },
        { id: 'prazo', label: 'Prazo de execução', tipo: 'text' },
        { id: 'garantia', label: 'Garantia do serviço', tipo: 'select', opcoes: ['Sem garantia', '30 dias', '90 dias'] },
        { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
      ],
      contrato: {
        titulo: 'Contrato de prestação de serviços gerais',
        clausulasExtras: [
          { titulo: 'Descrição do serviço', texto: 'O serviço contratado é {{tipoServico}}, a ser executado em {{local}}.' },
          { titulo: 'Materiais', texto: 'Os materiais previstos são: {{materiais}}, fornecidos por: {{materiaisPor}}.' },
          { titulo: 'Garantia', texto: 'O serviço possui garantia de: {{garantia}}, contada a partir da conclusão.' }
        ]
      }
    },
    {
      id: 'outro', nome: 'Outro', emoji: '➕', descricao: 'Personalize depois nas configurações',
      camposOrcamento: [
        { id: 'tipoServico', label: 'Tipo de serviço', tipo: 'text', obrigatorio: true },
        { id: 'local', label: 'Local', tipo: 'text' },
        { id: 'prazo', label: 'Prazo', tipo: 'text' }
      ],
      contrato: { titulo: 'Contrato de prestação de serviços', clausulasExtras: [] }
    }
  ];

  function getNicho(id) {
    return NICHOS.filter(function (n) { return n.id === id; })[0] || NICHOS[NICHOS.length - 1];
  }

  // Monta a lista completa de cláusulas de um nicho (base + específicas)
  function clausulasDoNicho(nichoId) {
    var nicho = getNicho(nichoId);
    var extras = (nicho.contrato && nicho.contrato.clausulasExtras) || [];
    var lista = CLAUSULAS_BASE.slice(0, 4)
      .concat(extras)
      .concat(CLAUSULAS_BASE.slice(4));
    return lista.map(function (c, i) {
      return { numero: i + 1, titulo: c.titulo, texto: c.texto };
    });
  }

  /* ---------- Categorias de despesa ---------- */
  var CATEGORIAS_DESPESA = [
    { id: 'material', nome: 'Material', emoji: '📦' },
    { id: 'combustivel', nome: 'Combustível', emoji: '⛽' },
    { id: 'alimentacao', nome: 'Alimentação', emoji: '🍽️' },
    { id: 'maoDeObra', nome: 'Mão de obra', emoji: '👷' },
    { id: 'pedagio', nome: 'Pedágio', emoji: '🛣️' },
    { id: 'estacionamento', nome: 'Estacionamento', emoji: '🅿️' },
    { id: 'ferramentas', nome: 'Ferramentas', emoji: '🧰' },
    { id: 'outros', nome: 'Outros', emoji: '•' }
  ];

  var STATUS_SERVICO = {
    orcamento:   { label: 'Orçamento',    classe: 'badge-neutral' },
    aprovado:    { label: 'Aprovado',     classe: 'badge-info' },
    agendado:    { label: 'Agendado',     classe: 'badge-info' },
    em_andamento:{ label: 'Em andamento', classe: 'badge-warning' },
    pausado:     { label: 'Pausado',      classe: 'badge-neutral' },
    concluido:   { label: 'Concluído',    classe: 'badge-success' },
    cancelado:   { label: 'Cancelado',    classe: 'badge-danger' }
  };

  var STATUS_ORCAMENTO = {
    rascunho:   { label: 'Rascunho',   classe: 'badge-neutral' },
    enviado:    { label: 'Enviado',    classe: 'badge-info' },
    aguardando: { label: 'Aguardando aprovação', classe: 'badge-warning' },
    aprovado:   { label: 'Aprovado',   classe: 'badge-success' },
    recusado:   { label: 'Recusado',   classe: 'badge-danger' },
    expirado:   { label: 'Expirado',   classe: 'badge-neutral' }
  };

  var STATUS_CONTRATO = {
    rascunho:   { label: 'Rascunho',          classe: 'badge-neutral' },
    aguardando: { label: 'Aguardando aceite', classe: 'badge-warning' },
    ativo:      { label: 'Ativo',             classe: 'badge-success' },
    concluido:  { label: 'Concluído',         classe: 'badge-info' },
    cancelado:  { label: 'Cancelado',         classe: 'badge-danger' }
  };

  var STATUS_PAGAMENTO = {
    pendente:   { label: 'Pendente',            classe: 'badge-warning' },
    parcial:    { label: 'Parcialmente pago',   classe: 'badge-info' },
    pago:       { label: 'Pago',                classe: 'badge-success' },
    atrasado:   { label: 'Atrasado',            classe: 'badge-danger' }
  };

  /* ---------- Datas do mock, sempre no mês atual ---------- */
  function diaDoMes(offset) {
    var hoje = new Date();
    var ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    var dia = Math.min(Math.max(hoje.getDate() + offset, 1), ultimoDia);
    var mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return hoje.getFullYear() + '-' + mes + '-' + String(dia).padStart(2, '0');
  }

  /* ---------- Usuário demonstração ---------- */
  var USUARIO_DEMO = {
    id: 'user-demo',
    nome: 'Caique Ribeiro',
    nomeProfissional: 'Caique Ribeiro Fotografia',
    email: 'demo@trato.app',
    telefone: '(11) 98888-1234',
    senha: '123456',
    nicho: 'fotografo',
    criadoEm: '2026-02-10',
    negocio: {
      cidade: 'São Paulo, SP',
      logo: '',
      telefoneProfissional: '(11) 98888-1234',
      emailProfissional: 'contato@caiquefotografia.com.br',
      pix: 'contato@caiquefotografia.com.br',
      formaPagamentoPadrao: '50% de entrada e 50% na entrega',
      prazoPadrao: '7 dias'
    }
  };

  /* ---------- Seed (dados iniciais) ---------- */
  function seed() {
    var clientes = [
      { id: 'cli-001', nome: 'João Silva', telefone: '(11) 99120-4477', email: 'joao.silva@email.com', documento: '123.456.789-00', endereco: 'Rua das Acácias, 210 — Santana, São Paulo', observacoes: 'Prefere atendimento no fim da tarde.', status: 'ativo', criadoEm: '2026-03-04' },
      { id: 'cli-002', nome: 'Mariana Oliveira', telefone: '(11) 98431-2210', email: 'mariana.oliveira@email.com', documento: '987.654.321-00', endereco: 'Av. Paulista, 1400 — Bela Vista, São Paulo', observacoes: '', status: 'ativo', criadoEm: '2026-04-12' },
      { id: 'cli-003', nome: 'Carlos Santos', telefone: '(11) 97755-8090', email: 'carlos.santos@email.com', documento: '456.123.789-11', endereco: 'Rua Ipê Amarelo, 88 — Osasco', observacoes: 'Indicação da Mariana.', status: 'ativo', criadoEm: '2026-05-20' },
      { id: 'cli-004', nome: 'Fernanda Almeida', telefone: '(11) 96622-1188', email: 'fernanda.almeida@email.com', documento: '321.654.987-22', endereco: 'Rua Turquesa, 45 — Guarulhos', observacoes: '', status: 'ativo', criadoEm: '2026-06-02' },
      { id: 'cli-005', nome: 'Ricardo Lima', telefone: '(11) 95533-7744', email: 'ricardo.lima@email.com', documento: '741.852.963-33', endereco: 'Rua do Comércio, 300 — Barueri', observacoes: 'Empresa: RL Eventos.', status: 'ativo', criadoEm: '2026-06-28' },
      { id: 'cli-006', nome: 'Beatriz Souza', telefone: '(11) 94411-6633', email: 'beatriz.souza@email.com', documento: '852.963.741-44', endereco: 'Rua Aurora, 12 — Campinas', observacoes: '', status: 'inativo', criadoEm: '2026-07-15' },
      { id: 'cli-007', nome: 'Studio Nova Marcas', telefone: '(11) 93300-5521', email: 'contato@novamarcas.com', documento: '12.345.678/0001-90', endereco: 'Rua dos Pinheiros, 500 — São Paulo', observacoes: 'Cliente recorrente de design.', status: 'ativo', criadoEm: '2026-07-02' },
      { id: 'cli-008', nome: 'Loja Verde Vida', telefone: '(11) 92211-4400', email: 'contato@verdevida.com', documento: '23.456.789/0001-11', endereco: 'Av. Rebouças, 900 — São Paulo', observacoes: 'Gestão de redes sociais mensal.', status: 'ativo', criadoEm: '2026-07-20' }
    ];

    var orcamentos = [
      {
        id: 'orc-001', numero: '001', clienteId: 'cli-001', titulo: 'Ensaio de casamento',
        descricao: 'Cobertura fotográfica da cerimônia e da festa, com 2 fotógrafos.',
        nicho: 'fotografo', dataPrevista: diaDoMes(-12), prazoEstimado: '20 dias',
        formaPagamento: '50% de entrada e 50% na entrega', validade: diaDoMes(-20),
        itens: [{ descricao: 'Cobertura de 8 horas', quantidade: 1, valorUnitario: 1600 }, { descricao: 'Segundo fotógrafo', quantidade: 1, valorUnitario: 200 }],
        custos: { material: 120, combustivel: 80, alimentacao: 60, maoDeObra: 300, pedagio: 20, estacionamento: 20, outros: 0 },
        margem: 40, valor: 1800, status: 'aprovado',
        camposNicho: { tipoEnsaio: 'Casamento', local: 'Espaço Villa Verde, São Paulo', horario: '16:00', duracao: 8, qtdFotos: 400, prazoEntrega: '20 dias', formaEntrega: 'Galeria online', edicao: 'Completa', direitosImagem: 'Autorizado apenas para portfólio' },
        criadoEm: diaDoMes(-20)
      },
      {
        id: 'orc-002', numero: '002', clienteId: 'cli-002', titulo: 'Ensaio gestante',
        descricao: 'Ensaio externo no parque, com 2 trocas de roupa.',
        nicho: 'fotografo', dataPrevista: diaDoMes(4), prazoEstimado: '10 dias',
        formaPagamento: 'Pix à vista', validade: diaDoMes(10),
        itens: [{ descricao: 'Ensaio 2 horas', quantidade: 1, valorUnitario: 950 }],
        custos: { material: 0, combustivel: 60, alimentacao: 40, maoDeObra: 150, pedagio: 0, estacionamento: 30, outros: 0 },
        margem: 45, valor: 950, status: 'aguardando',
        camposNicho: { tipoEnsaio: 'Gestante', local: 'Parque Ibirapuera', horario: '08:00', duracao: 2, qtdFotos: 60, prazoEntrega: '10 dias', formaEntrega: 'Galeria online', edicao: 'Básica', direitosImagem: 'Autorizado' },
        criadoEm: diaDoMes(-4)
      },
      {
        id: 'orc-003', numero: '003', clienteId: 'cli-003', titulo: 'Ensaio corporativo',
        descricao: 'Fotos de equipe e ambiente para site institucional.',
        nicho: 'fotografo', dataPrevista: diaDoMes(8), prazoEstimado: '7 dias',
        formaPagamento: '30% de entrada e 70% na entrega', validade: diaDoMes(12),
        itens: [{ descricao: 'Sessão corporativa 4h', quantidade: 1, valorUnitario: 1400 }],
        custos: { material: 0, combustivel: 90, alimentacao: 50, maoDeObra: 200, pedagio: 30, estacionamento: 25, outros: 0 },
        margem: 38, valor: 1400, status: 'enviado',
        camposNicho: { tipoEnsaio: 'Corporativo', local: 'Escritório do cliente — Osasco', horario: '10:00', duracao: 4, qtdFotos: 80, prazoEntrega: '7 dias', formaEntrega: 'Link para download', edicao: 'Completa', direitosImagem: 'Não autorizado' },
        criadoEm: diaDoMes(-2)
      },
      {
        id: 'orc-004', numero: '004', clienteId: 'cli-004', titulo: 'Aniversário infantil',
        descricao: 'Cobertura de festa de 4 horas.',
        nicho: 'fotografo', dataPrevista: diaDoMes(14), prazoEstimado: '12 dias',
        formaPagamento: 'A combinar', validade: diaDoMes(20),
        itens: [{ descricao: 'Cobertura 4 horas', quantidade: 1, valorUnitario: 1100 }],
        custos: { material: 0, combustivel: 70, alimentacao: 40, maoDeObra: 180, pedagio: 0, estacionamento: 25, outros: 0 },
        margem: 42, valor: 1100, status: 'rascunho',
        camposNicho: { tipoEnsaio: 'Aniversário', local: 'Buffet Estrela — Guarulhos', horario: '15:00', duracao: 4, qtdFotos: 150, prazoEntrega: '12 dias', formaEntrega: 'Galeria online', edicao: 'Básica', direitosImagem: 'Autorizado apenas para portfólio' },
        criadoEm: diaDoMes(-1)
      },
      {
        id: 'orc-005', numero: '005', clienteId: 'cli-006', titulo: 'Ensaio de produto',
        descricao: 'Catálogo com 30 peças em fundo infinito.',
        nicho: 'fotografo', dataPrevista: diaDoMes(-6), prazoEstimado: '15 dias',
        formaPagamento: 'Pix à vista', validade: diaDoMes(-2),
        itens: [{ descricao: 'Ensaio de produto', quantidade: 1, valorUnitario: 2100 }],
        custos: { material: 250, combustivel: 100, alimentacao: 60, maoDeObra: 300, pedagio: 40, estacionamento: 0, outros: 50 },
        margem: 35, valor: 2100, status: 'recusado',
        camposNicho: { tipoEnsaio: 'Produto', local: 'Estúdio próprio', horario: '09:00', duracao: 6, qtdFotos: 120, prazoEntrega: '15 dias', formaEntrega: 'Link para download', edicao: 'Artística', direitosImagem: 'Não autorizado' },
        criadoEm: diaDoMes(-14)
      },
      {
        id: 'orc-006', numero: '006', clienteId: 'cli-007', titulo: 'Identidade visual completa',
        descricao: 'Criação de marca para novo estúdio de estética.',
        nicho: 'designer', dataPrevista: diaDoMes(10), prazoEstimado: '20 dias',
        formaPagamento: '50% de entrada e 50% na entrega', validade: diaDoMes(15),
        itens: [{ descricao: 'Identidade visual completa', quantidade: 1, valorUnitario: 3200 }],
        custos: { material: 0, combustivel: 0, alimentacao: 0, maoDeObra: 900, pedagio: 0, estacionamento: 0, outros: 150 },
        margem: 65, valor: 3200, status: 'aguardando',
        camposNicho: { tipoProjeto: 'Identidade visual', entregaveis: 'Logotipo, paleta de cores, tipografia e manual de marca', formatosEntrega: 'PDF, PNG, SVG', revisoes: 3, usoComercial: 'Uso comercial ilimitado', prazoEntrega: '20 dias' },
        criadoEm: diaDoMes(-3)
      },
      {
        id: 'orc-007', numero: '007', clienteId: 'cli-008', titulo: 'Gestão mensal de redes sociais',
        descricao: 'Criação de conteúdo e gestão de Instagram e Facebook.',
        nicho: 'social-media', dataPrevista: diaDoMes(5), prazoEstimado: 'Mensal',
        formaPagamento: 'Mensalidade via Pix', validade: diaDoMes(9),
        itens: [{ descricao: 'Pacote mensal — 20 postagens', quantidade: 1, valorUnitario: 1800 }],
        custos: { material: 0, combustivel: 0, alimentacao: 0, maoDeObra: 500, pedagio: 0, estacionamento: 0, outros: 80 },
        margem: 68, valor: 1800, status: 'aprovado',
        camposNicho: { redes: 'Instagram e Facebook', servicoContratado: 'Gestão mensal', qtdPostagens: 20, periodicidade: 'Mensal', entregaveis: 'Planejamento de conteúdo, artes e agendamento', renovacaoAutomatica: 'Automática mensal' },
        criadoEm: diaDoMes(-9)
      }
    ];

    var contratos = [
      {
        id: 'ctr-001', numero: '001', orcamentoId: 'orc-001', clienteId: 'cli-001',
        nicho: 'fotografo', titulo: 'Ensaio de casamento', valor: 1800, status: 'ativo',
        dataInicio: diaDoMes(-12), clausulas: clausulasDoNicho('fotografo'),
        aditivos: [
          { id: 'adt-001', numero: '01', descricao: 'Álbum físico 30x30 com 40 páginas', valor: 500, data: diaDoMes(-6), condicoes: 'Entrega em até 30 dias após a seleção das fotos.' }
        ],
        criadoEm: diaDoMes(-14)
      },
      {
        id: 'ctr-002', numero: '002', orcamentoId: 'orc-003', clienteId: 'cli-003',
        nicho: 'fotografo', titulo: 'Ensaio corporativo', valor: 1400, status: 'aguardando',
        dataInicio: diaDoMes(8), clausulas: clausulasDoNicho('fotografo'),
        aditivos: [], criadoEm: diaDoMes(-2)
      }
    ];

    // Serviços do mês atual — base dos indicadores do dashboard
    var servicos = [
      { id: 'svc-001', numero: '001', contratoId: 'ctr-001', orcamentoId: 'orc-001', clienteId: 'cli-001', titulo: 'Ensaio de casamento', nicho: 'fotografo', data: diaDoMes(-12), hora: '16:00', duracaoHoras: 8, valor: 1800, custoPrevisto: 600, custoReal: 520, horasTrabalhadas: 16, status: 'concluido' },
      { id: 'svc-002', numero: '002', contratoId: null, orcamentoId: null, clienteId: 'cli-002', titulo: 'Ensaio gestante', nicho: 'fotografo', data: diaDoMes(-8), hora: '08:00', duracaoHoras: 2, valor: 950, custoPrevisto: 320, custoReal: 310, horasTrabalhadas: 6, status: 'concluido' },
      { id: 'svc-003', numero: '003', contratoId: null, orcamentoId: null, clienteId: 'cli-005', titulo: 'Cobertura de evento corporativo', nicho: 'fotografo', data: diaDoMes(-3), hora: '19:00', duracaoHoras: 6, valor: 2400, custoPrevisto: 900, custoReal: 880, horasTrabalhadas: 12, status: 'em_andamento' },
      { id: 'svc-004', numero: '004', contratoId: null, orcamentoId: null, clienteId: 'cli-004', titulo: 'Aniversário infantil', nicho: 'fotografo', data: diaDoMes(-1), hora: '15:00', duracaoHoras: 4, valor: 1200, custoPrevisto: 420, custoReal: 400, horasTrabalhadas: 7, status: 'em_andamento' },
      { id: 'svc-005', numero: '005', contratoId: null, orcamentoId: null, clienteId: 'cli-002', titulo: 'Ensaio externo no parque', nicho: 'fotografo', data: diaDoMes(0), hora: '08:00', duracaoHoras: 2, valor: 800, custoPrevisto: 280, custoReal: 260, horasTrabalhadas: 3, status: 'em_andamento' },
      { id: 'svc-006', numero: '006', contratoId: null, orcamentoId: null, clienteId: 'cli-003', titulo: 'Ensaio corporativo — equipe', nicho: 'fotografo', data: diaDoMes(0), hora: '14:00', duracaoHoras: 4, valor: 1500, custoPrevisto: 500, custoReal: 680, horasTrabalhadas: 5, status: 'em_andamento' },
      { id: 'svc-007', numero: '007', contratoId: null, orcamentoId: null, clienteId: 'cli-006', titulo: 'Ensaio de produto — catálogo', nicho: 'fotografo', data: diaDoMes(0), hora: '14:00', duracaoHoras: 3, valor: 1100, custoPrevisto: 360, custoReal: 350, horasTrabalhadas: 0, status: 'em_andamento' },
      { id: 'svc-008', numero: '008', contratoId: null, orcamentoId: null, clienteId: 'cli-001', titulo: 'Cobertura de formatura', nicho: 'fotografo', data: diaDoMes(1), hora: '19:30', duracaoHoras: 5, valor: 2200, custoPrevisto: 700, custoReal: 620, horasTrabalhadas: 0, status: 'agendado' },
      { id: 'svc-009', numero: '009', contratoId: null, orcamentoId: null, clienteId: 'cli-004', titulo: 'Retratos para currículo', nicho: 'fotografo', data: diaDoMes(2), hora: '10:00', duracaoHoras: 1, valor: 400, custoPrevisto: 130, custoReal: 120, horasTrabalhadas: 0, status: 'agendado' },
      { id: 'svc-010', numero: '010', contratoId: null, orcamentoId: null, clienteId: 'cli-005', titulo: 'Ensaio de casal', nicho: 'fotografo', data: diaDoMes(3), hora: '17:00', duracaoHoras: 2, valor: 500, custoPrevisto: 200, custoReal: 180, horasTrabalhadas: 0, status: 'agendado' }
    ];

    var despesas = [
      { id: 'exp-001', servicoId: 'svc-006', categoria: 'combustivel', descricao: 'Gasolina para deslocamento', valor: 80, data: diaDoMes(0) },
      { id: 'exp-002', servicoId: 'svc-006', categoria: 'maoDeObra', descricao: 'Assistente de estúdio', valor: 250, data: diaDoMes(0) },
      { id: 'exp-003', servicoId: 'svc-006', categoria: 'material', descricao: 'Fundo infinito e cartões de memória', valor: 350, data: diaDoMes(-1) },
      { id: 'exp-004', servicoId: 'svc-005', categoria: 'alimentacao', descricao: 'Almoço durante o ensaio', valor: 40, data: diaDoMes(0) },
      { id: 'exp-005', servicoId: 'svc-005', categoria: 'estacionamento', descricao: 'Estacionamento do parque', valor: 30, data: diaDoMes(0) },
      { id: 'exp-006', servicoId: 'svc-005', categoria: 'combustivel', descricao: 'Deslocamento até o parque', valor: 190, data: diaDoMes(0) },
      { id: 'exp-007', servicoId: 'svc-001', categoria: 'maoDeObra', descricao: 'Segundo fotógrafo', valor: 300, data: diaDoMes(-12) },
      { id: 'exp-008', servicoId: 'svc-001', categoria: 'material', descricao: 'Cartões de memória e baterias', valor: 220, data: diaDoMes(-12) }
    ];

    var pagamentos = [
      { id: 'pag-001', servicoId: 'svc-001', clienteId: 'cli-001', valorTotal: 1800, valorRecebido: 1800, forma: 'Pix', dataPrevista: diaDoMes(-10), dataRecebida: diaDoMes(-10), status: 'pago' },
      { id: 'pag-002', servicoId: 'svc-002', clienteId: 'cli-002', valorTotal: 950, valorRecebido: 475, forma: 'Pix', dataPrevista: diaDoMes(-2), dataRecebida: null, status: 'parcial' },
      { id: 'pag-003', servicoId: 'svc-003', clienteId: 'cli-005', valorTotal: 2400, valorRecebido: 1200, forma: 'Transferência', dataPrevista: diaDoMes(2), dataRecebida: null, status: 'parcial' },
      { id: 'pag-004', servicoId: 'svc-004', clienteId: 'cli-004', valorTotal: 1200, valorRecebido: 0, forma: 'Dinheiro', dataPrevista: diaDoMes(-3), dataRecebida: null, status: 'atrasado' },
      { id: 'pag-005', servicoId: 'svc-008', clienteId: 'cli-001', valorTotal: 2200, valorRecebido: 500, forma: 'Cartão', dataPrevista: diaDoMes(5), dataRecebida: null, status: 'parcial' }
    ];

    var agora = Date.now();
    var notificacoes = [
      { id: 'not-001', tipo: 'warning', titulo: 'Custo acima do previsto', texto: 'O serviço #006 ultrapassou o custo previsto em R$ 180,00.', data: new Date(agora - 1000 * 60 * 40).toISOString(), lida: false, link: null },
      { id: 'not-002', tipo: 'info', titulo: 'Orçamento aguardando aprovação', texto: 'O orçamento #002 de Mariana Oliveira ainda não teve resposta.', data: new Date(agora - 1000 * 60 * 60 * 5).toISOString(), lida: false, link: null },
      { id: 'not-003', tipo: 'danger', titulo: 'Pagamento atrasado', texto: 'O pagamento de R$ 1.200,00 de Fernanda Almeida está em atraso.', data: new Date(agora - 1000 * 60 * 60 * 26).toISOString(), lida: false, link: null },
      { id: 'not-004', tipo: 'info', titulo: 'Contrato aguardando aceite', texto: 'O contrato #002 está aguardando o aceite de Carlos Santos.', data: new Date(agora - 1000 * 60 * 60 * 50).toISOString(), lida: true, link: null },
      { id: 'not-005', tipo: 'success', titulo: 'Orçamento aprovado', texto: 'O orçamento #001 foi aprovado por João Silva.', data: new Date(agora - 1000 * 60 * 60 * 96).toISOString(), lida: true, link: null }
    ];

    // Histórico usado no gráfico do dashboard (últimos 6 meses)
    var hoje = new Date();
    var historico = [];
    var base = [
      { faturamento: 7400, custos: 2900 },
      { faturamento: 9100, custos: 3400 },
      { faturamento: 8250, custos: 3600 },
      { faturamento: 11200, custos: 4100 },
      { faturamento: 10400, custos: 3850 },
      { faturamento: 12850, custos: 4320 }
    ];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      var item = base[5 - i];
      historico.push({
        mes: d.getMonth(),
        ano: d.getFullYear(),
        faturamento: item.faturamento,
        custos: item.custos,
        lucro: item.faturamento - item.custos
      });
    }

    return {
      clientes: clientes,
      orcamentos: orcamentos,
      contratos: contratos,
      servicos: servicos,
      despesas: despesas,
      pagamentos: pagamentos,
      notificacoes: notificacoes,
      historico: historico
    };
  }

  return {
    BRAND: BRAND,
    NICHOS: NICHOS,
    getNicho: getNicho,
    clausulasDoNicho: clausulasDoNicho,
    CATEGORIAS_DESPESA: CATEGORIAS_DESPESA,
    STATUS_SERVICO: STATUS_SERVICO,
    STATUS_ORCAMENTO: STATUS_ORCAMENTO,
    STATUS_CONTRATO: STATUS_CONTRATO,
    STATUS_PAGAMENTO: STATUS_PAGAMENTO,
    USUARIO_DEMO: USUARIO_DEMO,
    diaDoMes: diaDoMes,
    seed: seed
  };
})();
