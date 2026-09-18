import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight,
  Package,
  Layers,
  MapPin,
  X,
  Save
} from 'lucide-react';
import { Material } from '../types';

interface MateriaisListProps {
  materiais: Material[];
  onRefresh: () => void;
  onOpenMovimentacao: (materialId?: number, tipo?: 'ENTRADA' | 'SAIDA') => void;
}

export const MateriaisList: React.FC<MateriaisListProps> = ({
  materiais,
  onRefresh,
  onOpenMovimentacao,
}) => {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  
  // Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    categoria: 'EPI & Segurança',
    unidade_medida: 'UN',
    estoque_atual: 0,
    estoque_minimo: 10,
    localizacao: '',
    preco_unitario: 0,
  });
  const [salvando, setSalvando] = useState(false);

  // Extrair categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    materiais.forEach((m) => {
      if (m.categoria) cats.add(m.categoria);
    });
    return Array.from(cats);
  }, [materiais]);

  // Filtragem dos materiais
  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((m) => {
      const matchBusca = 
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        (m.descricao && m.descricao.toLowerCase().includes(busca.toLowerCase())) ||
        (m.localizacao && m.localizacao.toLowerCase().includes(busca.toLowerCase()));

      const matchCat = categoriaFiltro === 'TODAS' || m.categoria === categoriaFiltro;

      let matchStatus = true;
      if (statusFiltro === 'CRITICO') {
        matchStatus = m.estoque_atual <= 0;
      } else if (statusFiltro === 'ALERTA') {
        matchStatus = m.estoque_atual > 0 && m.estoque_atual <= m.estoque_minimo;
      } else if (statusFiltro === 'NORMAL') {
        matchStatus = m.estoque_atual > m.estoque_minimo;
      }

      return matchBusca && matchCat && matchStatus;
    });
  }, [materiais, busca, categoriaFiltro, statusFiltro]);

  const abrirModalNovo = () => {
    setMaterialEditando(null);
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      categoria: 'EPI & Segurança',
      unidade_medida: 'UN',
      estoque_atual: 0,
      estoque_minimo: 10,
      localizacao: '',
      preco_unitario: 0,
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (m: Material) => {
    setMaterialEditando(m);
    setFormData({
      codigo: m.codigo,
      nome: m.nome,
      descricao: m.descricao || '',
      categoria: m.categoria,
      unidade_medida: m.unidade_medida,
      estoque_atual: m.estoque_atual,
      estoque_minimo: m.estoque_minimo,
      localizacao: m.localizacao || '',
      preco_unitario: m.preco_unitario || 0,
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (materialEditando) {
        // Atualizar
        const res = await fetch(`/api/materiais/${materialEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao atualizar material');
      } else {
        // Criar novo
        const res = await fetch('/api/materiais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao cadastrar material');
      }
      setModalAberto(false);
      onRefresh();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: number, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o material "${nome}"?`)) {
      try {
        const res = await fetch(`/api/materiais/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao excluir material');
        onRefresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior com Busca, Filtros e Botão de Novo Material */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código, nome, descrição ou localização..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtros de Categoria e Status */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="CRITICO">Estoque Zerado</option>
            <option value="ALERTA">Abaixo do Mínimo</option>
            <option value="NORMAL">Nível Normal</option>
          </select>

          <button
            id="btn-cadastrar-material"
            onClick={abrirModalNovo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Material</span>
          </button>
        </div>
      </div>

      {/* Tabela de Materiais */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-xs sm:text-sm text-slate-800 font-heading">
              Catálogo de Materiais & Posição de Estoque
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Exibindo {materiaisFiltrados.length} de {materiais.length} materiais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr className="text-slate-600 text-left font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descrição do Material</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Unid.</th>
                <th className="py-3 px-4 text-center">Localização</th>
                <th className="py-3 px-4 text-center">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Estoque Mín.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum material encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                materiaisFiltrados.map((m) => {
                  const isZero = m.estoque_atual <= 0;
                  const isLow = m.estoque_atual > 0 && m.estoque_atual <= m.estoque_minimo;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {m.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.nome}</div>
                        {m.descricao && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{m.descricao}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {m.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-semibold uppercase whitespace-nowrap">
                        {m.unidade_medida}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                        {m.localizacao ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {m.localizacao}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`text-sm font-extrabold ${
                          isZero ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {m.estoque_atual}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{m.unidade_medida}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                        {m.estoque_minimo} {m.unidade_medida}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isZero 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isZero ? 'ESTOQUE ZERADO' : isLow ? 'ALERTA REPOSIÇÃO' : 'REGULAR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lançamento Rápido de Entrada */}
                          <button
                            onClick={() => onOpenMovimentacao(m.id, 'ENTRADA')}
                            title="Lançar Entrada para este material"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          </button>

                          {/* Lançamento Rápido de Saída */}
                          <button
                            onClick={() => onOpenMovimentacao(m.id, 'SAIDA')}
                            title="Lançar Saída para este material"
                            disabled={m.estoque_atual <= 0}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => abrirModalEditar(m)}
                            title="Editar cadastro do material"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleExcluir(m.id, m.nome)}
                            title="Excluir material"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Modal de Cadastro / Edição de Material */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>{materialEditando ? 'Editar Material' : 'Cadastrar Novo Material'}</span>
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Código / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!materialEditando}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: EPI-005"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Nome do Material *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Luva Nitrílica Descartável"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Descrição Detalhada / Aplicação
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Especificações técnicas, dimensões, norma..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    list="lista-categorias"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: EPI & Segurança"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="lista-categorias">
                    <option value="EPI & Segurança" />
                    <option value="Elétrica" />
                    <option value="Ferramentas & Mecânica" />
                    <option value="Hidráulica" />
                    <option value="Consumíveis & Química" />
                    <option value="Escritório & Adm" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Unidade de Medida *
                  </label>
                  <select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="PAR">PAR (Par)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="M">M (Metro)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="L">L (Litro)</option>
                    <option value="LT">LT (Lata)</option>
                    <option value="RL">RL (Rolo)</option>
                    <option value="BR">BR (Barra)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    {materialEditando ? 'Estoque Atual' : 'Estoque Inicial'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={!!materialEditando}
                    value={formData.estoque_atual}
                    onChange={(e) => setFormData({ ...formData, estoque_atual: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-bold"
                  />
                  {materialEditando && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Use movimentações para alterar o saldo</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Preço Unit. (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.preco_unitario}
                    onChange={(e) => setFormData({ ...formData, preco_unitario: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Localização Física no Almoxarifado
                </label>
                <input
                  type="text"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Prateleira B3, Gaveteiro 02"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{salvando ? 'Salvando...' : 'Salvar Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
