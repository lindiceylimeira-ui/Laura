import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Package, 
  ArrowLeftRight, 
  FileText, 
  FileSpreadsheet, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardKPIs } from './components/DashboardKPIs';
import { MateriaisList } from './components/MateriaisList';
import { MovimentacoesView } from './components/MovimentacoesView';
import { RequisicoesView } from './components/RequisicoesView';
import { RelatorioEstoque } from './components/RelatorioEstoque';
import { ConfigModal } from './components/ConfigModal';
import { SetupModal } from './components/SetupModal';
import { Material, Movimentacao, Requisicao, Indicadores, Configuracoes } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'materiais' | 'movimentacoes' | 'requisicoes' | 'relatorios'>('dashboard');
  
  // Dados do backend SQLite
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais de Controle
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  // Gatilhos de Ação Rápida
  const [quickMovTipo, setQuickMovTipo] = useState<'ENTRADA' | 'SAIDA' | null>(null);
  const [quickMovMatId, setQuickMovMatId] = useState<number | null>(null);
  const [openMovModalDirectly, setOpenMovModalDirectly] = useState(false);
  const [openReqModalDirectly, setOpenReqModalDirectly] = useState(false);

  const carregarTodosDados = useCallback(async () => {
    try {
      setError(null);
      const [cfgRes, indRes, matRes, movRes, reqRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/indicadores'),
        fetch('/api/materiais'),
        fetch('/api/movimentacoes'),
        fetch('/api/requisicoes'),
      ]);

      if (!cfgRes.ok || !indRes.ok || !matRes.ok || !movRes.ok || !reqRes.ok) {
        throw new Error('Falha ao comunicar com os serviços da API SQLite');
      }

      const [cfgData, indData, matData, movData, reqData] = await Promise.all([
        cfgRes.json(),
        indRes.json(),
        matRes.json(),
        movRes.json(),
        reqRes.json(),
      ]);

      setConfig(cfgData);
      setIndicadores(indData);
      setMateriais(matData);
      setMovimentacoes(movData);
      setRequisicoes(reqData);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados do banco de dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarTodosDados();
  }, [carregarTodosDados]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarTodosDados();
  };

  const handleSaveConfig = async (newConfig: Configuracoes) => {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar configurações');
    }
    await carregarTodosDados();
  };

  const handleResetDatabase = async () => {
    const res = await fetch('/api/database/reset', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao resetar banco');
    }
    await carregarTodosDados();
  };

  const handleOpenNovaMovimentacao = (tipo: 'ENTRADA' | 'SAIDA' = 'ENTRADA', matId?: number) => {
    setQuickMovTipo(tipo);
    setQuickMovMatId(matId || null);
    setOpenMovModalDirectly(true);
    setActiveTab('movimentacoes');
  };

  const handleOpenNovaRequisicao = () => {
    setOpenReqModalDirectly(true);
    setActiveTab('requisicoes');
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel & Indicadores', icon: BarChart3 },
    { id: 'materiais', label: 'Gestão de Materiais', icon: Package },
    { id: 'movimentacoes', label: 'Entradas e Saídas', icon: ArrowLeftRight },
    { id: 'requisicoes', label: 'Requisições', icon: FileText, badge: indicadores?.requisicoes_pendentes ? `${indicadores.requisicoes_pendentes} pendente(s)` : undefined },
    { id: 'relatorios', label: 'Relatórios de Estoque', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Cabeçalho com Identificação do Responsável Técnico */}
      <Header
        config={config}
        onOpenConfig={() => setConfigModalOpen(true)}
        onOpenSetup={() => setSetupModalOpen(true)}
        onRefreshData={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Navegação por Abas Principais (Oculta na Impressão via no-print) */}
      <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-20 z-20 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none" aria-label="Abas de Navegação">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-900 font-semibold rounded-lg text-xs"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="font-semibold text-sm text-slate-700">Conectando ao banco de dados SQLite...</p>
            <p className="text-xs text-slate-400 mt-1">Carregando catálogo de materiais e movimentações operacionais</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardKPIs
                indicadores={indicadores}
                materiais={materiais}
                onNavigate={(tab) => setActiveTab(tab as any)}
                onOpenNovaMovimentacao={(tipo) => handleOpenNovaMovimentacao(tipo)}
                onOpenNovaRequisicao={handleOpenNovaRequisicao}
              />
            )}

            {activeTab === 'materiais' && (
              <MateriaisList
                materiais={materiais}
                onRefresh={carregarTodosDados}
                onOpenMovimentacao={(matId, tipo) => handleOpenNovaMovimentacao(tipo, matId)}
              />
            )}

            {activeTab === 'movimentacoes' && (
              <MovimentacoesView
                movimentacoes={movimentacoes}
                materiais={materiais}
                config={config}
                onRefresh={carregarTodosDados}
                initialMaterialId={quickMovMatId}
                initialTipo={quickMovTipo}
                isOpenModalDirectly={openMovModalDirectly}
                onCloseDirectModal={() => {
                  setOpenMovModalDirectly(false);
                  setQuickMovMatId(null);
                  setQuickMovTipo(null);
                }}
              />
            )}

            {activeTab === 'requisicoes' && (
              <RequisicoesView
                requisicoes={requisicoes}
                materiais={materiais}
                config={config}
                onRefresh={carregarTodosDados}
                isOpenNovaRequisicaoDirectly={openReqModalDirectly}
                onCloseDirectNovaRequisicao={() => setOpenReqModalDirectly(false)}
              />
            )}

            {activeTab === 'relatorios' && (
              <RelatorioEstoque
                config={config}
              />
            )}
          </>
        )}
      </main>

      {/* Rodapé Persistente em Todas as Telas com Identificação do Responsável Técnico */}
      <Footer
        config={config}
        onOpenSetup={() => setSetupModalOpen(true)}
      />

      {/* Modal de Configuração do Responsável Técnico */}
      <ConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      {/* Modal de Instruções de Setup & Schema SQL */}
      <SetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onResetDatabase={handleResetDatabase}
      />
    </div>
  );
}
