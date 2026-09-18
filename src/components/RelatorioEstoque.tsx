import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Filter, 
  UserCheck, 
  Building, 
  Boxes, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { RelatorioEstoqueData, Configuracoes } from '../types';

interface RelatorioEstoqueProps {
  config: Configuracoes | null;
}

export const RelatorioEstoque: React.FC<RelatorioEstoqueProps> = ({ config }) => {
  const [dados, setDados] = useState<RelatorioEstoqueData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [categoria, setCategoria] = useState('TODAS');
  const [status, setStatus] = useState('TODOS');

  const carregarRelatorio = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (categoria !== 'TODAS') params.append('categoria', categoria);
      if (status !== 'TODOS') params.append('status', status);

      const res = await fetch(`/api/relatorios/posicao-estoque?${params.toString()}`);
      const json = await res.json();
      setDados(json);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();
  }, [categoria, status]);

  const handlePrint = () => {
    window.print();
  };

  const responsavelNome = dados?.responsavel_tecnico || config?.aluno_responsavel || 'Laura Lavínia';
  const responsavelMatricula = dados?.matricula_responsavel || config?.matricula_aluno || '2026.ENG.1048';
  const nomeAlmox = dados?.nome_almoxarifado || config?.nome_almoxarifado || 'Almoxarifado Central de Operações & Manutenção';
  const cursoInst = dados?.curso_instituicao || config?.curso_instituicao || 'Engenharia / Gestão Operacional';

  return (
    <div className="space-y-4">
      {/* Controles do Relatório (Ocultos na Impressão via no-print) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-heading">
              Relatório de Posição Atual dos Estoques
            </h2>
            <p className="text-xs text-slate-500">
              Posição consolidada de quantidades disponíveis, níveis de segurança e valores
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas as Categorias</option>
            <option value="EPI & Segurança">EPI & Segurança</option>
            <option value="Elétrica">Elétrica</option>
            <option value="Ferramentas & Mecânica">Ferramentas & Mecânica</option>
            <option value="Hidráulica">Hidráulica</option>
            <option value="Consumíveis & Química">Consumíveis & Química</option>
            <option value="Escritório & Adm">Escritório & Adm</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="CRITICO">Estoque Zerado</option>
            <option value="ALERTA">Abaixo do Mínimo</option>
            <option value="NORMAL">Nível Normal</option>
          </select>

          <button
            id="btn-imprimir-relatorio-estoque"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Relatório (PDF)</span>
          </button>
        </div>
      </div>

      {/* Cards com Totais Consolidados do Relatório */}
      {dados && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Itens Listados</span>
            <span className="text-xl font-bold text-slate-900 font-heading">{dados.totais.total_itens}</span>
            <span className="text-xs text-slate-400 ml-1">materiais</span>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Unidades</span>
            <span className="text-xl font-bold text-slate-900 font-heading">
              {dados.totais.total_unidades.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-400 ml-1">unidades</span>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor do Estoque</span>
            <span className="text-xl font-bold text-emerald-700 font-heading">
              R$ {dados.totais.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Itens em Alerta/Crítico</span>
            <span className="text-xl font-bold text-rose-600 font-heading">{dados.totais.itens_criticos}</span>
            <span className="text-xs text-slate-400 ml-1">atenção</span>
          </div>
        </div>
      )}

      {/* Folha do Relatório Oficial (Pronta para tela e para impressão A4) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-page">
        {/* Cabeçalho Oficial do Relatório com Identificação do Responsável Técnico (Requisito 5) */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                {nomeAlmox}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                RELATÓRIO DE POSIÇÃO ATUAL DOS ESTOQUES
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Inventário Físico, Quantidades Disponíveis e Margem de Segurança
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-500 block">Emissão:</span>
              <strong className="text-xs text-slate-800 font-mono">
                {new Date().toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* Destaque Obrigatório: Aluno Responsável Técnico */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>
                Aluno Responsável Técnico: <strong className="text-slate-950">{responsavelNome}</strong>
                {responsavelMatricula && ` | Matrícula: ${responsavelMatricula}`}
              </span>
            </div>
            <div>
              Instituição / Curso: <strong className="text-slate-900">{cursoInst}</strong>
            </div>
          </div>
        </div>

        {/* Tabela do Relatório */}
        {carregando ? (
          <div className="py-12 text-center text-slate-400">
            Carregando dados do relatório de estoque...
          </div>
        ) : !dados || dados.materiais.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            Nenhum material encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300 text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-900 text-left font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Descrição do Material</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Unid.</th>
                  <th className="py-2.5 px-3 text-center">Local</th>
                  <th className="py-2.5 px-3 text-center">Estoque Atual</th>
                  <th className="py-2.5 px-3 text-center">Estoque Mín.</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dados.materiais.map((m) => {
                  const isZero = m.estoque_atual <= 0;
                  const isLow = m.estoque_atual > 0 && m.estoque_atual <= m.estoque_minimo;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {m.codigo}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900">{m.nome}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{m.categoria}</td>
                      <td className="py-2 px-3 text-center uppercase font-semibold text-slate-500 whitespace-nowrap">
                        {m.unidade_medida}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 whitespace-nowrap">
                        {m.localizacao || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-extrabold text-sm whitespace-nowrap">
                        <span className={isZero ? 'text-rose-700' : isLow ? 'text-amber-700' : 'text-slate-900'}>
                          {m.estoque_atual}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 whitespace-nowrap">
                        {m.estoque_minimo}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          isZero 
                            ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {isZero ? 'ZERADO' : isLow ? 'REPOR' : 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        R$ {Number(m.preco_unitario || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        R$ {Number(m.valor_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase tracking-wider text-slate-900">
                    Totais Gerais do Estoque:
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-slate-950 font-black">
                    {dados.totais.total_unidades.toLocaleString('pt-BR')}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right uppercase text-slate-600">
                    Valor Total do Inventário:
                  </td>
                  <td className="py-3 px-3 text-right text-sm text-emerald-900 font-black font-mono">
                    R$ {dados.totais.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Rodapé Formal e Assinatura do Responsável Técnico (Requisito 5) */}
        <div className="pt-10 mt-8 border-t-2 border-slate-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              <p>Relatório gerado via Sistema de Controle de Estoque & Almoxarifado.</p>
              <p className="mt-0.5">Persistência relacional em banco de dados SQLite.</p>
            </div>

            <div className="text-center min-w-[280px]">
              <div className="border-b border-slate-900 pb-1 mb-1.5 h-8"></div>
              <p className="font-bold text-slate-900 text-xs">{responsavelNome}</p>
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Aluno Responsável Técnico
              </span>
              {responsavelMatricula && (
                <span className="text-[10px] text-slate-400 block font-mono">
                  Matrícula / R.A.: {responsavelMatricula}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
