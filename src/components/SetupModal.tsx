import React, { useState, useEffect } from 'react';
import { X, Database, Terminal, Copy, Check, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetDatabase: () => Promise<void>;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  onResetDatabase,
}) => {
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [setupInfo, setSetupInfo] = useState<{
    banco_de_dados: string;
    arquivo_banco: string;
    schema_sql: string;
    instrucoes_instalacao: string[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/setup-info')
        .then((res) => res.json())
        .then((data) => setSetupInfo(data))
        .catch((err) => console.error('Erro ao buscar setup info:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copySchema = () => {
    if (setupInfo?.schema_sql) {
      navigator.clipboard.writeText(setupInfo.schema_sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja reinicializar o banco de dados? Todos os dados atuais serão substituídos pelo catálogo e histórico inicial padrão de demonstração.')) {
      setResetting(true);
      try {
        await onResetDatabase();
        alert('Banco SQLite reinicializado com sucesso com os dados de demonstração!');
        onClose();
      } catch (err: any) {
        alert('Erro ao resetar: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="modal-setup-banco"
        className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-heading">
                Instruções de Setup & Banco de Dados Relacional
              </h2>
              <p className="text-xs text-slate-500">
                Arquitetura Full-Stack, persistência SQLite e comandos para rodar localmente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 py-4 space-y-6 text-sm flex-1">
          {/* Instruções de Instalação e Execução */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <span>Como rodar este projeto localmente:</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700">
              {setupInfo?.instrucoes_instalacao?.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="font-mono text-slate-900">{step}</span>
                </li>
              )) || (
                <>
                  <li>Execute <code className="bg-white px-1.5 py-0.5 rounded border">npm install</code> para instalar as dependências.</li>
                  <li>Inicie o backend e frontend com <code className="bg-white px-1.5 py-0.5 rounded border">npm run dev</code>.</li>
                  <li>Acesse no navegador: <code className="bg-white px-1.5 py-0.5 rounded border">http://localhost:3000</code>.</li>
                  <li>O banco relacional SQLite (<code className="bg-white px-1.5 py-0.5 rounded border">data/estoque.sqlite</code>) é gerado e populado automaticamente na primeira execução!</li>
                </>
              )}
            </ol>
          </div>

          {/* Dados Técnicos do Banco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <span className="font-semibold text-blue-900 block mb-1">Tecnologia do Banco:</span>
              <p className="text-blue-800">{setupInfo?.banco_de_dados || 'SQLite 3 Relacional (sql.js)'}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="font-semibold text-emerald-900 block mb-1">Persistência em Disco:</span>
              <p className="text-emerald-800 font-mono">{setupInfo?.arquivo_banco || 'data/estoque.sqlite'}</p>
            </div>
          </div>

          {/* Schema SQL Completo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Script de Inicialização SQL (DDL)</span>
              </h3>
              <button
                onClick={copySchema}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded bg-blue-50 border border-blue-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-56 border border-slate-800 shadow-inner">
              <pre>{setupInfo?.schema_sql || 'Carregando schema...'}</pre>
            </div>
          </div>

          {/* Ação de Reinicializar Banco */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-amber-900 text-xs uppercase tracking-wider">
                Restaurar Banco para Estado de Demonstração
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Deseja recriar as tabelas e carregar os dados iniciais do catálogo e movimentações?
              </p>
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors shrink-0 disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetando...' : 'Resetar Dados'}</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
