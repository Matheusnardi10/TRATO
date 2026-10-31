/* Modelos (interfaces) espelhando as entidades do backend Spring Boot.
   Mantemos os mesmos nomes de campo em português usados no projeto original
   (js/data.js) para que a migração fique fácil de conferir. */

export interface Negocio {
  cidade?: string;
  logo?: string;
  telefoneProfissional?: string;
  emailProfissional?: string;
  pix?: string;
  formaPagamentoPadrao?: string;
  prazoPadrao?: string;
  documento?: string;
  endereco?: string;
}

export interface Usuario {
  id: number;
  nome: string;
  nomeProfissional: string;
  email: string;
  telefone?: string;
  nicho?: string;
  criadoEm?: string;
  negocio?: Negocio;
}

export interface LoginResponse {
  ok: boolean;
  usuario?: Usuario;
  erro?: string;
}

export interface Cliente {
  id?: number;
  nome: string;
  telefone?: string;
  email?: string;
  documento?: string;
  endereco?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  criadoEm?: string;
}

export interface ItemOrcamento {
  id?: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface CustosOrcamento {
  material?: number;
  combustivel?: number;
  alimentacao?: number;
  maoDeObra?: number;
  pedagio?: number;
  estacionamento?: number;
  ferramentas?: number;
  outros?: number;
}

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aguardando' | 'aprovado' | 'recusado' | 'expirado';

export interface Orcamento {
  id?: number;
  numero?: string;
  clienteId: number;
  clienteNome?: string;
  titulo: string;
  descricao?: string;
  nicho: string;
  dataPrevista?: string;
  prazoEstimado?: string;
  formaPagamento?: string;
  validade?: string;
  itens: ItemOrcamento[];
  custos: CustosOrcamento;
  margem: number;
  valor: number;
  status: StatusOrcamento;
  camposNicho: { [chave: string]: any };
  criadoEm?: string;
}

export type StatusServico = 'orcamento' | 'aprovado' | 'agendado' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

export interface Servico {
  id?: number;
  numero?: string;
  contratoId?: number | null;
  orcamentoId?: number | null;
  clienteId: number;
  clienteNome?: string;
  titulo: string;
  nicho: string;
  data: string;
  hora: string;
  duracaoHoras?: number;
  valor: number;
  custoPrevisto: number;
  custoReal: number;
  horasTrabalhadas?: number;
  status: StatusServico;
}

export interface Despesa {
  id?: number;
  servicoId: number;
  categoria: string;
  descricao: string;
  valor: number;
  data?: string;
}

export type StatusPagamento = 'pendente' | 'parcial' | 'pago' | 'atrasado';

export interface Pagamento {
  id?: number;
  servicoId: number;
  clienteId: number;
  valorTotal: number;
  valorRecebido: number;
  forma?: string;
  dataPrevista?: string;
  dataRecebida?: string | null;
  status: StatusPagamento;
}

export type StatusContrato = 'rascunho' | 'aguardando' | 'ativo' | 'concluido' | 'cancelado';

export interface Clausula {
  id?: number;
  numero: number;
  titulo: string;
  texto: string;
  baseLegal?: string;
}

export interface Aditivo {
  id?: number;
  numero?: string;
  tipo: string;
  descricao: string;
  valor: number;
  data?: string;
  condicoes?: string;
}

export interface CampoContrato {
  chave: string;
  rotulo: string;
  tipo: string;
  obrigatorio: boolean;
  opcoes: string[];
  grupo: 'contratante' | 'contrato' | 'especifico';
  valor: string;
  pendente: boolean;
}

export interface Contrato {
  id?: number;
  numero?: string;
  orcamentoId?: number;
  clienteId: number;
  clienteNome?: string;
  nicho: string;
  titulo: string;
  valor: number;
  valorTotal?: number;
  status: StatusContrato;
  dataInicio?: string;
  clausulas: Clausula[];
  aditivos: Aditivo[];
  criadoEm?: string;
  tituloDocumento?: string;
  versaoModelos?: string;
  cabecalho?: string;
  assinatura?: string;
  avisoLegal?: string;
  dados?: Record<string, string>;
  campos?: CampoContrato[];
  pendentes?: string[];
  linkAceite?: string | null;
  enviadoEm?: string | null;
  enviadoPara?: string | null;
  aprovadoEm?: string | null;
  mensagem?: string | null;
}

/* O que o cliente vê na página pública /aprovar-contrato/:token. */
export interface ContratoPublico {
  numero: string;
  titulo: string;
  tituloDocumento?: string;
  profissionalNome: string;
  clienteNome: string;
  valorTotal: number;
  status: StatusContrato;
  cabecalho?: string;
  clausulas: Clausula[];
  aditivos: Aditivo[];
  assinatura?: string;
  avisoLegal?: string;
  versaoModelos?: string;
  aprovadoEm?: string | null;
}

export interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  texto: string;
  data: string;
  lida: boolean;
}

export interface ResumoFinanceiro {
  receitas: number;
  despesas: number;
  lucro: number;
  aReceber: number;
  recebidoNoPeriodo: number;
  saldo: number;
}

export interface CategoriaDespesaResumo {
  id: string;
  nome: string;
  emoji: string;
  valor: number;
}

export interface PontoFluxoCaixa {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface ServicoRentavel { numero: string; titulo: string; valor: number; custoReal: number; lucroAtual: number; margem: number; }
export interface ClienteMovimentacao { nome: string; quantidade: number; total: number; }
export interface StatusOrcamentoResumo { status: string; quantidade: number; valor: number; }
export interface PrevistoRealizado { numero: string; titulo: string; previsto: number; real: number; diferenca: number; }
export interface LucroPorHora { numero: string; titulo: string; horas: number; lucroPorHora: number; }

export interface Nicho {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
  camposOrcamento: CampoNicho[];
}

export interface CampoNicho {
  id: string;
  label: string;
  tipo: 'text' | 'textarea' | 'number' | 'select' | 'time';
  opcoes?: string[];
  obrigatorio?: boolean;
}

export interface ResumoMes {
  faturamento: number;
  custos: number;
  lucro: number;
  margem: number;
  emAndamento: number;
  aReceber: number;
}
