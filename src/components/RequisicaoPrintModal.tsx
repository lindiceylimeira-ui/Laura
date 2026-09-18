import React from 'react';
import { Printer, X, FileText, CheckCircle2, AlertTriangle, Building, Calendar, UserCheck } from 'lucide-react';
import { Requisicao, Configuracoes } from '../types';

interface RequisicaoPrintModalProps {
  requisicao: Requisicao | null;
  config: Configuracoes | null;
  onClose: () => void;
  onAtender?: (id: number) => Promise<void>;
  atendendo?: boolean;
}

export const RequisicaoPrintModal: React.FC<RequisicaoPrintModalProps> = ({
  requisicao,
  config,
  onClose,
  onAtender,
  atendendo = false,
}) => {
  if (!requisicao) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPendente = requisicao.status === 'PENDENTE';
  const isAtendida = requisicao.status === 'ATENDIDA';

  const responsavelNome = requisicao.responsavel_tecnico || config?.aluno_responsavel || 'Laura Lavínia';
  const responsavelMatricula = requisicao.matricula_responsavel || config?.matricula_aluno || '2026.ENG.1048';
  const nomeAlmox = requisicao.nome_almoxarifado || config?.nome_almoxarifado || 'Almoxarifado Central de Operações & Manutenção';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div 
        id="modal-impressao-requisicao"
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Barra Superior Interativa (Oculta na Impressão via CSS no-print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between no-print bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-heading">
                Visualização & Impressão de Requisição
              </h2>
              <span className="text-xs text-slate-500 font-mono font-semibold">
                {requisicao.numero}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPendente && onAtender && (
              <button
                id="btn-atender-modal"
                onClick={() => onAtender(requisicao.id)}
                disabled={atendendo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{atendendo ? 'Baixando Estoque...' : 'Atender & Baixar Estoque'}</span>
              </button>
            )}

            <button
              id="btn-imprimir-requisicao"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Folha Oficial da Requisição (Otimizada para Visualização e A4 Print) */}
        <div className="overflow-y-auto p-6 sm:p-10 text-slate-800 print-page bg-white space-y-6">
          {/* Cabeçalho Institucional Oficial */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  {nomeAlmox}
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
                  SOLICITAÇÃO DE MATERIAL / REQUISIÇÃO
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Documento de Movimentação e Rastreamento Operacional de Estoque
                </p>
              </div>

              <div className="text-right sm:shrink-0">
                <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-sm font-black text-slate-900">
                  {requisicao.numero}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Data: <strong className="text-slate-800">{requisicao.data_solicitacao}</strong>
                </div>
              </div>
            </div>

            {/* Destaque Obrigatório de Responsável Técnico no Cabeçalho */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  Aluno Responsável Técnico: <strong className="text-slate-950">{responsavelNome}</strong>
                  {responsavelMatricula && ` (R.A.: ${responsavelMatricula})`}
                </span>
              </div>
              <div>
                Status Atual: <strong className={`uppercase ${
                  isAtendida ? 'text-emerald-700' : isPendente ? 'text-amber-700' : 'text-slate-700'
                }`}>{requisicao.status}</strong>
              </div>
            </div>
          </div>

          {/* Dados do Solicitante e Justificativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px] tracking-wider">
                Solicitante / Requisitante
              </span>
              <p className="font-semibold text-sm text-slate-900">{requisicao.solicitante}</p>
            </div>

            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px] tracking-wider">
                Departamento / Setor de Aplicação
              </span>
              <p className="font-semibold text-sm text-slate-900">{requisicao.departamento}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-500 block uppercase font-bold text-[10px] tracking-wider">
                Justificativa Operacional / Finalidade da Aplicação
              </span>
              <p className="text-slate-800 text-xs mt-0.5 leading-relaxed">{requisicao.justificativa}</p>
            </div>

            {requisicao.data_atendimento && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200 text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Atendido em <strong>{requisicao.data_atendimento}</strong> por <strong>{requisicao.responsavel_atendimento || responsavelNome}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Tabela de Itens Requisitados */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Itens e Materiais Solicitados
            </h3>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100">
                  <tr className="text-slate-700 text-left font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">Item</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição do Material</th>
                    <th className="py-2.5 px-3 text-center">Unid.</th>
                    <th className="py-2.5 px-3 text-center">Qtd. Solicitada</th>
                    <th className="py-2.5 px-3 text-center">Qtd. Atendida</th>
                    <th className="py-2.5 px-3">Observação / Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requisicao.itens && requisicao.itens.length > 0 ? (
                    requisicao.itens.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {item.material_codigo}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.material_nome}</div>
                          {item.material_localizacao && (
                            <div className="text-[10px] text-slate-500">Loc.: {item.material_localizacao}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center uppercase font-semibold text-slate-600">
                          {item.material_unidade}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-sm text-slate-900">
                          {item.quantidade_solicitada}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-sm">
                          <span className={item.quantidade_atendida && item.quantidade_atendida > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {item.quantidade_atendida || 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.observacoes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        Nenhum item adicionado a esta requisição.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Área Formal de Assinaturas e Carimbos (Requisito 5) */}
          <div className="pt-8 mt-6 border-t-2 border-slate-300">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">
              Termo de Responsabilidade e Assinaturas Formais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              {/* Assinatura Solicitante */}
              <div>
                <div className="border-b border-slate-900 pb-1 mb-1.5 h-10 flex items-end justify-center"></div>
                <p className="font-bold text-slate-900">{requisicao.solicitante}</p>
                <span className="text-[10px] text-slate-500 block uppercase">Solicitante / Recebedor</span>
              </div>

              {/* Assinatura Almoxarife */}
              <div>
                <div className="border-b border-slate-900 pb-1 mb-1.5 h-10 flex items-end justify-center"></div>
                <p className="font-bold text-slate-900">Operador do Almoxarifado</p>
                <span className="text-[10px] text-slate-500 block uppercase">Conferência e Liberação</span>
              </div>

              {/* Assinatura Aluno Responsável Técnico */}
              <div>
                <div className="border-b border-slate-900 pb-1 mb-1.5 h-10 flex items-end justify-center"></div>
                <p className="font-bold text-emerald-800">{responsavelNome}</p>
                <span className="text-[10px] text-slate-600 block uppercase font-semibold">
                  Aluno Responsável Técnico
                </span>
                {responsavelMatricula && (
                  <span className="text-[9px] text-slate-400 block font-mono">
                    R.A.: {responsavelMatricula}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé Oficial da Folha */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
            Sistema de Controle de Estoques & Almoxarifado • Responsável Técnico: {responsavelNome} • Documento gerado em {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};
