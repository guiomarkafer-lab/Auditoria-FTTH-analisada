import React, { useState } from 'react';
import { SupervisorSummary } from '../types/audit';
import { formatPercent } from '../utils/auditEngine';
import { Users, Sparkles, AlertCircle, ChevronDown, ChevronUp, Shield, Percent, CheckCircle2, XCircle } from 'lucide-react';

interface SupervisorsTabProps {
  supervisors: SupervisorSummary[];
  onAnalyzeSupervisor: (sup: SupervisorSummary) => void;
}

export const SupervisorsTab: React.FC<SupervisorsTabProps> = ({ supervisors, onAnalyzeSupervisor }) => {
  const [expandedSup, setExpandedSup] = useState<string | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedSup(expandedSup === name ? null : name);
  };

  // Top dynamic summary stats across active supervisors
  const totalEquipes = supervisors.length;
  const totalEquipeEvaluated = supervisors.reduce((acc, s) => acc + s.totalEvaluated, 0);
  const totalEquipeOk = supervisors.reduce((acc, s) => acc + s.cOk, 0);
  const totalEquipeNc = supervisors.reduce((acc, s) => acc + s.cNc, 0);
  const avgEquipePctOk = totalEquipeEvaluated > 0 ? (totalEquipeOk / totalEquipeEvaluated) * 100 : 0;
  const avgEquipeRatio = totalEquipeOk > 0 ? (totalEquipeNc / totalEquipeOk) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Dynamic KPI Cards for Supervisors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Supervisões Ativas</div>
          <div className="text-2xl font-black text-white mt-1">{totalEquipes}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalEquipeEvaluated.toLocaleString('pt-BR')} itens auditados
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Conformidade Geral das Equipes</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatPercent(avgEquipePctOk)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalEquipeOk.toLocaleString('pt-BR')} itens conformes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Distribuição Geral das Equipes</div>
          <div className="text-xl font-black text-cyan-300 mt-1 flex items-baseline gap-1.5">
            <span>{formatPercent(avgEquipePctOk)}</span>
            <span className="text-xs font-semibold text-emerald-400">OK</span>
            <span className="text-slate-600">/</span>
            <span className="text-red-400 font-bold">{formatPercent(100 - avgEquipePctOk)}</span>
            <span className="text-xs font-semibold text-red-400">NC</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalEquipeOk.toLocaleString('pt-BR')} OK • {totalEquipeNc.toLocaleString('pt-BR')} NC
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Liderança em Conformidade</div>
          <div className="text-base font-bold text-white mt-1.5 truncate">
            {supervisors[0] ? supervisors[0].name : '-'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {supervisors[0] ? `${formatPercent(supervisors[0].pctOk)} de itens conformes` : ''}
          </div>
        </div>
      </div>

      {/* Supervisor Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {supervisors.map((s) => {
          const isExpanded = expandedSup === s.name;
          const isGood = s.pctOk >= 93;
          const isFair = s.pctOk >= 88;

          return (
            <div
              key={s.name}
              className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col"
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-slate-800/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white tracking-tight">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Base: <b className="text-slate-300">{s.base}</b></span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{s.techniciansCount} instaladores</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {formatPercent(s.pctOk)}
                    </div>
                    <div className="text-[10px] text-slate-400">conformidade de itens</div>
                  </div>
                </div>

                {/* Team KPIs - Itens Conformes, Não Conformes e Razão Irregulares × Regulares */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Itens Avaliados</div>
                    <div className="text-base font-bold text-white mt-0.5">{s.totalEvaluated}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Conformes (OK)</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{s.cOk}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="text-[10px] text-red-400 uppercase font-semibold">Não Conformes</div>
                    <div className="text-base font-bold text-red-400 mt-0.5">{s.cNc}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="text-[10px] text-red-400 uppercase font-semibold">NC (%)</div>
                    <div className="text-base font-bold text-red-400 mt-0.5">{formatPercent(s.pctNc)}</div>
                  </div>
                </div>

                {/* Top Team Issues */}
                {s.topNc.length > 0 && (
                  <div className="mt-3.5 text-xs text-slate-300 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Pontos de atenção recorrentes na equipe:
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {s.topNc.slice(0, 3).map((nc) => (
                        <span
                          key={nc.item}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700"
                        >
                          {nc.item} <b className="text-red-400 font-mono">({nc.count}x)</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-3.5 bg-slate-950/40 flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => toggleExpand(s.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isExpanded ? 'Ocultar Instaladores' : 'Ver Instaladores da Equipe'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onAnalyzeSupervisor(s)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Análise IA</span>
                </button>
              </div>

              {/* Expanded Technicians List */}
              {isExpanded && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 font-semibold mb-2 flex justify-between">
                    <span>Instalador ({s.technicians.length})</span>
                    <span>Conformidade de Itens / Irregulares × Regulares</span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {s.technicians.map((t) => (
                      <div
                        key={t.name}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-200">{t.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono text-[11px]">{t.cOk} OK / {t.cNc} NC</span>
                          <span
                            className={`font-mono font-bold ${
                              t.pctOk >= 93 ? 'text-emerald-400' : t.pctOk >= 85 ? 'text-amber-400' : 'text-red-400'
                            }`}
                          >
                            {formatPercent(t.pctOk)}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400/90">
                            ({formatPercent(t.ratioNcOk)} ratio)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
