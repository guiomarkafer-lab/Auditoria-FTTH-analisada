export interface AuditRecord {
  src: 'Online' | 'Offline';
  ym: string;
  base: string;
  sup: string;
  aud: string;
  tech: string;
  irr: boolean;
  nc: Record<string, number>;
  ok: Record<string, number>;
  na: Record<string, number>;
  cNc: number;
  cOk: number;
  cNa: number;
  d: string;
  p: string;
  o: string;
  f: string[];
}

export interface DataSource {
  id: number;
  name: string;
  kind: 'Embutido' | 'Arquivo Excel' | 'Arquivo CSV' | 'Google Drive';
  type: string;
  rows: AuditRecord[];
  loadedAt?: string;
}

export interface FilterState {
  month: string;
  base: string;
  supervisor: string;
  auditor: string;
  technician: string;
  sourceType: string;
  status: string; // 'all' | 'regular' | 'irregular'
  search: string;
}

export interface AuditStats {
  n: number; // total de auditorias
  i: number; // total com alguma irregularidade
  totalItemsAll: number; // soma absoluta de itens preenchidos (ok + nc + na)
  av: number; // total de itens avaliados válidos (ok + nc)
  ok: number; // quantidade de itens conformes
  nc: number; // quantidade de itens não conformes
  na: number; // quantidade de itens não se aplica (exibido mas não entra no divisor)
  pctOk: number; // % de itens conformes (ok / av * 100)
  pctNc: number; // % de itens não conformes (nc / av * 100)
  ratioNcOk: number; // % de itens irregulares em relação aos regulares (nc / ok * 100)
  regRate: number; // % de auditorias regulares
  compRate: number; // % de conformidade geral
}

export interface ItemStat {
  name: string;
  ok: number;
  nc: number;
  na: number;
  total: number; // ok + nc
  compRate: number; // ok / (ok + nc) * 100
  ncRate: number; // nc / (ok + nc) * 100
  ratioNcOk: number; // nc / ok * 100
}

export interface TechSummary {
  name: string;
  sup: string;
  base: string;
  audits: number;
  irregulars: number;
  regRate: number;
  cOk: number;
  cNc: number;
  cNa: number;
  totalEvaluated: number; // cOk + cNc
  pctOk: number; // cOk / totalEvaluated * 100
  pctNc: number; // cNc / totalEvaluated * 100
  ratioNcOk: number; // cNc / cOk * 100 (itens irregulares em relação aos regulares)
  compRate: number;
  topNc: { item: string; count: number }[];
  records: AuditRecord[];
  status: 'critical' | 'attention' | 'good' | 'excellent';
}

export interface SupervisorSummary {
  name: string;
  base: string;
  audits: number;
  irregulars: number;
  regRate: number;
  cOk: number;
  cNc: number;
  cNa: number;
  totalEvaluated: number; // cOk + cNc
  pctOk: number;
  pctNc: number;
  ratioNcOk: number; // cNc / cOk * 100 (itens irregulares em relação aos regulares da equipe)
  compRate: number;
  techniciansCount: number;
  technicians: TechSummary[];
  topNc: { item: string; count: number }[];
  records: AuditRecord[];
}
