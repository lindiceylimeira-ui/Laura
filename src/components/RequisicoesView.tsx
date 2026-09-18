import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  X, 
  Building, 
  User, 
  Package,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Requisicao, Material, Configuracoes } from '../types';
import { RequisicaoPrintModal } from './RequisicaoPrintModal';

interface RequisicoesViewProps {
  requisicoes: Requisicao[];
  materiais: Material[];
  config: Configuracoes | null;
  onRefresh: () => void;
  isOpenNovaRequisicaoDirectly?: boolean;
  onCloseDirectNovaRequisicao?: () => void;
}

export const RequisicoesView: React.FC<RequisicoesViewProps> = ({
  requisicoes,
  materiais,
  config,
  onRefresh,
  isOpenNovaRequisicaoDirectly,
  onCloseDirectNovaRequisicao,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');
  const [busca, setBusca] = useState('');
  
  // Modal de Impressão / Detalhes
  const [requisicaoSelecionada, setRequisicaoSelecionada] = useState<Requisicao | null>(null);
  const [atendendo, setAtendendo] = useState(false);

  // Modal de Criação de Nova Requisição
  const [modalNovaAberta, setModalNovaAberta] = useState(false);
  const [formData, setFormData] = useState({
    solicitante: '',
    departamento: 'Manutenção Operacional',
    prioridade: 'MEDIA' as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
    justificativa: '',
    observacoes: '',
  });

  const [itensSolicitados, setItensSolicitados] = useState<Array<{
    material_id: string;
    quantidade_solicitada: number;
    observacoes: string;
  }>>([
    { material_id: materiais[0]?.id ? String(materiais[0].id) : '', quantidade_solicitada: 1, observacoes: '' },
  ]);

  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  // Ativação direta se solicitada via dashboard
  React.useEffect(() => {
    if (isOpenNovaRequisicaoDirectly) {
      abrirModalNova();
    }
  }, [isOpenNovaRequisicaoDirectly]);

  const abrirModalNova = () => {
    setFormData({
      solicitante: '',
      departamento: 'Manutenção Operacional',
      prioridade: 'MEDIA',
      justificativa: '',
      observacoes: '',
    });
    setItensSolicitados([
      { material_id: materiais[0]?.id ? String(materiais[0].id) : '', quantidade_solicitada: 1, observacoes: '' },
    ]);
    setErroMsg('');
    setModalNovaAberta(true);
  };

  const fecharModalNova = () => {
    setModalNovaAberta(false);
    if (onCloseDirectNovaRequisicao) onCloseDirectNovaRequisicao();
  };

  const adicionarLinhaItem = () => {
    const matDisponivel = materiais.find(m => !itensSolicitados.some(i => i.material_id === String(m.id))) || materiais[0];
    setItensSolicitados([
      ...itensSolicitados,
      { material_id: matDisponivel ? String(matDisponivel.id) : '', quantidade_solicitada: 1, observacoes: '' },
    ]);
  };

  const removerLinhaItem = (index: number) => {
    if (itensSolicitados.length <= 1) return;
    setItensSolicitados(itensSolicitados.filter((_, idx) => idx !== index));
  };

  const atualizarItem = (index: number, campo: string, valor: any) => {
    const novos = [...itensSolicitados];
    novos[index] = { ...novos[index], [campo]: valor };
    setItensSolicitados(novos);
  };

  const handleSalvarRequisicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg('');

    if (!formData.solicitante.trim()) {
      setErroMsg('Informe o nome do solicitante.');
      return;
    }

    if (!formData.justificativa.trim()) {
      setErroMsg('Informe a justificativa operacional da solicitação.');
      return;
    }

    if (itensSolicitados.length === 0) {
      setErroMsg('Adicione pelo menos um item à requisição.');
      return;
    }

    for (const item of itensSolicitados) {
      if (!item.material_id) {
        setErroMsg('Selecione um material para todas as linhas da requisição.');
        return;
      }
      if (item.quantidade_solicitada <= 0) {
        setErroMsg('A quantidade solicitada deve ser maior que zero.');
        return;
      }
    }

    setSalvando(true);
    try {
      const res = await fetch('/api/requisicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          itens: itensSolicitados,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar requisição');

      fecharModalNova();
      onRefresh();
      // Abrir visualização da nova requisição criada
      if (data.id) {
        visualizarRequisicao(data.id);
      }
    } catch (err: any) {
      setErroMsg(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const visualizarRequisicao = async (id: number) => {
    try {
      const res = await fetch(`/api/requisicoes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar requisição');
      setRequisicaoSelecionada(data);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleAtenderRequisicao = async (id: number) => {
    if (!window.confirm('Deseja atender esta requisição? Todos os itens solicitados serão baixados automaticamente do estoque e as movimentações de saída serão geradas.')) {
      return;
    }

    setAtendendo(true);
    try {
      const res = await fetch(`/api/requisicoes/${id}/atender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel_atendimento: config?.aluno_responsavel || 'Laura Lavínia',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atender requisição');

      alert(data.message);
      setRequisicaoSelecionada(null);
      onRefresh();
    } catch (err: any) {
      alert('Não foi possível atender: ' + err.message);
    } finally {
      setAtendendo(false);
    }
  };

  // Filtragem da lista
  const requisicoesFiltradas = useMemo(() => {
    return requisicoes.filter((r) => {
      const matchStatus = filtroStatus === 'TODAS' || r.status === filtroStatus;
      const matchBusca = 
        r.numero.toLowerCase().includes(busca.toLowerCase()) ||
        r.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
        r.departamento.toLowerCase().includes(busca.toLowerCase()) ||
        r.justificativa.toLowerCase().includes(busca.toLowerCase());

      return matchStatus && matchBusca;
    });
  }, [requisicoes, filtroStatus, busca]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Criação */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número REQ, solicitante, departamento ou justificativa..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="ATENDIDA">Atendidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>

          <button
            id="btn-emitir-requisicao"
            onClick={abrirModalNova}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Requisição</span>
          </button>
        </div>
      </div>

      {/* Lista de Requisições */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-xs sm:text-sm text-slate-800 font-heading">
              Controle de Solicitações de Material (Requisições)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {requisicoesFiltradas.length} requisição(ões)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr className="text-slate-600 text-left font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-center">Itens</th>
                <th className="py-3 px-4 text-center">Prioridade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisicoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma requisição encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                requisicoesFiltradas.map((r) => {
                  const isPendente = r.status === 'PENDENTE';
                  const isAtendida = r.status === 'ATENDIDA';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.numero}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {r.data_solicitacao.substring(0, 10)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {r.solicitante}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.departamento}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {r.total_itens || (r.itens ? r.itens.length : 0)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.prioridade === 'URGENTE'
                            ? 'bg-rose-100 text-rose-800'
                            : r.prioridade === 'ALTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.prioridade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isAtendida
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isPendente
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isAtendida ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visualizar & Imprimir */}
                          <button
                            onClick={() => visualizarRequisicao(r.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                            title="Visualizar e Imprimir Requisição"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver / Imprimir</span>
                          </button>

                          {/* Botão de Atender Requisição se Pendente */}
                          {isPendente && (
                            <button
                              onClick={() => handleAtenderRequisicao(r.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                              title="Baixar estoque e atender esta requisição"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Atender</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação de Nova Requisição */}
      {modalNovaAberta && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-heading">
                    Emitir Nova Requisição de Material
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solicitação formal para liberação e baixa de almoxarifado
                  </p>
                </div>
              </div>
              <button
                onClick={fecharModalNova}
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

            <form onSubmit={handleSalvarRequisicao} className="mt-4 space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Nome do Solicitante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.solicitante}
                    onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    placeholder="Ex: Carlos Alberto (Oficina Mecânica)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Departamento / Setor *
                  </label>
                  <input
                    type="text"
                    required
                    list="lista-setores"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    placeholder="Ex: Manutenção Preventiva"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="lista-setores">
                    <option value="Manutenção Operacional" />
                    <option value="Laboratório de Práticas" />
                    <option value="Obras & Infraestrutura" />
                    <option value="Tecnologia & TI" />
                    <option value="Administrativo / Diretoria" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Grau de Prioridade *
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="BAIXA">Baixa - Planejamento</option>
                    <option value="MEDIA">Média - Padrão Operacional</option>
                    <option value="ALTA">Alta - Reparo Importante</option>
                    <option value="URGENTE">Urgente - Parada de Máquina</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Observações Internas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Ex: Retirar até as 17h no galpão"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Justificativa Operacional / Finalidade *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  placeholder="Descreva por que o material é necessário e onde será aplicado..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tabela Dinâmica de Itens da Requisição */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Itens a Requisitar ({itensSolicitados.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={adicionarLinhaItem}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {itensSolicitados.map((item, idx) => {
                    const matObj = materiais.find(m => String(m.id) === item.material_id);
                    const estoqueInsuficiente = matObj && matObj.estoque_atual < item.quantidade_solicitada;

                    return (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                            Material #{idx + 1}
                          </label>
                          <select
                            required
                            value={item.material_id}
                            onChange={(e) => atualizarItem(idx, 'material_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                          >
                            <option value="">-- Selecione o Material --</option>
                            {materiais.map((m) => (
                              <option key={m.id} value={String(m.id)}>
                                {m.codigo} - {m.nome} (Disponível: {m.estoque_atual} {m.unidade_medida})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28 shrink-0">
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                            Qtd. Solicitada
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantidade_solicitada}
                            onChange={(e) => atualizarItem(idx, 'quantidade_solicitada', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                            Aplicação / Obs
                          </label>
                          <input
                            type="text"
                            value={item.observacoes}
                            onChange={(e) => atualizarItem(idx, 'observacoes', e.target.value)}
                            placeholder="Ex: Sala 04 / Bancada"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                          />
                        </div>

                        <div className="sm:self-end pt-1">
                          <button
                            type="button"
                            onClick={() => removerLinhaItem(idx)}
                            disabled={itensSolicitados.length <= 1}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                            title="Remover este item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={fecharModalNova}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>{salvando ? 'Emitindo...' : 'Emitir Requisição'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização & Impressão da Requisição */}
      <RequisicaoPrintModal
        requisicao={requisicaoSelecionada}
        config={config}
        onClose={() => setRequisicaoSelecionada(null)}
        onAtender={handleAtenderRequisicao}
        atendendo={atendendo}
      />
    </div>
  );
};
