import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Repeat, 
  AlertTriangle, 
  FileSpreadsheet, 
  PlusCircle, 
  FileText,
  Boxes,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { Indicadores, Material } from '../types';

interface DashboardKPIsProps {
  indicadores: Indicadores | null;
  materiais: Material[];
  onNavigate: (tab: string) => void;
  onOpenNovaMovimentacao: (tipo?: 'ENTRADA' | 'SAIDA') => void;
  onOpenNovaRequisicao: () => void;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  indicadores,
  materiais,
  onNavigate,
  onOpenNovaMovimentacao,
  onOpenNovaRequisicao,
}) => {
  if (!indicadores) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p>Carregando indicadores do almoxarifado...</p>
      </div>
    );
  }

  // Filtrar materiais que estão em situação crítica ou alerta
  const itensCriticos = materiais.filter(
    (m) => m.estoque_atual <= 0 || m.estoque_atual <= m.estoque_minimo
  );

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas Operacionais */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 mb-2 border border-white/20">
              <Activity className="h-3.5 w-3.5 text-blue-200" />
              Painel de Desempenho & Controle Operacional
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
              Visão Geral do Almoxarifado
            </h2>
            <p className="text-sm text-blue-100 max-w-2xl mt-1">
              Monitore fluxos de entrada e saída, giro de estoque, indicadores estatísticos e itens que exigem reposição imediata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-quick-entrada"
              onClick={() => onOpenNovaMovimentacao('ENTRADA')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-sm hover:shadow active:scale-95"
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Registrar Entrada</span>
            </button>

            <button
              id="btn-quick-saida"
              onClick={() => onOpenNovaMovimentacao('SAIDA')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-sm hover:shadow active:scale-95"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Registrar Saída</span>
            </button>

            <button
              id="btn-quick-requisicao"
              onClick={onOpenNovaRequisicao}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Nova Requisição</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de 4 Indicadores Obrigatórios (Requisito 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Movimentações */}
        <div 
          id="kpi-total-movimentacoes"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Movimentações
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              {indicadores.total_movimentacoes}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">registros</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowDownLeft className="h-3 w-3" />
              {indicadores.total_entradas_count} entradas
            </span>
            <span className="text-amber-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              {indicadores.total_saidas_count} saídas
            </span>
          </div>
        </div>

        {/* KPI 2: Entrada Média */}
        <div 
          id="kpi-entrada-media"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Entrada Média
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight font-heading">
              {indicadores.entrada_media}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">unid. / lote</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 truncate">
            Volume total recebido: <strong className="text-slate-800">{indicadores.quantidade_total_entradas}</strong> unid.
          </p>
        </div>

        {/* KPI 3: Saída Média */}
        <div 
          id="kpi-saida-media"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saída Média
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight font-heading">
              {indicadores.saida_media}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">unid. / baixa</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 truncate">
            Volume total distribuído: <strong className="text-slate-800">{indicadores.quantidade_total_saidas}</strong> unid.
          </p>
        </div>

        {/* KPI 4: Taxa de Rotatividade (Giro de Estoque) */}
        <div 
          id="kpi-taxa-rotatividade"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Rotatividade
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Repeat className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-purple-700 tracking-tight font-heading">
              {indicadores.taxa_rotatividade}x
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">giro estoque</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 truncate" title="Giro = Total Saídas / Estoque Atual">
            Giro operacional (Saídas / Estoque Atual)
          </p>
        </div>
      </div>

      {/* Métricas Adicionais & Resumo de Saúde do Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Alerta de Estoque Mínimo e Crítico */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 font-heading">
                Atenção: Itens em Situação Crítica ou Alerta de Reposição
              </h3>
            </div>
            <button
              onClick={() => onNavigate('materiais')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ver todos os materiais
            </button>
          </div>

          {itensCriticos.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">Todos os níveis de estoque estão normais!</p>
              <p className="mt-0.5">Nenhum item está abaixo da margem de segurança configurada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead>
                  <tr className="text-slate-500 text-left uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">Código</th>
                    <th className="pb-2.5">Material</th>
                    <th className="pb-2.5">Categoria</th>
                    <th className="pb-2.5 text-center">Disponível</th>
                    <th className="pb-2.5 text-center">Mínimo</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itensCriticos.slice(0, 5).map((mat) => {
                    const isZero = mat.estoque_atual <= 0;
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-mono font-semibold text-slate-700">{mat.codigo}</td>
                        <td className="py-2.5 font-medium text-slate-900 max-w-[200px] truncate">{mat.nome}</td>
                        <td className="py-2.5 text-slate-500">{mat.categoria}</td>
                        <td className="py-2.5 text-center font-bold">
                          <span className={isZero ? 'text-rose-600' : 'text-amber-600'}>
                            {mat.estoque_atual} {mat.unidade_medida}
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-slate-500">
                          {mat.estoque_minimo} {mat.unidade_medida}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isZero ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isZero ? 'ZERADO' : 'ABAIXO DO MÍNIMO'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onOpenNovaMovimentacao('ENTRADA')}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded"
                          >
                            Repor
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo Consolidado & Requisições Pendentes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 font-heading flex items-center gap-1.5">
                <Boxes className="h-5 w-5 text-blue-600" />
                <span>Patrimônio & Requisições</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Itens / SKUs Cadastrados:</span>
                <strong className="text-slate-900 font-semibold text-sm">
                  {indicadores.total_itens_cadastrados} materiais
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Unidades Físicas em Estoque:</span>
                <strong className="text-slate-900 font-semibold text-sm">
                  {indicadores.estoque_total_unidades.toLocaleString('pt-BR')} unidades
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-emerald-800 font-medium">Valor Estimado do Inventário:</span>
                <strong className="text-emerald-900 font-bold text-sm">
                  R$ {indicadores.valor_total_inventario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="text-blue-800 font-medium">Requisições Pendentes:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {indicadores.requisicoes_pendentes} aguardando
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('relatorios')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-600" />
              <span>Ver Relatório Completo de Posição de Estoque</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
