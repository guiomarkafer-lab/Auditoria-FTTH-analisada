import React, { useState } from 'react';
import { TechSummary } from '../types/audit';
import { formatPercent } from '../utils/auditEngine';
import { Search, Sparkles, AlertTriangle, ExternalLink, User, X, Percent, CheckCircle2, XCircle } from 'lucide-react';

interface TechniciansTabProps {
  technicians: TechSummary[];
  onAnalyzeTech: (tech: TechSummary) => void;
}

export const TechniciansTab: React.FC<TechniciansTabProps> = ({ technicians, onAnalyzeTech }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'pctOkDesc' | 'pctOkAsc' | 'ratioDesc' | 'cNcDesc' | 'audits'>('pctOkDesc');
  const [selectedTech, setSelectedTech] = useState<TechSummary | null>(null);

  const filtered = technicians.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.sup.toLowerCase().includes(search.toLowerCase()) ||
    t.base.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'pctOkDesc') return b.pctOk - a.pctOk || b.cOk - a.cOk;
    if (sortBy === 'pctOkAsc') return a.pctOk - b.pctOk || a.cOk - b.cOk;
    if (sortBy === 'ratioDesc') return b.ratioNcOk - a.ratioNcOk;
    if (sortBy === 'cNcDesc') return b.cNc - a.cNc;
    if (sortBy === 'audits') return b.audits - a.audits;
    return 0;
  });

  // Dynamic filter stats for active technicians
  const totalActiveTechs = technicians.length;
  const totalEvaluatedItems = technicians.reduce((acc, t) => acc + t.totalEvaluated, 0);
  const totalOkItems = technicians.reduce((acc, t) => acc + t.cOk, 0);
  const totalNcItems = technicians.reduce((acc, t) => acc + t.cNc, 0);
  const avgTechPctOk = totalEvaluatedItems > 0 ? (totalOkItems / totalEvaluatedItems) * 100 : 0;
  const avgRatio = totalOkItems > 0 ? (totalNcItems / totalOkItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Dynamic KPI Cards for Technicians */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Instaladores Ativos</div>
          <div className="text-2xl font-black text-white mt-1">{totalActiveTechs}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total de {totalEvaluatedItems.toLocaleString('pt-BR')} itens avaliados
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Conformidade Média de Itens</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatPercent(avgTechPctOk)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalOkItems.toLocaleString('pt-BR')} itens conformes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Irregulares × Regulares (Média)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{formatPercent(avgRatio)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalNcItems.toLocaleString('pt-BR')} itens não conformes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Status de Qualidade</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {technicians.filter((t) => t.pctOk >= 95).length} Excelente
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {technicians.filter((t) => t.pctOk >= 85 && t.pctOk < 95).length} Atenção
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              {technicians.filter((t) => t.pctOk < 85).length} Crítico
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Distribuição baseada em itens conformes</div>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar instalador por nome, supervisor ou base..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="pctOkDesc">Maior % Conforme (Melhores)</option>
            <option value="pctOkAsc">Menor % Conforme (Críticos)</option>
            <option value="ratioDesc">Maior Razão Irregulares × Regulares</option>
            <option value="cNcDesc">Mais Itens Não Conformes</option>
            <option value="audits">Mais Auditorias</option>
          </select>
        </div>
      </div>

      {/* Technicians Table */}
      <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-3 px-4">Instalador</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Base</th>
                <th className="py-3 px-4 text-center">Itens OK (Qtd / %)</th>
                <th className="py-3 px-4 text-center">Itens NC (Qtd / %)</th>
                <th className="py-3 px-4 text-center">Irregulares × Regulares</th>
                <th className="py-3 px-4 text-center">Auditorias</th>
                <th className="py-3 px-4 text-center">Classificação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map((t) => {
                const isCrit = t.pctOk < 85;
                const isAttn = t.pctOk >= 85 && t.pctOk < 92;
                const isGood = t.pctOk >= 92 && t.pctOk < 96;
                const isExc = t.pctOk >= 96;

                return (
                  <tr key={t.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.sup}</td>
                    <td className="py-3 px-4 text-slate-400">{t.base}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-emerald-400">{t.cOk}</div>
                      <div className="text-[10px] text-slate-400">({formatPercent(t.pctOk)})</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-red-400">{t.cNc}</div>
                      <div className="text-[10px] text-slate-400">({formatPercent(t.pctNc)})</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {formatPercent(t.ratioNcOk)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300 font-mono">{t.audits}</td>
                    <td className="py-3 px-4 text-center">
                      {isExc && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Excelente</span>}
                      {isGood && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Bom</span>}
                      {isAttn && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Atenção</span>}
                      {isCrit && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">Crítico</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTech(t)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                        >
                          Histórico
                        </button>
                        <button
                          onClick={() => onAnalyzeTech(t)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>IA Gemini</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Technician Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-800 text-amber-400 border border-slate-700">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white">{selectedTech.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedTech.base}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Supervisor: {selectedTech.sup}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAnalyzeTech(selectedTech)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Análise com IA</span>
                </button>
                <button
                  onClick={() => setSelectedTech(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metric Highlights based on Items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-medium">Itens Conformes</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">{selectedTech.cOk}</div>
                  <div className="text-[11px] text-slate-400">{formatPercent(selectedTech.pctOk)} de conformidade</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-medium">Itens Não Conformes</div>
                  <div className="text-2xl font-black text-red-400 mt-0.5">{selectedTech.cNc}</div>
                  <div className="text-[11px] text-slate-400">{formatPercent(selectedTech.pctNc)} de falhas</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-medium">Irregulares × Regulares</div>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">
                    {formatPercent(selectedTech.ratioNcOk)}
                  </div>
                  <div className="text-[11px] text-slate-400">Proporção relativa</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-medium">Ordens / Não se Aplica</div>
                  <div className="text-2xl font-black text-slate-200 mt-0.5">{selectedTech.audits}</div>
                  <div className="text-[11px] text-slate-400">{selectedTech.cNa} itens N/A</div>
                </div>
              </div>

              {/* Top Failures of this Tech */}
              {selectedTech.topNc.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Itens com Desvio Recorrente
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTech.topNc.map((nc, idx) => (
                      <div
                        key={nc.item}
                        className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between"
                      >
                        <span className="text-slate-300 truncate pr-2">
                          <b className="text-slate-500 font-mono mr-1">{idx + 1}.</b> {nc.item}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-300">
                          {nc.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Records List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ordens de Serviço ({selectedTech.records.length})
                </h4>

                <div className="space-y-2.5">
                  {selectedTech.records.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border text-xs ${
                        r.cNc > 0
                          ? 'bg-red-950/20 border-red-900/40'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">OS: {r.p || 'Sem protocolo'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{r.d}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                            {r.src}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-mono font-semibold">{r.cOk} OK</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-red-400 font-mono font-semibold">{r.cNc} NC</span>
                        </div>
                      </div>

                      {Object.keys(r.nc).length > 0 && (
                        <div className="text-red-300 text-[11px] mb-1">
                          <b>Não conformidades:</b> {Object.keys(r.nc).join(', ')}
                        </div>
                      )}

                      {r.o && (
                        <p className="text-slate-400 text-[11px] italic mt-1 bg-slate-900/50 p-2 rounded border border-slate-800">
                          "{r.o}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                        <span>Auditor: {r.aud || 'Não informado'}</span>
                        {r.f && r.f.length > 0 && (
                          <div className="flex items-center gap-2">
                            {r.f.map((fId, fIdx) => (
                              <a
                                key={fId}
                                href={`https://drive.google.com/open?id=${fId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Foto {fIdx + 1}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
