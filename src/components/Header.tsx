import React from 'react';
import { Package, UserCheck, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import { Configuracoes } from '../types';

interface HeaderProps {
  config: Configuracoes | null;
  onOpenConfig: () => void;
  onOpenSetup: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenConfig,
  onOpenSetup,
  onRefreshData,
  isRefreshing = false,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:h-20 gap-3">
          {/* Logo e Título do Sistema */}
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                  Almoxarifado & Estoque
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  SQLite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {config?.nome_almoxarifado || 'Sistema de Controle Operacional'}
              </p>
            </div>
          </div>

          {/* Destaque Obrigatório: Identificação do Aluno Responsável Técnico */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div 
              id="aluno-responsavel-header-badge"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs shadow-inner"
            >
              <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Responsável Técnico
                </span>
                <span className="font-semibold text-emerald-300">
                  {config?.aluno_responsavel || 'Laura Lavínia'}
                </span>
                {config?.matricula_aluno && (
                  <span className="text-[10px] text-slate-400 ml-1.5 hidden md:inline">
                    (R.A.: {config.matricula_aluno})
                  </span>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-1.5 nav-actions">
              <button
                id="btn-refresh-data"
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Recarregar dados"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              <button
                id="btn-open-config"
                onClick={onOpenConfig}
                title="Configurar Responsável Técnico"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Configurar</span>
              </button>

              <button
                id="btn-open-setup"
                onClick={onOpenSetup}
                title="Instruções de Setup & Schema SQL"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Setup / SQL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
