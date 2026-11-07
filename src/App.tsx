import React, { useState, useMemo, useEffect } from 'react';
import { DataSource, FilterState } from './types/audit';
import {
  getInitialEmbeddedRecords,
  deduplicateRecords,
  filterRecords,
  computeStats,
  computeItemStats,
  computeTechnicianSummaries,
  computeSupervisorSummaries,
} from './utils/auditEngine';
import { exportFilteredToExcel, generateStandaloneHtml } from './utils/standaloneExport';
import { SEBRATEL_BG_BASE64 } from './data/sebratelBgBase64';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { InteractiveChartsSection } from './components/InteractiveChartsSection';
import { OverviewTab } from './components/OverviewTab';
import { TechniciansTab } from './components/TechniciansTab';
import { SupervisorsTab } from './components/SupervisorsTab';
import { ItemsTab } from './components/ItemsTab';
import { ProtocolsTab } from './components/ProtocolsTab';
import { LoginModal } from './components/LoginModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import { GeminiModal } from './components/GeminiModal';
import { LayoutDashboard, Users, Shield, ListChecks, FileSpreadsheet, UploadCloud, Trash2, RefreshCw } from 'lucide-react';
import {
  isRealtimeDbConfigured,
  syncSourceToRealtimeDb,
  deleteSourceFromRealtimeDb,
  loadSourcesFromRealtimeDb,
  subscribeToRealtimeDbSources,
} from './services/realtimeDb';
import {
  isFirebaseConfigured,
  syncSourceToFirestore,
  deleteSourceFromFirestore,
  loadSourcesFromFirestore,
} from './services/firebase';

const INITIAL_FILTERS: FilterState = {
  month: '',
  base: '',
  supervisor: '',
  auditor: '',
  technician: '',
  sourceType: '',
  status: 'all',
  search: '',
};

export default function App() {
  // Admin auth state (persisted)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('fttx_admin_auth') === 'guiomar.ost';
  });

  // Background opacity state (persisted)
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('fttx_bg_opacity');
    return saved ? parseFloat(saved) : 0.35;
  });

  const handleSetBgOpacity = (val: number) => {
    setBgOpacity(val);
    localStorage.setItem('fttx_bg_opacity', val.toString());
  };

  // Active Data Sources (initialized with embedded records and synced with server database)
  const [sources, setSources] = useState<DataSource[]>(() => {
    const initialRows = getInitialEmbeddedRecords();
    return [
      {
        id: 1,
        name: 'Base Oficial Sebratel (Online + Offline)',
        kind: 'Embutido',
        type: 'Online',
        rows: initialRows,
        loadedAt: 'Oficial',
      },
    ];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with Server Database on mount and every 30 seconds
  const fetchServerSources = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sources) && data.sources.length > 0) {
          setSources(data.sources);
        }
      }
    } catch (err) {
      console.warn('Could not sync sources with server:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. If Firebase Realtime Database is configured, listen to live WebSocket changes
    let unsubscribeRtdb: (() => void) | null = null;
    if (isRealtimeDbConfigured) {
      unsubscribeRtdb = subscribeToRealtimeDbSources((liveSources) => {
        if (liveSources && liveSources.length > 0) {
          setSources(liveSources);
        }
      });
    }

    // 2. Fetch from Firestore if configured
    if (isFirebaseConfigured && !isRealtimeDbConfigured) {
      loadSourcesFromFirestore().then((firestoreSources) => {
        if (firestoreSources && firestoreSources.length > 0) {
          setSources(firestoreSources);
        }
      });
    }

    // 3. Sync with Server Database on mount and every 30 seconds
    fetchServerSources();
    const interval = setInterval(fetchServerSources, 30000);

    return () => {
      clearInterval(interval);
      if (unsubscribeRtdb) unsubscribeRtdb();
    };
  }, []);

  // Filters State
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'techs' | 'supervisors' | 'items' | 'protocols'>('overview');

  // Modals State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [geminiTarget, setGeminiTarget] = useState<{
    type: 'technician' | 'supervisor';
    name: string;
    metrics: any;
  } | null>(null);

  // Auth handlers
  const handleLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('fttx_admin_auth', 'guiomar.ost');
    setIsLoginModalOpen(false);
    setIsSourcesModalOpen(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('fttx_admin_auth');
  };

  const handleOpenSources = () => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
    } else {
      setIsSourcesModalOpen(true);
    }
  };

  // Data Sources Handlers (Persisted to Cloud Firebase and Server Database for All Users)
  const handleAddSource = async (newSource: DataSource) => {
    if (!isAdmin) return;
    setSources((prev) => [newSource, ...prev.filter((s) => s.id !== newSource.id)]);

    // 1. Persist to Firebase Realtime Database
    if (isRealtimeDbConfigured) {
      syncSourceToRealtimeDb(newSource);
    }
    // 2. Persist to Firebase Firestore
    if (isFirebaseConfigured) {
      syncSourceToFirestore(newSource);
    }
    // 3. Persist to Server REST API
    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': '123',
        },
        body: JSON.stringify({ source: newSource, adminPassword: '123' }),
      });
    } catch (err) {
      console.warn('Backend sync:', err);
    }
  };

  const handleRemoveSource = async (id: number) => {
    if (!isAdmin) return;
    setSources((prev) => prev.filter((s) => s.id !== id));

    // 1. Delete from Firebase Realtime Database
    if (isRealtimeDbConfigured) {
      deleteSourceFromRealtimeDb(id);
    }
    // 2. Delete from Firebase Firestore
    if (isFirebaseConfigured) {
      deleteSourceFromFirestore(id);
    }
    // 3. Delete from Server REST API
    try {
      await fetch(`/api/sources/${id}?adminPassword=123`, {
        method: 'DELETE',
        headers: { 'x-admin-password': '123' },
      });
    } catch (err) {
      console.warn('Backend delete:', err);
    }
  };

  const handleResetSources = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/sources/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': '123',
        },
        body: JSON.stringify({ adminPassword: '123' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sources) setSources(data.sources);
      }
    } catch (err) {
      console.error('Erro ao restaurar fontes no servidor:', err);
    }
  };

  // Computations
  const allRecords = useMemo(() => {
    return deduplicateRecords(sources);
  }, [sources]);

  const filteredRecords = useMemo(() => {
    return filterRecords(allRecords, filters);
  }, [allRecords, filters]);

  const stats = useMemo(() => {
    return computeStats(filteredRecords);
  }, [filteredRecords]);

  const itemStats = useMemo(() => {
    return computeItemStats(filteredRecords);
  }, [filteredRecords]);

  const technicians = useMemo(() => {
    return computeTechnicianSummaries(filteredRecords);
  }, [filteredRecords]);

  const supervisors = useMemo(() => {
    return computeSupervisorSummaries(filteredRecords);
  }, [filteredRecords]);

  // Online & Offline Item Stats
  const onlineStats = useMemo(() => {
    const list = filteredRecords.filter((r) => r.src === 'Online');
    let ok = 0;
    let nc = 0;
    list.forEach((r) => {
      ok += r.cOk;
      nc += r.cNc;
    });
    const total = ok + nc;
    const pctOk = total > 0 ? (ok / total) * 100 : 0;
    return { audits: list.length, ok, nc, pctOk };
  }, [filteredRecords]);

  const offlineStats = useMemo(() => {
    const list = filteredRecords.filter((r) => r.src === 'Offline');
    let ok = 0;
    let nc = 0;
    list.forEach((r) => {
      ok += r.cOk;
      nc += r.cNc;
    });
    const total = ok + nc;
    const pctOk = total > 0 ? (ok / total) * 100 : 0;
    return { audits: list.length, ok, nc, pctOk };
  }, [filteredRecords]);

  // Unique filter option lists
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.ym) set.add(r.ym);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const availableBases = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.base) set.add(r.base);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const availableSupervisors = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.sup) set.add(r.sup);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const availableTechnicians = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.tech) set.add(r.tech);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const availableAuditors = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.aud) set.add(r.aud);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  // Standalone Export
  const handleDownloadStandalone = () => {
    const htmlContent = generateStandaloneHtml(sources);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_FTTx_Sebratel_Completo_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel Export
  const handleExportExcel = () => {
    exportFilteredToExcel(
      filteredRecords,
      `Auditoria_FTTx_Sebratel_${filters.month || 'Geral'}.xlsx`
    );
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Image Asset with Dynamic Opacity */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-300"
        style={{
          backgroundImage: `url('${SEBRATEL_BG_BASE64}')`,
        }}
      />
      {/* Dark frosted glass overlay */}
      <div
        className="fixed inset-0 z-0 bg-slate-950 pointer-events-none transition-opacity duration-300"
        style={{ opacity: 1 - bgOpacity }}
      />

      {/* Main Content Layers */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          isAdmin={isAdmin}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenSources={handleOpenSources}
          onExportExcel={handleExportExcel}
          onDownloadStandalone={handleDownloadStandalone}
          bgOpacity={bgOpacity}
          onChangeBgOpacity={handleSetBgOpacity}
          totalRecordsCount={allRecords.length}
        />

        {/* Admin Quick Action Banner */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-extrabold text-amber-300">
                  Painel do Administrador (guiomar.ost):
                </span>
                <span className="text-slate-300 hidden md:inline">
                  Alterações em planilhas são salvas no banco de dados central e ficam imediatamente disponíveis para todos os usuários.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenSources}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Importar Planilha (Excel / Drive)</span>
                </button>
                <button
                  onClick={handleOpenSources}
                  className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Planilhas</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          {/* Filters Bar with Technician Filter */}
          <FiltersBar
            filters={filters}
            onChangeFilters={setFilters}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
            availableMonths={availableMonths}
            availableBases={availableBases}
            availableSupervisors={availableSupervisors}
            availableTechnicians={availableTechnicians}
            availableAuditors={availableAuditors}
            matchedCount={filteredRecords.length}
            totalCount={allRecords.length}
          />

          {/* Interactive Charts & Dynamic KPI Indicators Section (Below Filter/Search) */}
          <InteractiveChartsSection
            stats={stats}
            items={itemStats}
            technicians={technicians}
            supervisors={supervisors}
            onlineStats={onlineStats}
            offlineStats={offlineStats}
          />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Resumo Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('techs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'techs'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Técnicos ({technicians.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('supervisors')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'supervisors'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Supervisores ({supervisors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'items'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Itens Auditados ({itemStats.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('protocols')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'protocols'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Protocolos Detalhados ({filteredRecords.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeTab === 'overview' && (
            <OverviewTab records={filteredRecords} stats={stats} items={itemStats} />
          )}

          {activeTab === 'techs' && (
            <TechniciansTab
              technicians={technicians}
              onAnalyzeTech={(tech) =>
                setGeminiTarget({
                  type: 'technician',
                  name: tech.name,
                  metrics: {
                    cOk: tech.cOk,
                    cNc: tech.cNc,
                    pctOk: tech.pctOk,
                    ratioNcOk: tech.ratioNcOk,
                    audits: tech.audits,
                    regRate: tech.regRate,
                    topNc: tech.topNc,
                    base: tech.base,
                    sup: tech.sup,
                  },
                })
              }
            />
          )}

          {activeTab === 'supervisors' && (
            <SupervisorsTab
              supervisors={supervisors}
              onAnalyzeSupervisor={(sup) =>
                setGeminiTarget({
                  type: 'supervisor',
                  name: sup.name,
                  metrics: {
                    cOk: sup.cOk,
                    cNc: sup.cNc,
                    pctOk: sup.pctOk,
                    ratioNcOk: sup.ratioNcOk,
                    audits: sup.audits,
                    topNc: sup.topNc,
                    base: sup.base,
                    techniciansCount: sup.techniciansCount,
                  },
                })
              }
            />
          )}

          {activeTab === 'items' && <ItemsTab items={itemStats} />}

          {activeTab === 'protocols' && <ProtocolsTab records={filteredRecords} />}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
            <span>© 2026 Sebratel Telecom • A Conexão a Gente Garante</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400/90 font-medium">GPTW Certificada Jun 2026 - Jun 2027</span>
              <span>•</span>
              <span>Qualidade Técnica FTTx</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Data Sources Modal (Admin Protected) */}
      <DataSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        isAdmin={isAdmin}
        onRequireLogin={() => {
          setIsSourcesModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        sources={sources}
        onAddSource={handleAddSource}
        onRemoveSource={handleRemoveSource}
        onResetSources={handleResetSources}
      />

      {/* Gemini AI Modal */}
      {geminiTarget && (
        <GeminiModal
          isOpen={true}
          onClose={() => setGeminiTarget(null)}
          type={geminiTarget.type}
          targetName={geminiTarget.name}
          targetMetrics={geminiTarget.metrics}
        />
      )}
    </div>
  );
}
