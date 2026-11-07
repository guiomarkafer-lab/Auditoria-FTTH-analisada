import React from 'react';
import { AuditStats, ItemStat, SupervisorSummary, TechSummary } from '../types/audit';
import { formatPercent } from '../utils/auditEngine';
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Shield,
  Activity,
  Layers,
  Percent,
} from 'lucide-react';

interface InteractiveChartsSectionProps {
  stats: AuditStats;
  items: ItemStat[];
  technicians: TechSummary[];
  supervisors: SupervisorSummary[];
  onlineStats: { audits: number; ok: number; nc: number; pctOk: number };
  offlineStats: { audits: number; ok: number; nc: number; pctOk: number };
}

export const InteractiveChartsSection: React.FC<InteractiveChartsSectionProps> = ({
  stats,
  items,
  technicians,
  supervisors,
  onlineStats,
  offlineStats,
}) => {
  // Top 6 failure items
  const topFailureItems = items.slice(0, 6);
  const maxFailures = topFailureItems.length > 0 ? Math.max(...topFailureItems.map((i) => i.nc), 1) : 1;

  // Best and worst technicians in active filters
  const bestTech = technicians.length > 0 ? technicians[0] : null;
  const criticalTechs = technicians.filter((t) => t.pctOk < 85);
  const worstTech = technicians.length > 0 ? [...technicians].sort((a, b) => a.pctOk - b.pctOk)[0] : null;

  // Average technician ratio of irregular to regular
  const avgTechRatio =
    technicians.length > 0
      ? technicians.reduce((acc, t) => acc + t.ratioNcOk, 0) / technicians.length
      : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Dynamic Summary Cards for Technicians and Supervisors that react to filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Itens Auditados & Conformidade */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Itens Auditados (Válidos)</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {stats.av.toLocaleString('pt-BR')}{' '}
            <span className="text-xs text-slate-400 font-normal">itens</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.ok.toLocaleString('pt-BR')} ({formatPercent(stats.pctOk)})
            </span>
            <span className="text-red-400 font-semibold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {stats.nc.toLocaleString('pt-BR')} ({formatPercent(stats.pctNc)})
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Não se aplica: <b className="text-slate-300">{stats.na.toLocaleString('pt-BR')}</b> (não entra na conta)
          </div>
        </div>

        {/* Card 2: Distribuição Geral de Itens (Conformes e Não Conformes substituindo Irregulares x Regulares) */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Distribuição Geral de Itens</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-2xl font-black text-cyan-300 flex items-baseline gap-1.5">
            <span>{formatPercent(stats.pctOk)}</span>
            <span className="text-xs font-semibold text-emerald-400">OK</span>
            <span className="text-slate-600">/</span>
            <span className="text-red-400 text-xl font-black">{formatPercent(stats.pctNc)}</span>
            <span className="text-xs font-semibold text-red-400">NC</span>
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {stats.ok.toLocaleString('pt-BR')} conformes • {stats.nc.toLocaleString('pt-BR')} não conformes
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>Não se Aplica (Informativo):</span>
            <b className="text-amber-300">{stats.na.toLocaleString('pt-BR')} itens</b>
          </div>
        </div>

        {/* Card 3: Indicador de Técnicos nos Filtros */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Técnicos no Filtro</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {technicians.length}{' '}
            <span className="text-xs text-slate-400 font-normal">instaladores</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 truncate">
            {bestTech ? (
              <span>
                Maior Conformidade: <b className="text-emerald-400">{bestTech.name.split(' ')[0]}</b> ({formatPercent(bestTech.pctOk)})
              </span>
            ) : (
              'Nenhum técnico'
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>Taxa Média de Irregulares:</span>
            <b className="text-amber-400">{formatPercent(avgTechRatio)}</b>
          </div>
        </div>

        {/* Card 4: Indicador de Supervisores nos Filtros */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Supervisores no Filtro</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {supervisors.length}{' '}
            <span className="text-xs text-slate-400 font-normal">equipes</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {criticalTechs.length > 0 ? (
              <span className="text-red-400 font-semibold">
                {criticalTechs.length} técnicos abaixo de 85%
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Equipes em conformidade</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>Supervisão Líder:</span>
            <b className="text-slate-200 truncate max-w-[130px]">
              {supervisors[0] ? supervisors[0].name.split(' ')[0] : '-'}
            </b>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Proporção Visual de Itens Conformes × Não Conformes */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Distribuição Geral de Itens
              </h4>
              <span className="text-[11px] font-mono text-slate-400">Total: {stats.av.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Conformes vs. Não Conformes (Não se aplica excluído da proporção)
            </p>

            {/* Visual Segmented Bar */}
            <div className="w-full h-6 bg-slate-800 rounded-lg overflow-hidden flex border border-slate-700/80 mb-3">
              <div
                className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.pctOk))}%` }}
                title={`Conformes: ${stats.ok} (${formatPercent(stats.pctOk)})`}
              >
                {stats.pctOk > 15 && formatPercent(stats.pctOk)}
              </div>
              <div
                className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.pctNc))}%` }}
                title={`Não Conformes: ${stats.nc} (${formatPercent(stats.pctNc)})`}
              >
                {stats.pctNc > 8 && formatPercent(stats.pctNc)}
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <span className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Itens Conformes (OK)
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {stats.ok.toLocaleString('pt-BR')}{' '}
                  <span className="text-[10px] font-normal text-emerald-500/90">({formatPercent(stats.pctOk)})</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/20 border border-red-500/20">
                <span className="flex items-center gap-2 text-red-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Itens Não Conformes (NC)
                </span>
                <span className="font-mono font-bold text-red-400">
                  {stats.nc.toLocaleString('pt-BR')}{' '}
                  <span className="text-[10px] font-normal text-red-400/90">({formatPercent(stats.pctNc)})</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Não se Aplica (N/A) [Informativo]
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {stats.na.toLocaleString('pt-BR')} itens
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Total Avaliado (OK + NC):</span>
            <b className="text-white font-mono">{stats.av.toLocaleString('pt-BR')} itens</b>
          </div>
        </div>

        {/* Chart 2: Top Não Conformidades (Gráfico de Barras) */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Top Itens Não Conformes
              </h4>
              <span className="text-[11px] font-mono text-red-400">Falhas: {stats.nc.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Itens com maior reincidência de não conformidade nos filtros atuais
            </p>

            <div className="space-y-2.5">
              {topFailureItems.map((item, idx) => {
                const barWidth = Math.round((item.nc / maxFailures) * 100);
                const shareOfTotalNc = stats.nc > 0 ? (item.nc / stats.nc) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 truncate pr-2">
                        <b className="text-slate-500 font-mono mr-1">{idx + 1}.</b>
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-red-400 shrink-0">
                        {item.nc.toLocaleString('pt-BR')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({formatPercent(shareOfTotalNc)})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Total de pilares com não conformidade: </span>
            <b className="text-slate-200">{items.filter((i) => i.nc > 0).length} itens</b>
          </div>
        </div>

        {/* Chart 3: Comparativo Gráfico de Canais (Online × Offline) & Supervisores */}
        <div className="p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                Canais & Equipes nos Filtros
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Itens conformes e proporções comparadas entre Online e Offline
            </p>

            {/* Online Channel Bar */}
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 mb-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">Canal Online</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatPercent(onlineStats.pctOk)} Conforme
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, onlineStats.pctOk))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{onlineStats.ok} conformes</span>
                <span className="text-red-400">{onlineStats.nc} não conformes</span>
              </div>
            </div>

            {/* Offline Channel Bar */}
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-400">Canal Offline</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatPercent(offlineStats.pctOk)} Conforme
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, offlineStats.pctOk))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{offlineStats.ok} conformes</span>
                <span className="text-red-400">{offlineStats.nc} não conformes</span>
              </div>
            </div>

            {/* Supervisores Mini-Bars */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300">Desempenho por Supervisão:</div>
              {supervisors.slice(0, 3).map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 truncate max-w-[130px]">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.cOk} OK / {s.cNc} NC
                    </span>
                    <span className="font-mono font-bold text-emerald-400 w-12 text-right">
                      {formatPercent(s.pctOk)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Ordens Online/Offline:</span>
            <b className="text-slate-200">
              {onlineStats.audits} On / {offlineStats.audits} Off
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};
