import React, { useState } from 'react';
import { AuditRecord } from '../types/audit';
import { ExternalLink, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface ProtocolsTabProps {
  records: AuditRecord[];
}

export const ProtocolsTab: React.FC<ProtocolsTabProps> = ({ records }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = records.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header and Pagination Sizer */}
      <div className="p-5 pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            Ordens de Serviço e Protocolos Auditados
          </h3>
          <p className="text-xs text-slate-400">
            Listagem analítica completa ({records.length.toLocaleString('pt-BR')} registros filtrados)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Exibir:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
              <th className="py-3 px-4">Protocolo / OS</th>
              <th className="py-3 px-4">Mês/Ano</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Instalador</th>
              <th className="py-3 px-4">Supervisor</th>
              <th className="py-3 px-4">Base</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Não Conformidades</th>
              <th className="py-3 px-4">Observação do Auditor</th>
              <th className="py-3 px-4 text-right">Fotos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentRecords.map((r, i) => {
              const ncKeys = Object.keys(r.nc);
              return (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {r.p || 'S/N'}
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{r.d || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {r.src}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-200">{r.tech}</td>
                  <td className="py-3 px-4 text-slate-300">{r.sup}</td>
                  <td className="py-3 px-4 text-slate-400">{r.base}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.irr
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {r.irr ? 'Irregular' : 'Regular'}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-red-300 truncate" title={ncKeys.join(', ')}>
                    {ncKeys.length > 0 ? ncKeys.join(', ') : <span className="text-slate-600">-</span>}
                  </td>
                  <td className="py-3 px-4 max-w-sm text-slate-400 truncate" title={r.o}>
                    {r.o || <span className="text-slate-600">-</span>}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {r.f && r.f.length > 0 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {r.f.map((fId, fIdx) => (
                          <a
                            key={fId}
                            href={`https://drive.google.com/open?id=${fId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-amber-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={`Abrir foto ${fIdx + 1} no Google Drive`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
        <div>
          Mostrando <b className="text-white">{startIndex + 1}</b> a{' '}
          <b className="text-white">{Math.min(startIndex + pageSize, records.length)}</b> de{' '}
          <b className="text-white">{records.length.toLocaleString('pt-BR')}</b>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
