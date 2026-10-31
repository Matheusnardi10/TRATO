import { Nicho } from '../models/models';

/* Catálogo de nichos e campos dinâmicos de orçamento.
   Isto é configuração estática da aplicação (não é "dado de negócio" do
   usuário), por isso continua vivendo no frontend — igual ao js/data.js
   original. As cláusulas de contrato por nicho vivem no backend
   (ClausulasModelo.java), já preenchidas quando o contrato é gerado. */
export const NICHOS: Nicho[] = [
  {
    id: 'fotografo', nome: 'Fotógrafo', emoji: '📸', descricao: 'Ensaios, eventos e coberturas',
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
    ]
  },
  {
    id: 'eletricista', nome: 'Eletricista', emoji: '🔌', descricao: 'Instalações, reparos e manutenção',
    camposOrcamento: [
      { id: 'tipoServico', label: 'Tipo de serviço', tipo: 'select', opcoes: ['Instalação', 'Reparo', 'Troca de quadro', 'Manutenção preventiva', 'Emergência'], obrigatorio: true },
      { id: 'local', label: 'Local do serviço', tipo: 'text', obrigatorio: true },
      { id: 'materiais', label: 'Materiais necessários', tipo: 'textarea' },
      { id: 'materiaisPor', label: 'Materiais fornecidos por', tipo: 'select', opcoes: ['Profissional', 'Cliente', 'Ambos'] },
      { id: 'prazo', label: 'Prazo de execução', tipo: 'text' },
      { id: 'garantia', label: 'Garantia do serviço', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses', '1 ano'] },
      { id: 'observacoes', label: 'Observações', tipo: 'textarea' }
    ]
  },
  {
    id: 'ar-condicionado', nome: 'Técnico de ar-condicionado', emoji: '❄️', descricao: 'Instalação, limpeza e manutenção',
    camposOrcamento: [
      { id: 'equipamento', label: 'Tipo de equipamento', tipo: 'select', opcoes: ['Split', 'Janela', 'Multi split', 'Cassete', 'Portátil'], obrigatorio: true },
      { id: 'marca', label: 'Marca', tipo: 'text' },
      { id: 'modelo', label: 'Modelo', tipo: 'text' },
      { id: 'tipoManutencao', label: 'Tipo de manutenção', tipo: 'select', opcoes: ['Instalação', 'Limpeza', 'Preventiva', 'Corretiva', 'Recarga de gás'], obrigatorio: true },
      { id: 'local', label: 'Local do serviço', tipo: 'text' },
      { id: 'pecas', label: 'Peças previstas', tipo: 'textarea' },
      { id: 'garantia', label: 'Garantia', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses', '1 ano'] },
      { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
    ]
  },
  {
    id: 'pintor', nome: 'Pintor', emoji: '🎨', descricao: 'Pintura residencial e comercial',
    camposOrcamento: [
      { id: 'tipoServico', label: 'Tipo de pintura', tipo: 'select', opcoes: ['Interna', 'Externa', 'Textura', 'Grafiato', 'Repintura'], obrigatorio: true },
      { id: 'local', label: 'Local', tipo: 'text', obrigatorio: true },
      { id: 'area', label: 'Área aproximada (m²)', tipo: 'number' },
      { id: 'materiais', label: 'Materiais', tipo: 'textarea' },
      { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
    ]
  },
  {
    id: 'pedreiro', nome: 'Pedreiro', emoji: '🧱', descricao: 'Obras, reformas e acabamentos',
    camposOrcamento: [
      { id: 'tipoServico', label: 'Tipo de obra', tipo: 'text', obrigatorio: true },
      { id: 'local', label: 'Local', tipo: 'text', obrigatorio: true },
      { id: 'materiais', label: 'Materiais', tipo: 'textarea' },
      { id: 'prazo', label: 'Prazo de execução', tipo: 'text' }
    ]
  },
  {
    id: 'marceneiro', nome: 'Marceneiro', emoji: '🪚', descricao: 'Móveis sob medida e reparos',
    camposOrcamento: [
      { id: 'tipoServico', label: 'Tipo de móvel', tipo: 'text', obrigatorio: true },
      { id: 'medidas', label: 'Medidas', tipo: 'text' },
      { id: 'material', label: 'Material', tipo: 'text' },
      { id: 'prazo', label: 'Prazo de entrega', tipo: 'text' }
    ]
  },
  {
    id: 'tecnico', nome: 'Técnico / Manutenção', emoji: '🔧', descricao: 'Assistência e manutenção geral',
    camposOrcamento: [
      { id: 'equipamento', label: 'Equipamento', tipo: 'text', obrigatorio: true },
      { id: 'tipoServico', label: 'Tipo de atendimento', tipo: 'select', opcoes: ['Diagnóstico', 'Reparo', 'Instalação', 'Manutenção preventiva'] },
      { id: 'pecas', label: 'Peças previstas', tipo: 'textarea' },
      { id: 'garantia', label: 'Garantia', tipo: 'select', opcoes: ['30 dias', '90 dias', '6 meses'] }
    ]
  },
  {
    id: 'freelancer', nome: 'Freelancer', emoji: '💻', descricao: 'Projetos digitais e criativos',
    camposOrcamento: [
      { id: 'tipoProjeto', label: 'Tipo de projeto', tipo: 'text', obrigatorio: true },
      { id: 'entregaveis', label: 'Entregáveis', tipo: 'textarea' },
      { id: 'revisoes', label: 'Rodadas de revisão incluídas', tipo: 'number' },
      { id: 'prazo', label: 'Prazo de entrega', tipo: 'text' }
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    id: 'outro', nome: 'Outro', emoji: '➕', descricao: 'Personalize depois nas configurações',
    camposOrcamento: [
      { id: 'tipoServico', label: 'Tipo de serviço', tipo: 'text', obrigatorio: true },
      { id: 'local', label: 'Local', tipo: 'text' },
      { id: 'prazo', label: 'Prazo', tipo: 'text' }
    ]
  }
];

export function getNicho(id: string | undefined | null): Nicho {
  return NICHOS.find(n => n.id === id) || NICHOS[NICHOS.length - 1];
}

export const CATEGORIAS_DESPESA = [
  { id: 'material', nome: 'Material', emoji: '📦' },
  { id: 'combustivel', nome: 'Combustível', emoji: '⛽' },
  { id: 'alimentacao', nome: 'Alimentação', emoji: '🍽️' },
  { id: 'maoDeObra', nome: 'Mão de obra', emoji: '👷' },
  { id: 'pedagio', nome: 'Pedágio', emoji: '🛣️' },
  { id: 'estacionamento', nome: 'Estacionamento', emoji: '🅿️' },
  { id: 'ferramentas', nome: 'Ferramentas', emoji: '🧰' },
  { id: 'outros', nome: 'Outros', emoji: '•' }
];

export const STATUS_ORCAMENTO: Record<string, { label: string; classe: string }> = {
  rascunho: { label: 'Rascunho', classe: 'badge-neutral' },
  enviado: { label: 'Enviado', classe: 'badge-info' },
  aguardando: { label: 'Aguardando aprovação', classe: 'badge-warning' },
  aprovado: { label: 'Aprovado', classe: 'badge-success' },
  recusado: { label: 'Recusado', classe: 'badge-danger' },
  expirado: { label: 'Expirado', classe: 'badge-neutral' }
};

export const STATUS_SERVICO: Record<string, { label: string; classe: string }> = {
  orcamento: { label: 'Orçamento', classe: 'badge-neutral' },
  aprovado: { label: 'Aprovado', classe: 'badge-info' },
  agendado: { label: 'Agendado', classe: 'badge-info' },
  em_andamento: { label: 'Em andamento', classe: 'badge-warning' },
  pausado: { label: 'Pausado', classe: 'badge-neutral' },
  concluido: { label: 'Concluído', classe: 'badge-success' },
  cancelado: { label: 'Cancelado', classe: 'badge-danger' }
};

export const STATUS_CONTRATO: Record<string, { label: string; classe: string }> = {
  rascunho: { label: 'Rascunho', classe: 'badge-neutral' },
  aguardando: { label: 'Aguardando aceite', classe: 'badge-warning' },
  ativo: { label: 'Ativo', classe: 'badge-success' },
  concluido: { label: 'Concluído', classe: 'badge-info' },
  cancelado: { label: 'Cancelado', classe: 'badge-danger' }
};

export const STATUS_PAGAMENTO: Record<string, { label: string; classe: string }> = {
  pendente: { label: 'Pendente', classe: 'badge-neutral' },
  parcial: { label: 'Parcial', classe: 'badge-warning' },
  pago: { label: 'Pago', classe: 'badge-success' },
  atrasado: { label: 'Atrasado', classe: 'badge-danger' }
};
