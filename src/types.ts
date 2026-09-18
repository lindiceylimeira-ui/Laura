export interface Material {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  localizacao?: string;
  preco_unitario: number;
  status_estoque?: 'CRITICO' | 'ALERTA' | 'NORMAL' | 'EXCESSO';
  valor_total_estoque?: number;
  criado_em?: string;
}

export interface Movimentacao {
  id: number;
  material_id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  motivo: string;
  documento_referencia?: string;
  responsavel_movimentacao?: string;
  data_movimentacao: string;
  saldo_anterior: number;
  saldo_novo: number;
  observacoes?: string;
  material_codigo: string;
  material_nome: string;
  material_unidade: string;
  material_categoria: string;
}

export interface ItemRequisicao {
  id?: number;
  requisicao_id?: number;
  material_id: number;
  quantidade_solicitada: number;
  quantidade_atendida?: number;
  observacoes?: string;
  material_codigo?: string;
  material_nome?: string;
  material_unidade?: string;
  material_estoque_atual?: number;
  material_localizacao?: string;
}

export interface Requisicao {
  id: number;
  numero: string;
  solicitante: string;
  departamento: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status: 'PENDENTE' | 'APROVADA' | 'ATENDIDA' | 'CANCELADA';
  justificativa: string;
  data_solicitacao: string;
  data_atendimento?: string;
  responsavel_atendimento?: string;
  observacoes?: string;
  total_itens?: number;
  total_qtd_solicitada?: number;
  total_qtd_atendida?: number;
  itens?: ItemRequisicao[];
  responsavel_tecnico?: string;
  matricula_responsavel?: string;
  nome_almoxarifado?: string;
}

export interface Indicadores {
  total_movimentacoes: number;
  total_entradas_count: number;
  total_saidas_count: number;
  quantidade_total_entradas: number;
  quantidade_total_saidas: number;
  entrada_media: number;
  saida_media: number;
  taxa_rotatividade: number;
  total_itens_cadastrados: number;
  itens_criticos_zerados: number;
  itens_em_alerta_minimo: number;
  estoque_total_unidades: number;
  valor_total_inventario: number;
  requisicoes_total: number;
  requisicoes_pendentes: number;
  requisicoes_atendidas: number;
  movimentacoes_por_dia: Array<{ dia: string; entradas: number; saidas: number }>;
  aluno_responsavel: string;
}

export interface Configuracoes {
  aluno_responsavel: string;
  matricula_aluno: string;
  curso_instituicao: string;
  nome_almoxarifado: string;
}

export interface RelatorioEstoqueData {
  materiais: Array<Material & { status_estoque: string; valor_total: number; ultima_movimentacao: string }>;
  totais: {
    total_itens: number;
    total_unidades: number;
    total_valor: number;
    itens_criticos: number;
  };
  responsavel_tecnico: string;
  matricula_responsavel: string;
  curso_instituicao: string;
  nome_almoxarifado: string;
  data_geracao: string;
}
