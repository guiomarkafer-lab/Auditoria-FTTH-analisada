import React from 'react';
import { Shield, ShieldAlert, Download, FileSpreadsheet, Lock, UploadCloud, Sliders } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSources: () => void;
  onExportExcel: () => void;
  onDownloadStandalone: () => void;
  bgOpacity: number;
  onChangeBgOpacity: (val: number) => void;
  totalRecordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onOpenLogin,
  onLogout,
  onOpenSources,
  onExportExcel,
  onDownloadStandalone,
  bgOpacity,
  onChangeBgOpacity,
  totalRecordsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center px-3 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-600/30 border border-red-500/40">
            <span className="font-black text-xs sm:text-sm tracking-wider">SEBRATEL</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base lg:text-lg text-white tracking-tight flex items-center gap-2">
                Auditoria FTTx Sebratel
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                GPON 2026
              </span>
            </div>
            <p className="text-xs text-amber-300/90 font-medium">
              Qualidade técnica em instalações: Online × Offline
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Background Opacity Adjuster */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Fundo:</span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={bgOpacity}
              onChange={(e) => onChangeBgOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 accent-amber-500 rounded-lg cursor-pointer bg-slate-700"
              title="Ajustar contraste da imagem de fundo Sebratel"
            />
          </div>

          {/* Manage Sources (Excel / Drive) */}
          <button
            onClick={onOpenSources}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isAdmin
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title={
              isAdmin
                ? 'Importar arquivos Excel (.xlsx / .csv), conectar ao Google Drive ou excluir planilhas'
                : 'Visualizar planilhas ativas. Somente o administrador guiomar.ost pode adicionar ou excluir arquivos.'
            }
          >
            {isAdmin ? (
              <UploadCloud className="w-4 h-4 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAdmin ? 'Importar / Gerenciar Planilhas' : 'Planilhas'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300 font-mono">
              {totalRecordsCount}
            </span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={onExportExcel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            title="Exportar planilha Excel (.xlsx) com filtros aplicados"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span> Excel
          </button>

          {/* Download Standalone HTML */}
          <button
            onClick={onDownloadStandalone}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            title="Baixar aplicativo completo em um arquivo HTML único para executar offline ou distribuir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar App (.html)</span>
          </button>

          {/* Auth Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3 h-3" />
                Admin: guiomar.ost
              </span>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
