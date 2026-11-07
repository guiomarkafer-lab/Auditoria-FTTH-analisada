import React from 'react';
import { ItemStat } from '../types/audit';
import { formatPercent } from '../utils/auditEngine';
import { CheckCircle2, XCircle, MinusCircle, ListChecks } from 'lucide-react';

interface ItemsTabProps {
  items: ItemStat[];
}

export const ItemsTab: React.FC<ItemsTabProps> = ({ items }) => {
  return (
    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-5 pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-400" />
            Matriz de Itens Auditados: Conformes × Não Conformes
          </h3>
          <p className="text-xs text-slate-400">
            Valores consolidados de itens avaliados. O percentual considera itens Conformes e Não Conformes (Não se aplica é contabilizado à parte).
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
              <th className="py-3.5 px-4">Pilar Técnico</th>
              <th className="py-3.5 px-4 text-center">Conformes (OK)</th>
              <th className="py-3.5 px-4 text-center">Não Conformes (NC)</th>
              <th className="py-3.5 px-4 text-center">Irregulares × Regulares</th>
              <th className="py-3.5 px-4 text-center">Não se Aplica</th>
              <th className="py-3.5 px-4 text-center">Total Avaliado</th>
              <th className="py-3.5 px-4 text-center">Índice Conforme</th>
              <th className="py-3.5 px-4 pr-6 text-right">Proporção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item) => {
              const isGood = item.compRate >= 95;
              const isFair = item.compRate >= 90;

              return (
                <tr key={item.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {item.ok.toLocaleString('pt-BR')}{' '}
                      <span className="text-[10px] text-emerald-500 font-normal">({formatPercent(item.compRate)})</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-red-400 font-semibold">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      {item.nc.toLocaleString('pt-BR')}{' '}
                      <span className="text-[10px] text-red-400 font-normal">({formatPercent(item.ncRate)})</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                    {formatPercent(item.ratioNcOk)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">
                    <span className="inline-flex items-center gap-1">
                      <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
                      {item.na.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-300 font-medium font-mono">
                    {item.total.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                        isGood
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isFair
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {formatPercent(item.compRate)}
                    </span>
                  </td>
                  <td className="py-3 px-4 pr-6 text-right min-w-[140px]">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-emerald-500' : isFair ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, item.compRate))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
