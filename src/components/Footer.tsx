import React from 'react';
import { UserCheck, Database, Calendar, ShieldCheck } from 'lucide-react';
import { Configuracoes } from '../types';

interface FooterProps {
  config: Configuracoes | null;
  onOpenSetup: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onOpenSetup }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Identificação Técnica Obrigatória */}
          <div className="flex items-center gap-2 text-slate-300 text-center sm:text-left">
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-slate-400">Aluno Responsável Técnico: </span>
              <strong className="text-emerald-300 font-semibold">
                {config?.aluno_responsavel || 'Laura Lavínia'}
              </strong>
              {config?.matricula_aluno && (
                <span className="text-slate-400 ml-1">
                  | Matrícula: <span className="text-slate-200">{config.matricula_aluno}</span>
                </span>
              )}
              {config?.curso_instituicao && (
                <span className="text-slate-400 ml-1 hidden lg:inline">
                  • {config.curso_instituicao}
                </span>
              )}
            </div>
          </div>

          {/* Status do Banco e Stack */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span>Banco Relacional: <strong className="text-slate-200">SQLite 3 (Wasm/File)</strong></span>
            </div>

            <button
              onClick={onOpenSetup}
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Guia de Execução Local & Schema</span>
            </button>

            <div className="flex items-center gap-1 text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{currentYear}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
