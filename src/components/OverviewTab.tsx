import React from 'react';
import { AuditRecord, AuditStats, ItemStat } from '../types/audit';
import { computeMonthlyEvolution, formatPercent } from '../utils/auditEngine';
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle, Layers, Percent, MinusCircle } from 'lucide-react';

interface OverviewTabProps {
  records: AuditRecord[];
  stats: AuditStats;
  items: ItemStat[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ records, stats, items }) => {
  const monthlyEvolution = computeMonthlyEvolution(records);
  const topFailures = items.slice(0, 10);
  const maxFailureCount = topFailures.length > 0 ? Math.max(...topFailures.map((i) => i.nc), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Indicadores Principais de Itens Auditados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Itens Auditados (Avaliados) */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total de Itens Auditados</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white tracking-tight">
            {stats.av.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Itens avaliados (OK + NC)</span>
            <span className="text-slate-500">Total geral: {stats.totalItemsAll.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Quantidade e Percentual de Itens Conformes */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Itens Conformes</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatPercent(stats.pctOk)}
          </div>
          <div className="mt-2 text-xs text-slate-300">
            <b className="font-bold text-emerald-400">{stats.ok.toLocaleString('pt-BR')}</b> itens em conformidade
          </div>
        </div>

        {/* Quantidade e Percentual de Itens Não Conformes */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Itens Não Conformes</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-red-400 tracking-tight">
            {formatPercent(stats.pctNc)}
          </div>
          <div className="mt-2 text-xs text-slate-300">
            <b className="font-bold text-red-400">{stats.nc.toLocaleString('pt-BR')}</b> itens apontados com desvio
          </div>
        </div>

        {/* Distribuição Geral de Itens (Conforme e Não Conforme com Não se Aplica informativo) */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Distribuição Geral de Itens</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-300 tracking-tight flex items-baseline gap-2">
            <span>{formatPercent(stats.pctOk)}</span>
            <span className="text-xs font-semibold text-emerald-400">OK</span>
            <span className="text-slate-600">/</span>
            <span className="text-red-400 text-xl font-bold">{formatPercent(stats.pctNc)}</span>
            <span className="text-xs font-semibold text-red-400">NC</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
              Não se aplica: <b className="text-amber-300 ml-0.5">{stats.na.toLocaleString('pt-BR')} itens</b>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">(informativo)</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Top Failures and Monthly Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Failures Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Ranking de Não Conformidades por Item
              </h3>
              <p className="text-xs text-slate-400">Quantidade e % de falhas sobre o total avaliado de cada item</p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              {stats.nc} falhas totais
            </span>
          </div>

          <div className="space-y-3">
            {topFailures.map((item, index) => {
              const widthPct = Math.round((item.nc / maxFailureCount) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate pr-2">
                      <span className="text-slate-500 font-mono mr-1.5">{index + 1}.</span>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-emerald-400 text-[11px]">{item.ok} OK</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-red-400 font-bold">
                        {item.nc} NC ({formatPercent(item.ncRate)})
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Evolution Table */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Evolução Mensal da Qualidade
              </h3>
              <p className="text-xs text-slate-400">Total de ordens e índice de conformidade de itens</p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5">Mês</th>
                  <th className="pb-2.5">Ordens</th>
                  <th className="pb-2.5 text-center">Itens OK</th>
                  <th className="pb-2.5 text-center">Itens NC</th>
                  <th className="pb-2.5 text-right">% Conforme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthlyEvolution.map((m) => {
                  const isGood = m.compRate >= 92;
                  const isFair = m.compRate >= 85;
                  return (
                    <tr key={m.ym} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-bold text-slate-200">{m.label}</td>
                      <td className="py-2.5 text-slate-300 font-mono">{m.total}</td>
                      <td className="py-2.5 text-center text-emerald-400 font-mono">{m.okCount.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 text-center text-red-400 font-mono">{m.ncCount.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 text-right font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono ${
                            isGood
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isFair
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {formatPercent(m.compRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
