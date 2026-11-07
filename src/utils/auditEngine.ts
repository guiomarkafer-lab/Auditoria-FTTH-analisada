import { AuditRecord, AuditStats, DataSource, FilterState, ItemStat, SupervisorSummary, TechSummary } from '../types/audit';
import rawEmbeddedData from '../data/embeddedData.json';

export const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function normalizeStr(s: any): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function nq(s: any): string {
  return normalizeStr(s).replace(/\?/g, '');
}

export function formatMonthLabel(ym: string): string {
  const parts = String(ym || '').split('-');
  if (parts.length > 1) {
    const monthNum = parseInt(parts[1], 10);
    const mName = MONTH_NAMES[monthNum - 1] || parts[1];
    return `${mName}/${parts[0]}`;
  }
  return ym || 'Sem data';
}

export function formatPercent(rate: number): string {
  if (isNaN(rate)) return '0,0%';
  return `${rate.toFixed(1).replace('.', ',')}%`;
}

// Unpack initial embedded data
export function getInitialEmbeddedRecords(): AuditRecord[] {
  const L = (rawEmbeddedData as any).lk;
  const rows = (rawEmbeddedData as any).rows;
  const list: AuditRecord[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const nc: Record<string, number> = {};
    const ok: Record<string, number> = {};
    const na: Record<string, number> = {};

    const ncIndices: number[] = r[7] || [];
    const okIndices: number[] = r[8] || [];
    const naIndices: number[] = r[9] || [];

    for (const i of ncIndices) {
      if (L.item[i]) nc[L.item[i]] = 1;
    }
    for (const i of okIndices) {
      if (L.item[i]) ok[L.item[i]] = 1;
    }
    for (const i of naIndices) {
      if (L.item[i]) na[L.item[i]] = 1;
    }

    list.push({
      src: r[0] ? 'Offline' : 'Online',
      ym: r[1] || '',
      base: L.base[r[2]] || 'OUTRA',
      sup: L.sup[r[3]] || 'OUTRO',
      aud: L.aud[r[4]] || '',
      tech: L.tech[r[5]] || '',
      irr: Boolean(r[6]),
      nc,
      ok,
      na,
      cNc: ncIndices.length,
      cOk: okIndices.length,
      cNa: naIndices.length,
      d: r[1] ? formatMonthLabel(r[1]) : 'Sem data',
      p: r[11] || '',
      o: r[12] || '',
      f: r[13] || [],
    });
  }

  return list;
}

export function parseCSV(t: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQ = false;
  const text = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQ = true;
      } else if (c === ',' || c === ';') {
        cur.push(field);
        field = '';
      } else if (c === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

export function detectType(H: string[]): 'Online' | 'Offline' | '' {
  const h = H.map(nq).join('|');
  if (h.indexOf('instalador / auxiliar') >= 0) return 'Offline';
  if (h.indexOf('colaborador com cracha') >= 0 || h.indexOf('coluna 8') >= 0 || h.indexOf('titularidade') >= 0) return 'Online';
  return '';
}

function cls2(v: string): 'nc' | 'na' | 'ok' | '' {
  const val = v || '';
  if (/n[aã]o conforme/i.test(val)) return 'nc';
  if (/se aplica/i.test(val)) return 'na';
  if (/conforme/i.test(val)) return 'ok';
  return '';
}

export function extractMonthYear(rawVal: any, rawMonthCol?: string): { ym: string; d: string } {
  let str = String(rawVal || '').trim();

  // 1. Check Excel serial number (e.g. 45480 or 45480.5)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const dt = new Date(Math.round((parseFloat(str) - 25569) * 86400000));
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = ('0' + (dt.getUTCMonth() + 1)).slice(-2);
      const ym = `${y}-${m}`;
      return { ym, d: formatMonthLabel(ym) };
    }
  }

  // 2. Check ISO or YYYY-MM
  const isoMatch = str.match(/(\d{4})[-/](\d{1,2})/);
  if (isoMatch && parseInt(isoMatch[1], 10) >= 2020 && parseInt(isoMatch[1], 10) <= 2035) {
    const ym = `${isoMatch[1]}-${('0' + parseInt(isoMatch[2], 10)).slice(-2)}`;
    return { ym, d: formatMonthLabel(ym) };
  }

  // 3. Check DD/MM/YYYY or DD/MM/YY
  const brMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (brMatch) {
    let y = brMatch[3];
    if (y.length === 2) y = '20' + y;
    const m = ('0' + parseInt(brMatch[2], 10)).slice(-2);
    const ym = `${y}-${m}`;
    return { ym, d: formatMonthLabel(ym) };
  }

  // 4. Check MM/YYYY
  const myMatch = str.match(/(\d{1,2})\/(\d{4})/);
  if (myMatch) {
    const ym = `${myMatch[2]}-${('0' + parseInt(myMatch[1], 10)).slice(-2)}`;
    return { ym, d: formatMonthLabel(ym) };
  }

  // 5. Check text month in rawMonthCol or in str
  const textToCheck = `${rawMonthCol || ''} ${str}`;
  const nText = normalizeStr(textToCheck);
  for (let idx = 0; idx < MONTH_NAMES.length; idx++) {
    if (nText.includes(MONTH_NAMES[idx])) {
      const yearMatch = str.match(/20\d{2}/) || (rawMonthCol || '').match(/20\d{2}/);
      const y = yearMatch ? yearMatch[0] : '2026';
      const m = ('0' + (idx + 1)).slice(-2);
      const ym = `${y}-${m}`;
      return { ym, d: formatMonthLabel(ym) };
    }
  }

  return { ym: '', d: 'Sem data' };
}

export function buildRowsFromMatrix(src: 'Online' | 'Offline', m: string[][]): AuditRecord[] {
  if (!m || m.length < 2) return [];
  const H = m[0];
  const h = H.map(nq);

  const findColIndex = (ks: string[]) => {
    for (let a = 0; a < ks.length; a++) {
      for (let i = 0; i < h.length; i++) {
        if (h[i].includes(ks[a])) return i;
      }
    }
    return -1;
  };

  const iT = findColIndex(['instalador', 'coluna 8', 'tecnico', 'colaborador', 'matricula']);
  const iS = findColIndex(['supervisor', 'lider', 'coord']);
  const iB = findColIndex(['base', 'cidade', 'polo', 'filial']);
  const iA = findColIndex(['responsavel', 'auditor', 'avaliador']);
  const iD = findColIndex(['carimbo', 'data e hora', 'data da', 'data', 'dt_']);
  const iI = findColIndex(['visita irregular', 'irregular']);
  const iM = findColIndex(['mes', 'competencia', 'periodo']);
  const iO = findColIndex(['observacao', 'obs', 'motivo', 'apontamento', 'detalhe']);
  const iF = findColIndex(['anexar', 'foto']);
  const iP = findColIndex(['protocolo', 'os', 'ordem']);

  if (iT < 0) return [];

  const getCell = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i] : '');
  const body = m.slice(1).filter((r) => getCell(r, iT).trim());

  const items: number[] = [];
  H.forEach((x, c) => {
    if (!x.trim() || /^(coluna|column)/.test(h[c])) return;
    let k = 0;
    body.forEach((r) => {
      const v = getCell(r, c);
      if (/conforme/i.test(v) || /se aplica/i.test(v)) k++;
    });
    if (body.length && (k >= 0.15 * body.length || k >= 5)) items.push(c);
  });

  return body.map((r) => {
    const rawDateVal = getCell(r, iD);
    const rawMonthVal = iM >= 0 ? getCell(r, iM) : '';
    const { ym, d } = extractMonthYear(rawDateVal, rawMonthVal);

    const nc: Record<string, number> = {};
    const ok: Record<string, number> = {};
    const na: Record<string, number> = {};
    let cn = 0;
    let co = 0;
    let ca = 0;

    items.forEach((c) => {
      const k = cls2(getCell(r, c));
      const nm = H[c].replace(/\?/g, '').trim();
      if (k === 'nc') {
        nc[nm] = 1;
        cn++;
      } else if (k === 'ok') {
        ok[nm] = 1;
        co++;
      } else if (k === 'na') {
        na[nm] = 1;
        ca++;
      }
    });

    let irr = cn > 0;
    if (iI >= 0 && getCell(r, iI).trim()) {
      irr = /^sim/i.test(nq(getCell(r, iI)));
    }

    const f: string[] = [];
    if (irr) {
      let mm: RegExpExecArray | null;
      const re = /id=([\w-]+)/g;
      const cellVal = getCell(r, iF);
      while ((mm = re.exec(cellVal))) {
        f.push(mm[1]);
      }
    }

    return {
      src,
      ym,
      base: getCell(r, iB).trim() || 'OUTRA',
      sup: getCell(r, iS).trim() || 'OUTRO',
      aud: getCell(r, iA).trim(),
      tech: getCell(r, iT).trim().toUpperCase(),
      irr,
      nc,
      ok,
      na,
      cNc: cn,
      cOk: co,
      cNa: ca,
      d, // Day never appears! Formatted as 'jul/2026', 'mai/2026', etc.
      p: getCell(r, iP).trim() || 'S/N',
      o: getCell(r, iO).replace(/\s+/g, ' ').trim(),
      f,
    };
  });
}

export function deduplicateRecords(sources: DataSource[]): AuditRecord[] {
  const seen: Record<string, boolean> = {};
  const out: AuditRecord[] = [];

  for (const s of sources) {
    for (const r of s.rows) {
      const key = [r.src, r.p, r.tech, r.d, r.aud, r.cNc, r.cOk, r.cNa, r.o, r.irr].join('|');
      if (!seen[key]) {
        seen[key] = true;
        out.push(r);
      }
    }
  }
  return out;
}

export function filterRecords(records: AuditRecord[], filters: FilterState): AuditRecord[] {
  return records.filter((r) => {
    if (filters.month && r.ym !== filters.month) return false;
    if (filters.base && r.base !== filters.base) return false;
    if (filters.supervisor && r.sup !== filters.supervisor) return false;
    if (filters.auditor && r.aud !== filters.auditor) return false;
    if (filters.technician && r.tech !== filters.technician) return false;
    if (filters.sourceType && r.src !== filters.sourceType) return false;
    if (filters.status === 'regular' && r.irr) return false;
    if (filters.status === 'irregular' && !r.irr) return false;
    if (filters.search) {
      const q = normalizeStr(filters.search);
      const target = normalizeStr(`${r.tech} ${r.sup} ${r.base} ${r.p} ${r.aud} ${r.o}`);
      if (!target.includes(q)) return false;
    }
    return true;
  });
}

export function computeStats(records: AuditRecord[]): AuditStats {
  const n = records.length;
  let i = 0;
  let ok = 0;
  let nc = 0;
  let na = 0;

  for (const r of records) {
    if (r.irr) i++;
    ok += r.cOk;
    nc += r.cNc;
    na += r.cNa;
  }

  // O divisor do percentual é a soma dos itens avaliados (Conforme + Não Conforme)
  // "Não se aplica" é contado mas NÃO entra na conta do percentual
  const av = ok + nc;
  const totalItemsAll = ok + nc + na;
  const pctOk = av > 0 ? (ok / av) * 100 : 0;
  const pctNc = av > 0 ? (nc / av) * 100 : 0;
  const ratioNcOk = ok > 0 ? (nc / ok) * 100 : 0; // % de itens irregulares em relação aos regulares

  const regularAudits = n - i;
  const regRate = n > 0 ? (regularAudits / n) * 100 : 0;
  const compRate = pctOk;

  return {
    n,
    i,
    totalItemsAll,
    av,
    ok,
    nc,
    na,
    pctOk,
    pctNc,
    ratioNcOk,
    regRate,
    compRate,
  };
}

export function computeItemStats(records: AuditRecord[]): ItemStat[] {
  const map: Record<string, { ok: number; nc: number; na: number }> = {};

  for (const r of records) {
    for (const k in r.ok) {
      if (!map[k]) map[k] = { ok: 0, nc: 0, na: 0 };
      map[k].ok += r.ok[k];
    }
    for (const k in r.nc) {
      if (!map[k]) map[k] = { ok: 0, nc: 0, na: 0 };
      map[k].nc += r.nc[k];
    }
    for (const k in r.na) {
      if (!map[k]) map[k] = { ok: 0, nc: 0, na: 0 };
      map[k].na += r.na[k];
    }
  }

  const items: ItemStat[] = Object.keys(map).map((name) => {
    const data = map[name];
    const total = data.ok + data.nc; // apenas avaliados
    const compRate = total > 0 ? (data.ok / total) * 100 : 100;
    const ncRate = total > 0 ? (data.nc / total) * 100 : 0;
    const ratioNcOk = data.ok > 0 ? (data.nc / data.ok) * 100 : 0;
    return {
      name,
      ok: data.ok,
      nc: data.nc,
      na: data.na,
      total,
      compRate,
      ncRate,
      ratioNcOk,
    };
  });

  return items.sort((a, b) => b.nc - a.nc);
}

export function computeTechnicianSummaries(records: AuditRecord[]): TechSummary[] {
  const techMap: Record<string, AuditRecord[]> = {};

  for (const r of records) {
    const t = r.tech || 'NÃO INFORMADO';
    if (!techMap[t]) techMap[t] = [];
    techMap[t].push(r);
  }

  const summaries: TechSummary[] = Object.keys(techMap).map((name) => {
    const list = techMap[name];
    const audits = list.length;
    let irregulars = 0;
    let cOk = 0;
    let cNc = 0;
    let cNa = 0;
    const ncMap: Record<string, number> = {};

    let dominantSup = '';
    const supCounts: Record<string, number> = {};
    let dominantBase = '';
    const baseCounts: Record<string, number> = {};

    for (const r of list) {
      if (r.irr) irregulars++;
      cOk += r.cOk;
      cNc += r.cNc;
      cNa += r.cNa;

      if (r.sup) supCounts[r.sup] = (supCounts[r.sup] || 0) + 1;
      if (r.base) baseCounts[r.base] = (baseCounts[r.base] || 0) + 1;

      for (const item in r.nc) {
        ncMap[item] = (ncMap[item] || 0) + 1;
      }
    }

    dominantSup = Object.keys(supCounts).sort((a, b) => supCounts[b] - supCounts[a])[0] || 'NÃO DEFINIDO';
    dominantBase = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a])[0] || 'NÃO DEFINIDA';

    const regularCount = audits - irregulars;
    const regRate = audits > 0 ? (regularCount / audits) * 100 : 0;
    const totalEvaluated = cOk + cNc;
    const pctOk = totalEvaluated > 0 ? (cOk / totalEvaluated) * 100 : 100;
    const pctNc = totalEvaluated > 0 ? (cNc / totalEvaluated) * 100 : 0;
    const ratioNcOk = cOk > 0 ? (cNc / cOk) * 100 : 0; // % de itens irregulares em relação aos regulares

    const topNc = Object.keys(ncMap)
      .map((item) => ({ item, count: ncMap[item] }))
      .sort((a, b) => b.count - a.count);

    let status: 'critical' | 'attention' | 'good' | 'excellent' = 'excellent';
    if (pctOk < 85) status = 'critical';
    else if (pctOk < 90) status = 'attention';
    else if (pctOk < 95) status = 'good';

    return {
      name,
      sup: dominantSup,
      base: dominantBase,
      audits,
      irregulars,
      regRate,
      cOk,
      cNc,
      cNa,
      totalEvaluated,
      pctOk,
      pctNc,
      ratioNcOk,
      compRate: pctOk,
      topNc,
      records: list,
      status,
    };
  });

  return summaries.sort((a, b) => b.cOk - a.cOk || b.audits - a.audits);
}

export function computeSupervisorSummaries(records: AuditRecord[]): SupervisorSummary[] {
  const supMap: Record<string, AuditRecord[]> = {};

  for (const r of records) {
    const s = r.sup || 'NÃO INFORMADO';
    if (!supMap[s]) supMap[s] = [];
    supMap[s].push(r);
  }

  const summaries: SupervisorSummary[] = Object.keys(supMap).map((name) => {
    const list = supMap[name];
    const audits = list.length;
    let irregulars = 0;
    let cOk = 0;
    let cNc = 0;
    let cNa = 0;
    const ncMap: Record<string, number> = {};

    let dominantBase = '';
    const baseCounts: Record<string, number> = {};

    for (const r of list) {
      if (r.irr) irregulars++;
      cOk += r.cOk;
      cNc += r.cNc;
      cNa += r.cNa;
      if (r.base) baseCounts[r.base] = (baseCounts[r.base] || 0) + 1;
      for (const item in r.nc) {
        ncMap[item] = (ncMap[item] || 0) + 1;
      }
    }

    dominantBase = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a])[0] || 'NÃO DEFINIDA';
    const regRate = audits > 0 ? ((audits - irregulars) / audits) * 100 : 0;
    const totalEvaluated = cOk + cNc;
    const pctOk = totalEvaluated > 0 ? (cOk / totalEvaluated) * 100 : 100;
    const pctNc = totalEvaluated > 0 ? (cNc / totalEvaluated) * 100 : 0;
    const ratioNcOk = cOk > 0 ? (cNc / cOk) * 100 : 0; // % de itens irregulares em relação aos regulares da equipe

    const techs = computeTechnicianSummaries(list);

    const topNc = Object.keys(ncMap)
      .map((item) => ({ item, count: ncMap[item] }))
      .sort((a, b) => b.count - a.count);

    return {
      name,
      base: dominantBase,
      audits,
      irregulars,
      regRate,
      cOk,
      cNc,
      cNa,
      totalEvaluated,
      pctOk,
      pctNc,
      ratioNcOk,
      compRate: pctOk,
      techniciansCount: techs.length,
      technicians: techs,
      topNc,
      records: list,
    };
  });

  return summaries.sort((a, b) => b.cOk - a.cOk || b.audits - a.audits);
}

export function computeMonthlyEvolution(records: AuditRecord[]) {
  const map: Record<string, { total: number; irregular: number; ok: number; nc: number; na: number }> = {};

  for (const r of records) {
    const ym = r.ym || 'Sem data';
    if (!map[ym]) map[ym] = { total: 0, irregular: 0, ok: 0, nc: 0, na: 0 };
    map[ym].total++;
    if (r.irr) map[ym].irregular++;
    map[ym].ok += r.cOk;
    map[ym].nc += r.cNc;
    map[ym].na += r.cNa;
  }

  const months = Object.keys(map).sort();
  return months.map((ym) => {
    const d = map[ym];
    const regular = d.total - d.irregular;
    const regRate = d.total > 0 ? (regular / d.total) * 100 : 0;
    const totalAv = d.ok + d.nc;
    const compRate = totalAv > 0 ? (d.ok / totalAv) * 100 : 100;
    const ncRate = totalAv > 0 ? (d.nc / totalAv) * 100 : 0;
    return {
      ym,
      label: formatMonthLabel(ym),
      total: d.total,
      regular,
      irregular: d.irregular,
      regRate,
      compRate,
      ncRate,
      okCount: d.ok,
      ncCount: d.nc,
      naCount: d.na,
      totalAv,
    };
  });
}

// Generate smart rule-based analysis as fallback
export function generateSmartLocalAnalysis(
  type: 'technician' | 'supervisor',
  name: string,
  metrics: {
    audits: number;
    regRate: number;
    compRate: number;
    topNc: { item: string; count: number }[];
    totalNc: number;
    base: string;
    sup?: string;
  }
): string {
  const topIssues = metrics.topNc.slice(0, 3).map((i) => `**${i.item}** (${i.count} ocorrência${i.count > 1 ? 's' : ''})`).join(', ');

  const rating =
    metrics.regRate >= 95
      ? 'Excelente (Padrão Ouro)'
      : metrics.regRate >= 90
      ? 'Bom (Dentro do esperado com ajustes pontuais)'
      : metrics.regRate >= 80
      ? 'Atenção (Necessidade de reciclagem técnica)'
      : 'Crítico (Intervenção imediata e acompanhamento de campo)';

  return `### 🔍 Diagnóstico Técnico Especializado: ${name}
**Perfil:** ${type === 'supervisor' ? 'Equipe de Supervisão' : 'Instalador FTTx'} | **Base:** ${metrics.base} ${metrics.sup ? `| **Supervisor:** ${metrics.sup}` : ''}
**Desempenho Geral:** ${rating}
- **Volume de Auditorias:** ${metrics.audits} ordens de serviço auditadas
- **Índice de Regularidade:** ${formatPercent(metrics.regRate)} de aprovação
- **Conformidade Geral de Itens:** ${formatPercent(metrics.compRate)}

---

### ⚠️ Principais Pontos Críticos e Causa Raiz
${metrics.topNc.length > 0 ? `Os principais motivos de não conformidade identificados foram: ${topIssues}.` : 'Nenhuma não conformidade grave recorrente registrada.'}

${metrics.topNc.map((nc, idx) => {
  let tip = '';
  const itemNorm = normalizeStr(nc.item);
  if (itemNorm.includes('limpeza')) {
    tip = 'Falta do uso de caneta one-click cleaner antes do acoplamento no conector SC-APC ou manipulação com dedos sujos. Causa atenuação de até 3dB e chamados recorrentes.';
  } else if (itemNorm.includes('cto') || itemNorm.includes('identificacao')) {
    tip = 'Ausência de anilhas ou plaqueta com matrícula na porta da caixa de terminação óptica. Risco elevado de corte involuntário por técnicos de manutenção.';
  } else if (itemNorm.includes('passagem') || itemNorm.includes('ancoragem')) {
    tip = 'Drop instalado sem esticador cunha apropriado ou raio de curvatura excessivo (dobras bruscas). Provoca microcurvaturas e degradação do sinal ao longo do tempo.';
  } else if (itemNorm.includes('sinal') || itemNorm.includes('rx')) {
    tip = 'Divergência entre leitura de power meter e medição reportada na OLT. Indica fusão atenuada ou conectorização mecânica deficiente na roseta.';
  } else if (itemNorm.includes('emenda')) {
    tip = 'Uso inadequado de emendas no vão aéreo sem proteção estanque ou emendas clandestinas proibidas pela norma Sebratel.';
  } else if (itemNorm.includes('acabamento')) {
    tip = 'Fixação frouxa da roseta na parede ou sobras de drop expostas no ambiente do cliente residencial.';
  } else {
    tip = 'Desvio do procedimento operacional padrão de campo homologado Sebratel.';
  }
  return `**${idx + 1}. ${nc.item} (${nc.count}x):** ${tip}`;
}).join('\n\n')}

---

### 📋 Plano de Ação Recomendado
1. **Inspeção de Ferramental:** Realizar check-up do kit óptico (canetas de limpeza, decapadores, clivador de precisão e medidor de potência PON).
2. **Treinamento Prático In-Loco:** ${type === 'supervisor' ? 'Agendar blitz técnica conjunta de 1 dia acompanhando os instaladores com menor taxa de conformidade.' : 'Acompanhamento lado a lado com auditor de qualidade na próxima instalação.'}
3. **Auditoria de Retorno:** Reavaliar as próximas 5 ordens de serviço para validar a fixação das correções.

---

*Gerado pelo Motor Inteligente de Auditoria Técnica Sebratel FTTx.*`;
}
