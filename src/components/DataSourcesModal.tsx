import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { DataSource } from '../types/audit';
import { parseCSV, detectType, buildRowsFromMatrix, getInitialEmbeddedRecords } from '../utils/auditEngine';
import { X, Upload, Trash2, RotateCcw, Link2, FileText, CheckCircle2, AlertTriangle, Loader2, Database, Download } from 'lucide-react';
import { downloadRealtimeDbJson } from '../services/realtimeDb';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onRequireLogin: () => void;
  sources: DataSource[];
  onAddSource: (newSource: DataSource) => void;
  onRemoveSource: (id: number) => void;
  onResetSources: () => void;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onRequireLogin,
  sources,
  onAddSource,
  onRemoveSource,
  onResetSources,
}) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const checkAdmin = () => {
    if (!isAdmin) {
      onRequireLogin();
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAdmin()) return;
    const files = e.target.files;
    if (!files || !files.length) return;

    setFileLoading(true);
    setFeedback(null);

    try {
      let addedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let matrix: string[][] = [];

        if (/\.xlsx?$/i.test(file.name)) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const sheetName = wb.SheetNames.find((x) => /respostas/i.test(x)) || wb.SheetNames[0];
          const sheet = wb.Sheets[sheetName];
          const csvText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
          matrix = parseCSV(csvText);
        } else {
          const text = await file.text();
          matrix = parseCSV(text);
        }

        if (!matrix.length) {
          throw new Error(`O arquivo ${file.name} está vazio.`);
        }

        const detected = detectType(matrix[0]);
        const type = (detected || 'Online') as 'Online' | 'Offline';
        const rows = buildRowsFromMatrix(type, matrix);

        if (!rows.length) {
          throw new Error(`Não foi possível extrair registros da planilha ${file.name}. Verifique os cabeçalhos de instalador e itens.`);
        }

        const newSource: DataSource = {
          id: Date.now() + i,
          name: file.name,
          kind: /\.xlsx?$/i.test(file.name) ? 'Arquivo Excel' : 'Arquivo CSV',
          type: type,
          rows: rows,
          loadedAt: new Date().toLocaleDateString('pt-BR'),
        };

        onAddSource(newSource);
        addedCount += rows.length;
      }

      setFeedback({
        type: 'success',
        message: `Sucesso! ${addedCount} novos registros importados das planilhas.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao processar arquivo local.',
      });
    } finally {
      setFileLoading(false);
      e.target.value = '';
    }
  };

  const handleDriveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAdmin()) return;
    if (!driveUrl.trim()) return;

    setDriveLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/drive/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: driveUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.csv) {
        throw new Error(data.error || 'Falha ao buscar planilha do Google Drive.');
      }

      const matrix = parseCSV(data.csv);
      if (!matrix.length) {
        throw new Error('A planilha retornada do Google Drive está vazia.');
      }

      const detected = detectType(matrix[0]);
      const type = (detected || 'Online') as 'Online' | 'Offline';
      const rows = buildRowsFromMatrix(type, matrix);

      if (!rows.length) {
        throw new Error('Não foram encontrados registros válidos na planilha do Google Drive.');
      }

      const newSource: DataSource = {
        id: Date.now(),
        name: `Google Drive (${data.sheetId.slice(0, 8)}...)`,
        kind: 'Google Drive',
        type: type,
        rows: rows,
        loadedAt: new Date().toLocaleDateString('pt-BR'),
      };

      onAddSource(newSource);
      setDriveUrl('');
      setFeedback({
        type: 'success',
        message: `Planilha do Google Drive importada com sucesso: ${rows.length} registros (${type}).`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao sincronizar com Google Drive.',
      });
    } finally {
      setDriveLoading(false);
    }
  };

  const handleRestore = () => {
    if (!checkAdmin()) return;
    if (confirm('Deseja restaurar as fontes para a base padrão original (2.813 registros)?')) {
      onResetSources();
      setFeedback({
        type: 'success',
        message: 'Base original embutida restaurada com sucesso!',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Fontes de Dados e Planilhas</h3>
              <p className="text-xs text-slate-400">Importação do Drive, arquivos locais e controle de arquivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-6 overflow-y-auto pr-1 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-300'
                  : 'bg-red-950/40 border border-red-600/40 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Upload Local File Section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                Importar Arquivo do Computador (.xlsx, .xls ou .csv)
              </h4>
              {!isAdmin && <span className="text-[11px] text-amber-400/90 font-medium">Requer Admin</span>}
            </div>

            <p className="text-xs text-slate-400">
              Faça upload de planilhas de respostas do formulário de auditoria. O sistema reconhece automaticamente os
              campos e itens técnicos.
            </p>

            <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl cursor-pointer bg-slate-900/40 transition-colors group">
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={fileLoading}
                className="hidden"
              />
              {fileLoading ? (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando planilha...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors mb-1.5" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    Clique para selecionar arquivo Excel ou CSV
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Suporta múltiplas planilhas simultâneas</span>
                </>
              )}
            </label>
          </div>

          {/* Google Drive Sheet Import */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-400" />
                Importar Planilha do Google Drive
              </h4>
              {!isAdmin && <span className="text-[11px] text-amber-400/90 font-medium">Requer Admin</span>}
            </div>

            <p className="text-xs text-slate-400">
              Cole o link compartilhado da planilha Google Sheets (ex:{' '}
              <code className="text-slate-300 font-mono text-[10px]">https://docs.google.com/spreadsheets/d/...</code>)
            </p>

            <form onSubmit={handleDriveImport} className="flex gap-2">
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="Cole o link da planilha do Google Drive..."
                disabled={driveLoading}
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={driveLoading || !driveUrl.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                {driveLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Conectar</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Data Sources List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Fontes de Dados Carregadas ({sources.length})</h4>
              <button
                onClick={handleRestore}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Base Inicial
              </button>
            </div>

            <div className="space-y-2">
              {sources.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-100 truncate">{s.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-amber-300 font-medium">{s.kind}</span>
                      <span>•</span>
                      <span>{s.rows.length.toLocaleString('pt-BR')} vistorias</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">
                        {s.type}
                      </span>
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir a planilha "${s.name}" e seus registros?`)) {
                          onRemoveSource(s.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 shadow-sm"
                      title="Excluir esta planilha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Planilha</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      Somente admin
                    </span>
                  )}
                </div>
              ))}
              {sources.length === 0 && (
                <div className="p-4 rounded-xl bg-slate-800/20 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                  Nenhuma planilha carregada no momento.{' '}
                  <button onClick={handleRestore} className="text-amber-400 underline font-semibold">
                    Restaurar base padrão
                  </button>{' '}
                  ou importe um novo arquivo acima.
                </div>
              )}
            </div>
          </div>

          {/* Firebase Realtime Database Export Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    Firebase Realtime Database (Exportação Pronta)
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono">
                      JSON Tree
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Gere o arquivo JSON formatado com todas as auditorias para importar com 1 clique no Console do Firebase (Realtime Database ➜ Importar JSON).
                  </p>
                </div>
              </div>

              <button
                onClick={() => downloadRealtimeDbJson(sources)}
                className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
                title="Baixar JSON estruturado para Firebase Realtime Database"
              >
                <Download className="w-4 h-4" />
                <span>Exportar JSON Firebase RTDB</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
