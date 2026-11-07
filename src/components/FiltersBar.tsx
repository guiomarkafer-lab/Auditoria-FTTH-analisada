import React from 'react';
import { FilterState } from '../types/audit';
import { formatMonthLabel } from '../utils/auditEngine';
import { Search, RotateCcw, Filter, User } from 'lucide-react';

interface FiltersBarProps {
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableMonths: string[];
  availableBases: string[];
  availableSupervisors: string[];
  availableTechnicians: string[];
  availableAuditors: string[];
  matchedCount: number;
  totalCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  availableMonths,
  availableBases,
  availableSupervisors,
  availableTechnicians,
  availableAuditors,
  matchedCount,
  totalCount,
}) => {
  const updateField = (key: keyof FilterState, val: string) => {
    onChangeFilters({
      ...filters,
      [key]: val,
    });
  };

  const hasActiveFilters =
    filters.month ||
    filters.base ||
    filters.supervisor ||
    filters.technician ||
    filters.auditor ||
    filters.sourceType ||
    filters.status !== 'all' ||
    filters.search;

  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>Filtros Operacionais de Auditoria</span>
          <span className="text-[11px] font-normal text-slate-400 ml-1">
            Exibindo <b className="text-amber-400 font-bold">{matchedCount.toLocaleString('pt-BR')}</b> de{' '}
            {totalCount.toLocaleString('pt-BR')} ordens de serviço
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Month */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mês</label>
          <select
            value={filters.month}
            onChange={(e) => updateField('month', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Todos os meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Base */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Base</label>
          <select
            value={filters.base}
            onChange={(e) => updateField('base', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Todas as bases</option>
            {availableBases.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Supervisor */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Supervisor</label>
          <select
            value={filters.supervisor}
            onChange={(e) => updateField('supervisor', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Todos os supervisores</option>
            {availableSupervisors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Technician (New Requested Filter) */}
        <div>
          <label className="block text-[11px] font-semibold text-amber-300 mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-amber-400" />
            Técnico / Instalador
          </label>
          <select
            value={filters.technician}
            onChange={(e) => updateField('technician', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-amber-500/40 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Todos os técnicos</option>
            {availableTechnicians.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Auditor */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Auditor</label>
          <select
            value={filters.auditor}
            onChange={(e) => updateField('auditor', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Todos os auditores</option>
            {availableAuditors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Type Online / Offline */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Canal</label>
          <select
            value={filters.sourceType}
            onChange={(e) => updateField('sourceType', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Online + Offline</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Resultado</label>
          <select
            value={filters.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Todas as ordens</option>
            <option value="regular">Sem Não Conformidade</option>
            <option value="irregular">Com Não Conformidade</option>
          </select>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mt-3 relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateField('search', e.target.value)}
          placeholder="Pesquisar por instalador, protocolo, observação do auditor ou equipamento..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
    </div>
  );
};
