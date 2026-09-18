import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  FileText, 
  User, 
  CheckCircle, 
  AlertCircle,
  Clock,
  X,
  ArrowRight
} from 'lucide-react';
import { Material, Movimentacao, Configuracoes } from '../types';

interface MovimentacoesViewProps {
  movimentacoes: Movimentacao[];
  materiais: Material[];
  config: Configuracoes | null;
  onRefresh: () => void;
  initialMaterialId?: number | null;
  initialTipo?: 'ENTRADA' | 'SAIDA' | null;
  isOpenModalDirectly?: boolean;
  onCloseDirectModal?: () => void;
}

export const MovimentacoesView: React.FC<MovimentacoesViewProps> = ({
  movimentacoes,
  materiais,
  config,
  onRefresh,
  initialMaterialId,
  initialTipo,
  isOpenModalDirectly,
  onCloseDirectModal,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [filtroMaterial, setFiltroMaterial] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');

  // Formulário de Nova Movimentação
  const [formData, setFormData] = useState({
    material_id: initialMaterialId ? String(initialMaterialId) : '',
    tipo: (initialTipo || 'ENTRADA') as 'ENTRADA' | 'SAIDA',
    quantidade: 1,
    motivo: '',
    documento_referencia: '',
    responsavel_movimentacao: config?.aluno_responsavel || 'Laura Lavínia',
    data_movimentacao: new Date().toISOString().substring(0, 16).replace('T', ' '),
    observacoes: '',
  });

  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  useEffect(() => {
    if (isOpenModalDirectly) {
      setModalAberto(true);
      if (initialTipo) {
        setFormData((prev) => ({
          ...prev,
          tipo: initialTipo,
          material_id: initialMaterialId ? String(initialMaterialId) : prev.material_id,
          motivo: initialTipo === 'ENTRADA' ? 'Recebimento de Fornecedor' : 'Saída para Consumo / Manutenção',
        }));
      }
    }
  }, [isOpenModalDirectly, initialTipo, initialMaterialId]);

  // Material selecionado no formulário
  const materialSelecionado = useMemo(() => {
    return materiais.find((m) => String(m.id) === String(formData.material_id));
  }, [materiais, formData.material_id]);

  // Cálculo prévio do novo saldo
  const saldoPrevisto = useMemo(() => {
    if (!materialSelecionado) return null;
    const atual = Number(materialSelecionado.estoque_atual) || 0;
    const qtd = Number(formData.quantidade) || 0;
    if (formData.tipo === 'ENTRADA') {
      return atual + qtd;
    } else {
      return atual - qtd;
    }
  }, [materialSelecionado, formData.tipo, formData.quantidade]);

  const abrirModal = (tipo: 'ENTRADA' | 'SAIDA' = 'ENTRADA', matId?: number) => {
    setFormData({
      material_id: matId ? String(matId) : (materiais[0]?.id ? String(materiais[0].id) : ''),
      tipo,
      quantidade: 1,
      motivo: tipo === 'ENTRADA' ? 'Recebimento de Fornecedor' : 'Saída para Manutenção Operacional',
      documento_referencia: '',
      responsavel_movimentacao: config?.aluno_responsavel || 'Laura Lavínia',
      data_movimentacao: new Date().toISOString().substring(0, 16).replace('T', ' '),
      observacoes: '',
    });
    setErroMsg('');
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');

    if (!formData.material_id) {
      setErroMsg('Por favor, selecione um material do catálogo.');
      return;
    }

    if (formData.quantidade <= 0) {
      setErroMsg('A quantidade deve ser maior que zero.');
      return;
    }

    if (formData.tipo === 'SAIDA' && materialSelecionado) {
      if (materialSelecionado.estoque_atual < formData.quantidade) {
        setErroMsg(`Saldo insuficiente! Estoque atual disponível: ${materialSelecionado.estoque_atual} ${materialSelecionado.unidade_medida}`);
        return;
      }
    }

    setSalvando(true);
    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          material_id: Number(formData.material_id),
          quantidade: Number(formData.quantidade),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao registrar movimentação');

      setModalAberto(false);
      if (onCloseDirectModal) onCloseDirectModal();
      onRefresh();
    } catch (err: any) {
      setErroMsg(err.message);
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem da lista de movimentações
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      const matchTipo = filtroTipo === 'TODOS' || m.tipo === filtroTipo;
      const matchMaterial = filtroMaterial === 'TODOS' || String(m.material_id) === filtroMaterial;
      const matchBusca = 
        m.material_nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.material_codigo.toLowerCase().includes(busca.toLowerCase()) ||
        m.motivo.toLowerCase().includes(busca.toLowerCase()) ||
        (m.documento_referencia && m.documento_referencia.toLowerCase().includes(busca.toLowerCase())) ||
        (m.responsavel_movimentacao && m.responsavel_movimentacao.toLowerCase().includes(busca.toLowerCase()));

      return matchTipo && matchMaterial && matchBusca;
    });
  }, [movimentacoes, filtroTipo, filtroMaterial, busca]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Botões de Ação */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por material, motivo, documento NF ou responsável..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todas as Operações</option>
            <option value="ENTRADA">Apenas Entradas</option>
            <option value="SAIDA">Apenas Saídas</option>
          </select>

          {/* Filtro por Material */}
          <select
            value={filtroMaterial}
            onChange={(e) => setFiltroMaterial(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 max-w-[200px] truncate"
          >
            <option value="TODOS">Todos os Materiais</option>
            {materiais.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.codigo} - {m.nome}
              </option>
            ))}
          </select>

          <button
            id="btn-lancar-entrada"
            onClick={() => abrirModal('ENTRADA')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Nova Entrada</span>
          </button>

          <button
            id="btn-lancar-saida"
            onClick={() => abrirModal('SAIDA')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Nova Saída</span>
          </button>
        </div>
      </div>

      {/* Tabela de Histórico de Movimentações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-xs sm:text-sm text-slate-800 font-heading">
              Extrato Completo de Entradas e Saídas
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {movimentacoesFiltradas.length} movimentação(ões) encontrada(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr className="text-slate-600 text-left font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4 text-center">Qtd</th>
                <th className="py-3 px-4 text-center">Saldo Ant.</th>
                <th className="py-3 px-4 text-center">Saldo Novo</th>
                <th className="py-3 px-4">Motivo da Movimentação</th>
                <th className="py-3 px-4">Doc. Ref.</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimentacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhuma movimentação registrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                movimentacoesFiltradas.map((mv) => {
                  const isEntrada = mv.tipo === 'ENTRADA';
                  return (
                    <tr key={mv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {mv.data_movimentacao}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isEntrada 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isEntrada ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {mv.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 text-[11px] block">
                          {mv.material_codigo}
                        </span>
                        <span className="font-semibold text-slate-900">{mv.material_nome}</span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap font-extrabold text-sm">
                        <span className={isEntrada ? 'text-emerald-700' : 'text-amber-700'}>
                          {isEntrada ? '+' : '-'}{mv.quantidade}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          {mv.material_unidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap text-slate-500 font-mono">
                        {mv.saldo_anterior}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-slate-900 font-mono">
                        {mv.saldo_novo}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[220px]">
                        <div className="font-medium truncate" title={mv.motivo}>{mv.motivo}</div>
                        {mv.observacoes && (
                          <div className="text-[10px] text-slate-400 truncate" title={mv.observacoes}>
                            {mv.observacoes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {mv.documento_referencia ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                            {mv.documento_referencia}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {mv.responsavel_movimentacao || 'Almoxarifado'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Lançamento de Entrada ou Saída */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  formData.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {formData.tipo === 'ENTRADA' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-heading">
                    Registrar Movimentação de Estoque
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lançamento oficial de fluxo de almoxarifado
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalAberto(false);
                  if (onCloseDirectModal) onCloseDirectModal();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{erroMsg}</span>
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-3.5 text-xs">
              {/* Seletor de Tipo (Entrada vs Saída) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      tipo: 'ENTRADA',
                      motivo: formData.motivo || 'Recebimento de Fornecedor'
                    })}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.tipo === 'ENTRADA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>ENTRADA (Acréscimo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      tipo: 'SAIDA',
                      motivo: formData.motivo || 'Saída para Manutenção Operacional'
                    })}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.tipo === 'SAIDA'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>SAÍDA (Baixa de Estoque)</span>
                  </button>
                </div>
              </div>

              {/* Seletor do Material */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Material do Estoque *
                </label>
                <select
                  required
                  value={formData.material_id}
                  onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Selecione o Material --</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.codigo} - {m.nome} (Atual: {m.estoque_atual} {m.unidade_medida})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prévia do Saldo em Tempo Real */}
              {materialSelecionado && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Saldo Atual</span>
                    <strong className="text-slate-800 text-sm">
                      {materialSelecionado.estoque_atual} {materialSelecionado.unidade_medida}
                    </strong>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Operação</span>
                    <span className={`font-bold text-sm ${formData.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formData.tipo === 'ENTRADA' ? '+' : '-'}{formData.quantidade || 0} {materialSelecionado.unidade_medida}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Novo Saldo Previsto</span>
                    <strong className={`text-sm ${saldoPrevisto !== null && saldoPrevisto < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {saldoPrevisto} {materialSelecionado.unidade_medida}
                    </strong>
                  </div>
                </div>
              )}

              {/* Quantidade e Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Quantidade Movimentada *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Data e Hora
                  </label>
                  <input
                    type="text"
                    value={formData.data_movimentacao}
                    onChange={(e) => setFormData({ ...formData, data_movimentacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Motivo da Movimentação (Obrigatório pelo Requisito 1) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Motivo da Movimentação *
                </label>
                <input
                  type="text"
                  required
                  list="lista-motivos"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ex: Recebimento de Fornecedor / Consumo Manutenção"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="lista-motivos">
                  <option value="Recebimento de Fornecedor" />
                  <option value="Compra Local Emergencial" />
                  <option value="Devolução de Material ao Estoque" />
                  <option value="Saída para Manutenção Preventiva" />
                  <option value="Saída para Manutenção Corretiva" />
                  <option value="Consumo em Obra / Projeto" />
                  <option value="Atendimento de Requisição Interna" />
                  <option value="Ajuste de Inventário (Auditoria)" />
                  <option value="Avaria / Descarte / Perda Técnica" />
                </datalist>
              </div>

              {/* Documento de Referência e Responsável */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Documento de Ref. (NF / OS / Pedido)
                  </label>
                  <input
                    type="text"
                    value={formData.documento_referencia}
                    onChange={(e) => setFormData({ ...formData, documento_referencia: e.target.value })}
                    placeholder="Ex: NF-10492 / OS-202"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Responsável pelo Lançamento
                  </label>
                  <input
                    type="text"
                    value={formData.responsavel_movimentacao}
                    onChange={(e) => setFormData({ ...formData, responsavel_movimentacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Observações Complementares
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o lote, fornecedor ou destino..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    if (onCloseDirectModal) onCloseDirectModal();
                  }}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || (saldoPrevisto !== null && saldoPrevisto < 0)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 ${
                    formData.tipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{salvando ? 'Gravando...' : `Confirmar ${formData.tipo}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
