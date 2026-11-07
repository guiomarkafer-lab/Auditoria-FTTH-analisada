import * as XLSX from 'xlsx';
import { AuditRecord, DataSource } from '../types/audit';
import { SEBRATEL_BG_BASE64 } from '../data/sebratelBgBase64';

export function exportFilteredToExcel(records: AuditRecord[], filename = 'Auditoria_FTTx_Sebratel.xlsx') {
  const data = records.map((r, i) => {
    const nonConformities = Object.keys(r.nc).join(', ');
    const conformities = Object.keys(r.ok).join(', ');
    const totalEv = r.cOk + r.cNc;
    const pctConforme = totalEv > 0 ? ((r.cOk / totalEv) * 100).toFixed(1) + '%' : '100,0%';
    const ratioIrreg = r.cOk > 0 ? ((r.cNc / r.cOk) * 100).toFixed(1) + '%' : '0,0%';

    return {
      '#': i + 1,
      Tipo: r.src,
      'Mês/Ano': r.d,
      Protocolo: r.p || 'S/N',
      Base: r.base,
      Supervisor: r.sup,
      Instalador: r.tech,
      Auditor: r.aud,
      'Itens Conformes (OK)': r.cOk,
      'Itens Não Conformes (NC)': r.cNc,
      'Não se Aplica': r.cNa,
      'Total Itens Avaliados': totalEv,
      '% Conforme': pctConforme,
      'Irregulares × Regulares': ratioIrreg,
      'Detalhes Não Conformes': nonConformities || '-',
      'Detalhes Conformes': conformities || '-',
      Observação: r.o || '-',
      'Qtd Fotos': r.f?.length || 0,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Auditorias_FTTx');

  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 35 },
    { wch: 30 },
    { wch: 35 },
    { wch: 10 },
  ];

  XLSX.writeFile(wb, filename);
}

// Generate standalone HTML with updated calculation rules, SEBRATEL branding, technician filter, and charts
export function generateStandaloneHtml(dataSources: DataSource[]): string {
  const exportedSourcesJson = JSON.stringify(dataSources);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auditoria FTTx Sebratel - Distribuição Offline</title>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
    :root {
      --primary: #f59e0b;
      --primary-dark: #d97706;
      --card-bg: rgba(15, 23, 42, 0.88);
      --card-border: rgba(255, 255, 255, 0.12);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #020617;
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.5;
      overflow-x: hidden;
    }
    #bgImageLayer {
      position: fixed; inset: 0; z-index: -2;
      background-image: url('${SEBRATEL_BG_BASE64}');
      background-size: cover; background-position: center; background-attachment: fixed;
      pointer-events: none;
    }
    #bgOverlayLayer {
      position: fixed; inset: 0; z-index: -1;
      background: #020617; opacity: 0.65;
      pointer-events: none; transition: opacity 0.2s ease-in-out;
    }
    .header {
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      padding: 0.85rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .logo-badge {
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white;
      font-weight: 900;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .title-area h1 { font-size: 1.15rem; font-weight: 800; color: #fff; }
    .title-area p { font-size: 0.75rem; color: #fbbf24; font-weight: 600; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .btn {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid var(--card-border);
      padding: 0.45rem 0.8rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn:hover { background: rgba(255, 255, 255, 0.18); }
    .btn-primary { background: #f59e0b; color: #000; border-color: #f59e0b; }
    .btn-primary:hover { background: #d97706; }
    .btn-danger { background: rgba(220, 38, 38, 0.2); border-color: #dc2626; color: #fca5a5; }
    .btn-danger:hover { background: #dc2626; color: #fff; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-admin { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-guest { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
    
    .container { max-width: 1440px; margin: 0 auto; padding: 1.5rem; }
    
    .filters-bar {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
      align-items: end;
    }
    .filter-item label { display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; }
    .filter-item select, .filter-item input {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      padding: 0.45rem 0.65rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .kpi-card {
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.15rem;
      backdrop-filter: blur(8px);
    }
    .kpi-title { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .kpi-value { font-size: 1.85rem; font-weight: 800; color: #fff; margin: 0.25rem 0; }
    .kpi-sub { font-size: 0.75rem; color: #94a3b8; }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .card {
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      backdrop-filter: blur(8px);
    }
    .card-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
    
    .tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 1.25rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.55rem 0.95rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th { text-align: left; padding: 0.65rem 0.75rem; background: rgba(30, 41, 59, 0.8); color: var(--text-muted); font-weight: 600; border-bottom: 1px solid #334155; }
    td { padding: 0.65rem 0.75rem; border-bottom: 1px solid rgba(51, 65, 85, 0.4); }
    tr:hover td { background: rgba(255, 255, 255, 0.03); }
    
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(6px); display: none; place-items: center; z-index: 1000; padding: 1rem;
    }
    .modal-content {
      background: #0f172a; border: 1px solid #334155; border-radius: 16px;
      max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 1.5rem;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.75rem; }
    .close-btn { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    
    .bar-row { margin-bottom: 0.65rem; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem; }
    .bar-track { height: 7px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #f59e0b; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="bgImageLayer"></div>
  <div id="bgOverlayLayer"></div>

  <header class="header">
    <div class="brand">
      <div class="logo-badge">SEBRATEL</div>
      <div class="title-area">
        <h1>Auditoria FTTx Sebratel</h1>
        <p>Qualidade Técnica em Instalações • Standalone</p>
      </div>
    </div>
    <div class="header-actions">
      <div style="display:flex; align-items:center; gap:0.4rem; background:rgba(30,41,59,0.7); padding:0.35rem 0.65rem; border-radius:8px; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; color:#94a3b8;">
        <span>Fundo:</span>
        <input type="range" id="contrastSlider" min="0" max="1" step="0.05" value="0.35" style="width:70px; height:4px; accent-color:#f59e0b; cursor:pointer;" title="Ajustar contraste da imagem de fundo Sebratel">
      </div>
      <span id="authBadge" class="badge badge-guest">Visitante (Somente visualização)</span>
      <button id="authBtn" class="btn">Entrar como Admin</button>
      <button id="manageFilesBtn" class="btn">Gerenciar Planilhas</button>
      <button id="exportXlsBtn" class="btn btn-primary">Exportar Excel</button>
    </div>
  </header>

  <main class="container">
    <!-- Filters Bar with Technician selector -->
    <section class="filters-bar">
      <div class="filter-item">
        <label>Mês:</label>
        <select id="selMonth"><option value="">Todos</option></select>
      </div>
      <div class="filter-item">
        <label>Base:</label>
        <select id="selBase"><option value="">Todas</option></select>
      </div>
      <div class="filter-item">
        <label>Supervisor:</label>
        <select id="selSup"><option value="">Todos</option></select>
      </div>
      <div class="filter-item">
        <label>Técnico / Instalador:</label>
        <select id="selTech"><option value="">Todos os técnicos</option></select>
      </div>
      <div class="filter-item">
        <label>Auditor:</label>
        <select id="selAud"><option value="">Todos</option></select>
      </div>
      <div class="filter-item">
        <label>Canal:</label>
        <select id="selType">
          <option value="">Online + Offline</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
      </div>
      <div class="filter-item" style="grid-column: 1 / -1;">
        <label>Buscar (Técnico / Protocolo / Obs):</label>
        <input type="text" id="inpSearch" placeholder="Pesquisar...">
      </div>
    </section>

    <!-- Top Dynamic Charts & Indicator Cards (Alteram conforme os filtros) -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Itens Auditados (Avaliados)</div>
        <div id="kpiTotalAv" class="kpi-value">0</div>
        <div id="kpiTotalSub" class="kpi-sub">Total Conforme + Não Conforme</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Itens Conformes (OK)</div>
        <div id="kpiOk" class="kpi-value" style="color: #4ade80;">0</div>
        <div id="kpiOkPct" class="kpi-sub">0,0% de conformidade</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Itens Não Conformes (NC)</div>
        <div id="kpiNc" class="kpi-value" style="color: #f87171;">0</div>
        <div id="kpiNcPct" class="kpi-sub">0,0% de desvios</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Distribuição Geral de Itens</div>
        <div id="kpiRatio" class="kpi-value" style="color: #38bdf8;">93,0% OK</div>
        <div id="kpiNa" class="kpi-sub">Não se aplica: 1.746 (informativo)</div>
      </div>
    </div>

    <!-- Interactive Visual Charts Row below search -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-title">Proporção Geral: Conformes × Não Conformes</div>
        <div id="chartSegmentBar" style="height:20px; background:#1e293b; border-radius:6px; overflow:hidden; display:flex; margin-bottom:0.75rem;"></div>
        <div id="chartSegmentLegend" style="font-size:0.75rem; display:flex; justify-content:space-between;"></div>
      </div>
      <div class="card">
        <div class="card-title">Top Falhas (Não Conformidades)</div>
        <div id="ncBarsContainer"></div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <nav class="tabs">
      <button class="tab-btn active" data-tab="overview">Resumo Geral</button>
      <button class="tab-btn" data-tab="techs">Técnicos (Instaladores)</button>
      <button class="tab-btn" data-tab="supervisors">Supervisores</button>
      <button class="tab-btn" data-tab="items">Itens Auditados</button>
      <button class="tab-btn" data-tab="protocols">Protocolos Detalhados</button>
    </nav>

    <!-- TAB 1: OVERVIEW -->
    <div id="tab-overview" class="tab-pane">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(420px, 1fr)); gap:1.25rem;">
        <!-- Card 1: Top Falhas por Item -->
        <div class="card">
          <div class="card-title">
            <span>Ranking de Não Conformidades por Item</span>
            <span id="overviewTotalFailures" style="font-size:0.75rem; color:#f87171; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.2rem 0.55rem; border-radius:6px; font-family:monospace;">1.586 falhas totais</span>
          </div>
          <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:1rem;">Quantidade e % de falhas sobre o total avaliado de cada pilar</p>
          <div id="overviewTopFailuresContainer" style="display:flex; flex-direction:column; gap:0.65rem;"></div>
        </div>

        <!-- Card 2: Evolução Mensal da Qualidade -->
        <div class="card">
          <div class="card-title">Evolução Mensal da Qualidade</div>
          <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:1rem;">Total de ordens e índice de conformidade de itens mês a mês</p>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Ordens</th>
                  <th>Itens OK</th>
                  <th>Itens NC</th>
                  <th>% Conforme</th>
                </tr>
              </thead>
              <tbody id="tblMonthlyEvolution"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: TECHS -->
    <div id="tab-techs" class="tab-pane" style="display: none;">
      <div class="card">
        <div class="card-title">Ranking de Instaladores (Conformidade de Itens e Relação Irregulares × Regulares)</div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Instalador</th>
                <th>Supervisor</th>
                <th>Base</th>
                <th>Itens OK (Qtd / %)</th>
                <th>Itens NC (Qtd / %)</th>
                <th>Irregulares × Regulares</th>
                <th>Ordens</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="tblTechs"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: SUPERVISORS -->
    <div id="tab-supervisors" class="tab-pane" style="display: none;">
      <div id="supervisorsGrid" class="kpi-grid"></div>
    </div>

    <!-- TAB 4: ITEMS -->
    <div id="tab-items" class="tab-pane" style="display: none;">
      <div class="card">
        <div class="card-title">Matriz de Itens: Conformes × Não Conformes</div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Técnico</th>
                <th>Conforme (OK)</th>
                <th>Não Conforme (NC)</th>
                <th>Irreg. × Reg.</th>
                <th>Não se Aplica</th>
                <th>Total Avaliado</th>
                <th>% Conforme</th>
              </tr>
            </thead>
            <tbody id="tblItems"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: PROTOCOLS -->
    <div id="tab-protocols" class="tab-pane" style="display: none;">
      <div class="card">
        <div class="card-title">Ordens de Serviço e Protocolos</div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Mês/Ano</th>
                <th>Tipo</th>
                <th>Instalador</th>
                <th>Supervisor</th>
                <th>Base</th>
                <th>Itens OK</th>
                <th>Itens NC</th>
                <th>Não Conformidades</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody id="tblProtocols"></tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <footer style="margin-top:3rem; padding:1.5rem 0; border-top:1px solid rgba(255,255,255,0.08); text-align:center; font-size:0.75rem; color:#64748b;">
    <div style="margin-bottom:0.35rem;">© 2026 Sebratel Telecom • A Conexão a Gente Garante</div>
    <div style="display:flex; justify-content:center; align-items:center; gap:0.5rem; color:#94a3b8;">
      <span style="color:#f87171; font-weight:700;">Great Place To Work</span> • Certificada Jun 2026 - Jun 2027 • Qualidade Técnica FTTx
    </div>
  </footer>

  <!-- Login Modal -->
  <div id="loginModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3 style="margin:0; font-size:1.1rem; color:#fff;">Acesso Restrito - Administrador</h3>
        <button class="close-btn" onclick="closeModal('loginModal')">&times;</button>
      </div>
      <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 1rem;">
        Conforme a política Sebratel, apenas o administrador <b style="color:#fbbf24;">guiomar.ost</b> tem permissão para acionar ou retirar planilhas do aplicativo. Os demais usuários têm acesso liberado para visualização, filtros e relatórios.
      </p>
      <form id="loginForm">
        <div style="margin-bottom: 0.75rem;">
          <label style="display:block; font-size:0.75rem; margin-bottom:0.25rem; font-weight:600; color:#cbd5e1;">Usuário Administrador:</label>
          <input type="text" id="loginUser" style="width:100%; padding:0.55rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; font-size:0.85rem;" value="guiomar.ost" required>
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display:block; font-size:0.75rem; margin-bottom:0.25rem; font-weight:600; color:#cbd5e1;">Senha:</label>
          <input type="password" id="loginPass" style="width:100%; padding:0.55rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; font-size:0.85rem;" placeholder="Digite a senha (padrão: 123)" required>
        </div>
        <div id="loginError" style="display:none; color:#f87171; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.6rem 0.8rem; border-radius:6px; font-size:0.78rem; margin-bottom:1rem;"></div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button type="button" class="btn" onclick="closeModal('loginModal')">Cancelar</button>
          <button type="submit" class="btn btn-primary">Entrar como Administrador</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Data Sources Management Modal -->
  <div id="manageFilesModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3 style="margin:0; font-size:1.1rem; color:#fff;">Gerenciamento de Planilhas</h3>
        <button class="close-btn" onclick="closeModal('manageFilesModal')">&times;</button>
      </div>
      <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem;">
        Administrador ativo: <b style="color:#4ade80;">guiomar.ost</b>. Adicione ou retire planilhas do aplicativo. Os novos dados são processados no navegador e salvos no armazenamento local.
      </p>

      <div style="background:#1e293b; border:2px dashed #475569; border-radius:10px; padding:1.25rem; text-align:center; margin-bottom:1rem;">
        <label for="excelFileInput" style="cursor:pointer; display:block;">
          <div style="font-size:1.75rem; margin-bottom:0.35rem;">📂</div>
          <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:0.25rem;">
            Clique para Importar Planilha do Computador (.xlsx, .xls, .csv)
          </div>
          <div style="font-size:0.75rem; color:#94a3b8;">
            Suporta planilhas de Auditoria Online e Offline
          </div>
        </label>
        <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv" style="display:none;" multiple>
      </div>

      <div style="background:#0f172a; border:1px solid #334155; border-radius:10px; padding:0.85rem; margin-bottom:1rem;">
        <div style="font-size:0.8rem; font-weight:700; color:#60a5fa; margin-bottom:0.25rem;">
          🔗 Importar via Link do Google Drive
        </div>
        <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:0.5rem;">
          Cole o link compartilhado da planilha ("Qualquer pessoa com o link pode ler"):
        </div>
        <div style="display:flex; gap:0.5rem;">
          <input type="url" id="standaloneDriveUrl" placeholder="https://docs.google.com/spreadsheets/d/..." style="flex:1; padding:0.45rem 0.6rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; font-size:0.75rem;">
          <button type="button" id="btnStandaloneDrive" class="btn btn-primary" style="font-size:0.75rem; padding:0.45rem 0.8rem;">Conectar</button>
        </div>
      </div>

      <div id="uploadFeedback" style="display:none; font-size:0.8rem; padding:0.6rem 0.8rem; border-radius:6px; margin-bottom:1rem;"></div>

      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.8rem; font-weight:700; color:#cbd5e1; margin-bottom:0.5rem;">Planilhas Ativas:</div>
        <div id="sourcesListContainer" style="display:flex; flex-direction:column; gap:0.5rem; max-height:200px; overflow-y:auto;"></div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; border-top:1px solid #1e293b; padding-top:1rem;">
        <button id="btnResetSources" class="btn" style="background:rgba(127,29,29,0.3); color:#fca5a5; border-color:#7f1d1d; font-size:0.75rem;">
          Restaurar Base Padrão
        </button>
        <button class="btn btn-primary" onclick="closeModal('manageFilesModal')">Concluir</button>
      </div>
    </div>
  </div>

  <script>
    var INITIAL_DATA_SOURCES = ${exportedSourcesJson};
    var DATA_SOURCES = [];
    try {
      var savedDs = localStorage.getItem('fttx_data_sources');
      if (savedDs) {
        DATA_SOURCES = JSON.parse(savedDs);
      } else {
        DATA_SOURCES = JSON.parse(JSON.stringify(INITIAL_DATA_SOURCES));
      }
    } catch (e) {
      DATA_SOURCES = JSON.parse(JSON.stringify(INITIAL_DATA_SOURCES));
    }

    var isAdmin = localStorage.getItem('fttx_admin_auth') === 'true';
    var MONTH_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    function $(id) { return document.getElementById(id); }
    function closeModal(id) { var el = $(id); if (el) el.style.display = 'none'; }
    function openModal(id) { var el = $(id); if (el) el.style.display = 'grid'; }
    window.closeModal = closeModal;
    window.openModal = openModal;
    function norm(s) { return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim(); }
    function fmtPct(v) { return (v || 0).toFixed(1).replace('.', ',') + '%'; }
    function fmtMonth(ym) {
      var p = String(ym||'').split('-');
      if (p.length > 1) {
        var idx = parseInt(p[1], 10) - 1;
        return (MONTH_NAMES[idx] || p[1]) + '/' + p[0];
      }
      return ym || 'Sem data';
    }

    function getAllRecords() {
      var seen = {}, list = [];
      DATA_SOURCES.forEach(function(ds) {
        ds.rows.forEach(function(r) {
          var k = [r.src, r.p, r.tech, r.d, r.aud, r.cNc, r.cOk, r.cNa, r.o, r.irr].join('|');
          if (!seen[k]) {
            seen[k] = true;
            list.push(r);
          }
        });
      });
      return list;
    }

    function getFilteredRecords() {
      var m = $('selMonth').value;
      var b = $('selBase').value;
      var s = $('selSup').value;
      var tc = $('selTech').value;
      var a = $('selAud').value;
      var t = $('selType').value;
      var q = norm($('inpSearch').value);

      return getAllRecords().filter(function(r) {
        if (m && r.ym !== m) return false;
        if (b && r.base !== b) return false;
        if (s && r.sup !== s) return false;
        if (tc && r.tech !== tc) return false;
        if (a && r.aud !== a) return false;
        if (t && r.src !== t) return false;
        if (q) {
          var line = norm(r.tech + ' ' + r.sup + ' ' + r.base + ' ' + r.p + ' ' + r.aud + ' ' + r.o);
          if (line.indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function populateFilterOptions() {
      var all = getAllRecords();
      function fill(elId, key, fmt) {
        var cur = $(elId).value;
        var vals = {};
        all.forEach(function(r) { if (r[key]) vals[r[key]] = 1; });
        var keys = Object.keys(vals).sort();
        var html = '<option value="">Todos</option>';
        keys.forEach(function(k) {
          html += '<option value="' + k + '">' + (fmt ? fmt(k) : k) + '</option>';
        });
        $(elId).innerHTML = html;
        $(elId).value = cur;
      }
      fill('selMonth', 'ym', fmtMonth);
      fill('selBase', 'base');
      fill('selSup', 'sup');
      fill('selTech', 'tech');
      fill('selAud', 'aud');
    }

    function renderUI() {
      var recs = getFilteredRecords();
      var cOk = 0, cNc = 0, cNa = 0;
      var itemsMap = {};
      var monthlyMap = {};
      var techMap = {};
      var supMap = {};

      recs.forEach(function(r) {
        cOk += r.cOk;
        cNc += r.cNc;
        cNa += r.cNa;

        var ym = r.ym || 'Sem data';
        if (!monthlyMap[ym]) monthlyMap[ym] = { total: 0, ok: 0, nc: 0 };
        monthlyMap[ym].total++;
        monthlyMap[ym].ok += r.cOk;
        monthlyMap[ym].nc += r.cNc;

        for (var k in r.nc) itemsMap[k] = (itemsMap[k] || { ok: 0, nc: 0, na: 0 }), itemsMap[k].nc += r.nc[k];
        for (var k in r.ok) itemsMap[k] = (itemsMap[k] || { ok: 0, nc: 0, na: 0 }), itemsMap[k].ok += r.ok[k];
        for (var k in r.na) itemsMap[k] = (itemsMap[k] || { ok: 0, nc: 0, na: 0 }), itemsMap[k].na += r.na[k];

        var t = r.tech || 'NÃO INFORMADO';
        if (!techMap[t]) techMap[t] = { audits: 0, cOk: 0, cNc: 0, cNa: 0, sup: r.sup, base: r.base };
        techMap[t].audits++;
        techMap[t].cOk += r.cOk;
        techMap[t].cNc += r.cNc;
        techMap[t].cNa += r.cNa;

        var s = r.sup || 'NÃO INFORMADO';
        if (!supMap[s]) supMap[s] = { audits: 0, cOk: 0, cNc: 0, cNa: 0, base: r.base, techs: {} };
        supMap[s].audits++;
        supMap[s].cOk += r.cOk;
        supMap[s].cNc += r.cNc;
        supMap[s].cNa += r.cNa;
        supMap[s].techs[t] = 1;
      });

      var totalEvaluated = cOk + cNc; // Apenas Conforme + Não Conforme
      var pctOk = totalEvaluated > 0 ? (cOk / totalEvaluated) * 100 : 0;
      var pctNc = totalEvaluated > 0 ? (cNc / totalEvaluated) * 100 : 0;
      var ratioNcOk = cOk > 0 ? (cNc / cOk) * 100 : 0; // % de irregulares em relação aos regulares

      // KPIs
      $('kpiTotalAv').textContent = totalEvaluated.toLocaleString('pt-BR');
      $('kpiTotalSub').textContent = recs.length + ' ordens de serviço auditadas';
      $('kpiOk').textContent = cOk.toLocaleString('pt-BR');
      $('kpiOkPct').textContent = fmtPct(pctOk) + ' de conformidade';
      $('kpiNc').textContent = cNc.toLocaleString('pt-BR');
      $('kpiNcPct').textContent = fmtPct(pctNc) + ' de não conformidades';
      $('kpiRatio').textContent = fmtPct(pctOk) + ' OK / ' + fmtPct(pctNc) + ' NC';
      $('kpiNa').textContent = 'Não se aplica: ' + cNa.toLocaleString('pt-BR') + ' itens (informativo)';

      // Segmented Bar
      $('chartSegmentBar').innerHTML = '<div style="background:#10b981; width:' + pctOk + '%; height:100%;"></div>' +
        '<div style="background:#ef4444; width:' + pctNc + '%; height:100%;"></div>';
      $('chartSegmentLegend').innerHTML = '<span style="color:#34d399;"><b>' + cOk.toLocaleString('pt-BR') + ' Conformes</b> (' + fmtPct(pctOk) + ')</span>' +
        '<span style="color:#f87171;"><b>' + cNc.toLocaleString('pt-BR') + ' Não Conformes</b> (' + fmtPct(pctNc) + ')</span>' +
        '<span style="color:#fbbf24;"><b>' + cNa.toLocaleString('pt-BR') + ' Não se Aplica</b> (informativo)</span>';

      // NC Bars
      var sortedItems = Object.keys(itemsMap).map(function(k) {
        return { name: k, nc: itemsMap[k].nc, ok: itemsMap[k].ok };
      }).sort(function(a, b) { return b.nc - a.nc; });

      var maxNc = sortedItems.length && sortedItems[0].nc ? sortedItems[0].nc : 1;
      var barsHtml = '';
      sortedItems.slice(0, 6).forEach(function(item) {
        var w = (item.nc / maxNc) * 100;
        var rRate = item.ok > 0 ? (item.nc / item.ok * 100).toFixed(1) : '0,0';
        barsHtml += '<div class="bar-row">' +
          '<div class="bar-label"><span>' + item.name + '</span><b>' + item.nc + ' falhas (' + rRate + '% ratio)</b></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width: ' + w + '%;"></div></div>' +
        '</div>';
      });
      $('ncBarsContainer').innerHTML = barsHtml || '<p style="color:#94a3b8; font-size:0.75rem;">Nenhuma falha.</p>';

      // Overview Top Failures (Top 10)
      var top10 = sortedItems.slice(0, 10);
      var maxTop10 = top10.length && top10[0].nc ? top10[0].nc : 1;
      var top10Html = '';
      top10.forEach(function(item, idx) {
        var w = (item.nc / maxTop10) * 100;
        var itemTotal = item.ok + item.nc;
        var itemRate = itemTotal > 0 ? (item.nc / itemTotal) * 100 : 0;
        top10Html += '<div style="margin-bottom:0.65rem;">' +
          '<div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;">' +
            '<span style="color:#e2e8f0; font-weight:600;"><span style="color:#64748b; font-family:monospace; margin-right:0.35rem;">' + (idx + 1) + '.</span>' + item.name + '</span>' +
            '<span style="font-family:monospace;"><span style="color:#4ade80;">' + item.ok + ' OK</span> • <b style="color:#f87171;">' + item.nc + ' NC (' + fmtPct(itemRate) + ')</b></span>' +
          '</div>' +
          '<div style="height:7px; background:#1e293b; border-radius:9999px; overflow:hidden;">' +
            '<div style="width:' + w + '%; height:100%; border-radius:9999px; background:linear-gradient(to right, #f59e0b, #ef4444); transition:width 0.4s;"></div>' +
          '</div>' +
        '</div>';
      });
      if ($('overviewTopFailuresContainer')) {
        $('overviewTopFailuresContainer').innerHTML = top10Html || '<p style="color:#94a3b8; font-size:0.75rem;">Nenhuma falha registrada.</p>';
      }
      if ($('overviewTotalFailures')) {
        $('overviewTotalFailures').textContent = cNc.toLocaleString('pt-BR') + ' falhas totais';
      }

      // Monthly Evolution
      var monthKeys = Object.keys(monthlyMap).sort();
      var monthRows = '';
      monthKeys.forEach(function(ym) {
        var d = monthlyMap[ym];
        var ev = d.ok + d.nc;
        var pOk = ev > 0 ? (d.ok / ev) * 100 : 0;
        monthRows += '<tr>' +
          '<td><b>' + fmtMonth(ym) + '</b></td>' +
          '<td>' + d.total + '</td>' +
          '<td style="color:#4ade80;">' + d.ok.toLocaleString('pt-BR') + '</td>' +
          '<td style="color:#f87171;">' + d.nc.toLocaleString('pt-BR') + '</td>' +
          '<td><b>' + fmtPct(pOk) + '</b></td>' +
        '</tr>';
      });
      $('tblMonthlyEvolution').innerHTML = monthRows;

      // Techs Table
      var sortedTechs = Object.keys(techMap).map(function(name) {
        var t = techMap[name];
        var ev = t.cOk + t.cNc;
        var pOk = ev > 0 ? (t.cOk / ev) * 100 : 0;
        var pNc = ev > 0 ? (t.cNc / ev) * 100 : 0;
        var r = t.cOk > 0 ? (t.cNc / t.cOk) * 100 : 0;
        return { name: name, audits: t.audits, cOk: t.cOk, cNc: t.cNc, pOk: pOk, pNc: pNc, r: r, sup: t.sup, base: t.base };
      }).sort(function(a, b) { return b.pOk - a.pOk || b.cOk - a.cOk; });

      var techRows = '';
      sortedTechs.forEach(function(t) {
        techRows += '<tr>' +
          '<td><b>' + t.name + '</b></td>' +
          '<td>' + t.sup + '</td>' +
          '<td>' + t.base + '</td>' +
          '<td style="color:#4ade80;"><b>' + t.cOk + '</b> (' + fmtPct(t.pOk) + ')</td>' +
          '<td style="color:#f87171;"><b>' + t.cNc + '</b> (' + fmtPct(t.pNc) + ')</td>' +
          '<td style="color:#fbbf24; font-weight:bold;">' + fmtPct(t.r) + '</td>' +
          '<td>' + t.audits + '</td>' +
          '<td><button class="btn" style="padding:0.2rem 0.4rem;font-size:0.7rem;" onclick="alert(\\'' + t.name + ': ' + t.cOk + ' itens conformes, ' + t.cNc + ' não conformes. Relação: ' + fmtPct(t.r) + '\\')">Detalhes</button></td>' +
        '</tr>';
      });
      $('tblTechs').innerHTML = techRows;

      // Supervisors Cards (Conformidade e Não Conformes NC%)
      var supCardsHtml = '';
      Object.keys(supMap).sort().forEach(function(name) {
        var s = supMap[name];
        var ev = s.cOk + s.cNc;
        var pOk = ev > 0 ? (s.cOk / ev) * 100 : 0;
        var pNc = ev > 0 ? (s.cNc / ev) * 100 : 0;
        var numTechs = Object.keys(s.techs).length;
        supCardsHtml += '<div class="card" style="margin-bottom:1rem;">' +
          '<div class="card-title" style="margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:flex-start;">' +
            '<div>' +
              '<span style="font-size:1.05rem; font-weight:800; color:#fff;">' + name + '</span>' +
              '<div style="font-size:0.75rem; color:#94a3b8; margin-top:0.2rem;">Base: <b style="color:#cbd5e1;">' + s.base + '</b> • ' + numTechs + ' instaladores</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="font-size:1.25rem; font-weight:900; font-family:monospace; color:#4ade80;">' + fmtPct(pOk) + '</div>' +
              '<div style="font-size:0.65rem; color:#94a3b8;">conformidade de itens</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.5rem;">' +
            '<div style="background:#1e293b; padding:0.5rem; border-radius:8px; border:1px solid #334155;"><div style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase; font-weight:600;">Itens Avaliados</div><div style="font-size:0.95rem; font-weight:700; color:#fff; margin-top:0.15rem;">' + ev.toLocaleString('pt-BR') + '</div></div>' +
            '<div style="background:#1e293b; padding:0.5rem; border-radius:8px; border:1px solid #334155;"><div style="font-size:0.65rem; color:#4ade80; text-transform:uppercase; font-weight:600;">Conformes (OK)</div><div style="font-size:0.95rem; font-weight:700; color:#4ade80; margin-top:0.15rem;">' + s.cOk.toLocaleString('pt-BR') + '</div></div>' +
            '<div style="background:#1e293b; padding:0.5rem; border-radius:8px; border:1px solid #334155;"><div style="font-size:0.65rem; color:#f87171; text-transform:uppercase; font-weight:600;">Não Conformes</div><div style="font-size:0.95rem; font-weight:700; color:#f87171; margin-top:0.15rem;">' + s.cNc.toLocaleString('pt-BR') + '</div></div>' +
            '<div style="background:#1e293b; padding:0.5rem; border-radius:8px; border:1px solid #334155;"><div style="font-size:0.65rem; color:#f87171; text-transform:uppercase; font-weight:600;">NC (%)</div><div style="font-size:0.95rem; font-weight:700; color:#f87171; margin-top:0.15rem;">' + fmtPct(pNc) + '</div></div>' +
          '</div>' +
        '</div>';
      });
      $('supervisorsGrid').innerHTML = supCardsHtml;

      // Items Table
      var itemRows = '';
      sortedItems.forEach(function(it) {
        var itData = itemsMap[it.name] || { ok: 0, nc: 0, na: 0 };
        var totalEv = itData.ok + itData.nc;
        var cRate = totalEv ? (itData.ok / totalEv) * 100 : 100;
        var r = itData.ok > 0 ? (itData.nc / itData.ok) * 100 : 0;
        itemRows += '<tr>' +
          '<td><b>' + it.name + '</b></td>' +
          '<td style="color:#4ade80;">' + itData.ok + '</td>' +
          '<td style="color:#f87171;">' + itData.nc + '</td>' +
          '<td style="color:#fbbf24; font-weight:bold;">' + fmtPct(r) + '</td>' +
          '<td style="color:#94a3b8;">' + itData.na + '</td>' +
          '<td>' + totalEv + '</td>' +
          '<td><b>' + fmtPct(cRate) + '</b></td>' +
        '</tr>';
      });
      $('tblItems').innerHTML = itemRows;

      // Protocols Table
      var protoRows = '';
      recs.slice(0, 100).forEach(function(r) {
        protoRows += '<tr>' +
          '<td><b>' + (r.p || 'S/N') + '</b></td>' +
          '<td>' + r.d + '</td>' +
          '<td>' + r.src + '</td>' +
          '<td>' + r.tech + '</td>' +
          '<td>' + r.sup + '</td>' +
          '<td>' + r.base + '</td>' +
          '<td style="color:#4ade80;">' + r.cOk + '</td>' +
          '<td style="color:#f87171;">' + r.cNc + '</td>' +
          '<td style="color:#fca5a5;">' + (Object.keys(r.nc).join(', ') || '-') + '</td>' +
          '<td style="color:#cbd5e1;">' + (r.o || '-') + '</td>' +
        '</tr>';
      });
      $('tblProtocols').innerHTML = protoRows;
    }

    // Tabs navigation
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-pane').forEach(function(p) { p.style.display = 'none'; });
        btn.classList.add('active');
        $('tab-' + btn.getAttribute('data-tab')).style.display = 'block';
      });
    });

    ['selMonth', 'selBase', 'selSup', 'selTech', 'selAud', 'selType', 'inpSearch'].forEach(function(id) {
      $(id).addEventListener('input', renderUI);
    });

    // Excel Export
    $('exportXlsBtn').addEventListener('click', function() {
      var recs = getFilteredRecords();
      var data = recs.map(function(r, i) {
        var ev = r.cOk + r.cNc;
        return {
          '#': i + 1,
          'Tipo': r.src,
          'Mês/Ano': r.d,
          'Protocolo': r.p || 'S/N',
          'Base': r.base,
          'Supervisor': r.sup,
          'Instalador': r.tech,
          'Auditor': r.aud,
          'Itens Conformes': r.cOk,
          'Itens Não Conformes': r.cNc,
          'Não se Aplica': r.cNa,
          'Total Avaliado': ev,
          '% Conforme': ev > 0 ? (r.cOk/ev*100).toFixed(1)+'%' : '100%',
          'Irregulares x Regulares': r.cOk > 0 ? (r.cNc/r.cOk*100).toFixed(1)+'%' : '0%',
          'Não Conformes': Object.keys(r.nc).join(', '),
          'Observação': r.o
        };
      });
      var ws = XLSX.utils.json_to_sheet(data);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auditorias');
      XLSX.writeFile(wb, 'Auditoria_FTTx_Sebratel.xlsx');
    });

    // Admin Authentication & File Management
    function updateAuthStatus() {
      var badge = $('authBadge');
      var authBtn = $('authBtn');
      if (isAdmin) {
        badge.className = 'badge badge-admin';
        badge.textContent = 'Administrador: guiomar.ost';
        authBtn.textContent = 'Sair do Admin';
        authBtn.style.color = '#fca5a5';
      } else {
        badge.className = 'badge badge-guest';
        badge.textContent = 'Visitante (Somente visualização)';
        authBtn.textContent = 'Entrar como Admin';
        authBtn.style.color = '';
      }
      renderSourcesList();
    }

    $('authBtn').addEventListener('click', function() {
      if (isAdmin) {
        if (confirm('Deseja sair do modo administrador?')) {
          isAdmin = false;
          localStorage.removeItem('fttx_admin_auth');
          updateAuthStatus();
        }
      } else {
        $('loginError').style.display = 'none';
        $('loginPass').value = '';
        openModal('loginModal');
      }
    });

    $('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var u = ($('loginUser').value || '').trim();
      var p = ($('loginPass').value || '').trim();
      if (u === 'guiomar.ost' && p === '123') {
        isAdmin = true;
        localStorage.setItem('fttx_admin_auth', 'true');
        updateAuthStatus();
        closeModal('loginModal');
        openModal('manageFilesModal');
      } else {
        var err = $('loginError');
        err.textContent = 'Credenciais inválidas. Somente o administrador guiomar.ost (senha: 123) pode gerenciar planilhas.';
        err.style.display = 'block';
      }
    });

    $('manageFilesBtn').addEventListener('click', function() {
      if (!isAdmin) {
        $('loginError').textContent = 'Acesso restrito. Faça login como guiomar.ost para adicionar ou remover planilhas.';
        $('loginError').style.display = 'block';
        $('loginPass').value = '';
        openModal('loginModal');
      } else {
        openModal('manageFilesModal');
      }
    });

    function renderSourcesList() {
      var cont = $('sourcesListContainer');
      if (!cont) return;
      var html = '';
      DATA_SOURCES.forEach(function(ds, idx) {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; background:#0b0f19; padding:0.6rem 0.8rem; border-radius:8px; border:1px solid #1e293b;">' +
          '<div>' +
            '<div style="font-weight:700; color:#fff; font-size:0.8rem;">' + ds.name + '</div>' +
            '<div style="font-size:0.7rem; color:#94a3b8;">' + ds.rows.length.toLocaleString('pt-BR') + ' ordens (' + (ds.type || 'Mista') + ')</div>' +
          '</div>' +
          (isAdmin ? '<button class="btn btn-danger" style="font-weight:700; font-size:0.75rem; padding:0.35rem 0.65rem;" onclick="removeSource(' + idx + ')">🗑️ Excluir Planilha</button>' : '') +
        '</div>';
      });
      cont.innerHTML = html || '<div style="color:#94a3b8; font-size:0.75rem;">Nenhuma fonte carregada.</div>';
    }

    window.removeSource = function(idx) {
      if (!isAdmin) {
        alert('Apenas o administrador guiomar.ost pode remover planilhas.');
        return;
      }
      if (confirm('Tem certeza que deseja remover esta planilha?')) {
        DATA_SOURCES.splice(idx, 1);
        try { localStorage.setItem('fttx_data_sources', JSON.stringify(DATA_SOURCES)); } catch(e){}
        renderSourcesList();
        populateFilterOptions();
        renderUI();
      }
    };

    $('btnResetSources').addEventListener('click', function() {
      if (!isAdmin) {
        alert('Apenas o administrador guiomar.ost pode restaurar os dados.');
        return;
      }
      if (confirm('Deseja restaurar as fontes para a base padrão oficial Sebratel?')) {
        DATA_SOURCES = JSON.parse(JSON.stringify(INITIAL_DATA_SOURCES));
        try { localStorage.removeItem('fttx_data_sources'); } catch(e){}
        renderSourcesList();
        populateFilterOptions();
        renderUI();
        var fb = $('uploadFeedback');
        fb.style.display = 'block';
        fb.style.background = 'rgba(34,197,94,0.15)';
        fb.style.border = '1px solid rgba(34,197,94,0.3)';
        fb.style.color = '#4ade80';
        fb.textContent = 'Base restaurada com sucesso!';
      }
    });

    function parseDateMonthYear(rawVal, rawMonth) {
      var str = String(rawVal || '').trim();
      if (/^\d{5}(\.\d+)?$/.test(str)) {
        var dt = new Date(Math.round((parseFloat(str) - 25569) * 86400000));
        if (!isNaN(dt.getTime())) {
          var y = dt.getUTCFullYear();
          var m = ('0' + (dt.getUTCMonth() + 1)).slice(-2);
          var ym = y + '-' + m;
          return { ym: ym, d: fmtMonth(ym) };
        }
      }
      var iso = str.match(/(\d{4})[-/](\d{1,2})/);
      if (iso && parseInt(iso[1], 10) >= 2020 && parseInt(iso[1], 10) <= 2035) {
        var ymIso = iso[1] + '-' + ('0' + parseInt(iso[2], 10)).slice(-2);
        return { ym: ymIso, d: fmtMonth(ymIso) };
      }
      var br = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (br) {
        var yr = br[3].length === 2 ? '20' + br[3] : br[3];
        var ymBr = yr + '-' + ('0' + parseInt(br[2], 10)).slice(-2);
        return { ym: ymBr, d: fmtMonth(ymBr) };
      }
      var my = str.match(/(\d{1,2})\/(\d{4})/);
      if (my) {
        var ymMy = my[2] + '-' + ('0' + parseInt(my[1], 10)).slice(-2);
        return { ym: ymMy, d: fmtMonth(ymMy) };
      }
      var textToCheck = norm((rawMonth || '') + ' ' + str);
      for (var mi = 0; mi < MONTH_NAMES.length; mi++) {
        if (textToCheck.indexOf(MONTH_NAMES[mi]) >= 0) {
          var ymMatch = str.match(/20\d{2}/) || (rawMonth || '').match(/20\d{2}/);
          var yrT = ymMatch ? ymMatch[0] : '2026';
          var ymT = yrT + '-' + ('0' + (mi + 1)).slice(-2);
          return { ym: ymT, d: fmtMonth(ymT) };
        }
      }
      return { ym: '', d: 'Sem data' };
    }

    function processMatrixData(matrix, sourceName, kind) {
      if (!matrix || matrix.length < 2) {
        throw new Error('Arquivo vazio ou sem dados suficientes.');
      }
      var H = matrix[0].map(function(c) { return String(c || '').trim(); });
      var hNorm = H.map(norm);

      function findCol(keywords) {
        for (var ki = 0; ki < keywords.length; ki++) {
          for (var hi = 0; hi < hNorm.length; hi++) {
            if (hNorm[hi].indexOf(keywords[ki]) >= 0) return hi;
          }
        }
        return -1;
      }

      var iT = findCol(['instalador', 'coluna 8', 'tecnico', 'colaborador', 'matricula']);
      var iS = findCol(['supervisor', 'lider', 'coord']);
      var iB = findCol(['base', 'cidade', 'polo', 'filial']);
      var iA = findCol(['responsavel', 'auditor', 'avaliador']);
      var iD = findCol(['carimbo', 'data e hora', 'data da', 'data', 'dt_']);
      var iM = findCol(['mes', 'competencia', 'periodo']);
      var iI = findCol(['visita irregular', 'irregular']);
      var iO = findCol(['observacao', 'obs', 'motivo', 'apontamento', 'detalhe']);
      var iP = findCol(['protocolo', 'os', 'ordem']);

      if (iT < 0) {
        throw new Error('Coluna de instalador/técnico não encontrada na planilha.');
      }

      var itemCols = [];
      H.forEach(function(colName, cIdx) {
        if (!colName || /^(coluna|column)/i.test(hNorm[cIdx])) return;
        var confCount = 0;
        for (var rIdx = 1; rIdx < matrix.length; rIdx++) {
          var cellVal = String(matrix[rIdx][cIdx] || '');
          if (/conforme/i.test(cellVal) || /se aplica/i.test(cellVal)) confCount++;
        }
        if (confCount > 0) itemCols.push(cIdx);
      });

      var detectedType = 'Online';
      var allH = hNorm.join('|');
      if (allH.indexOf('instalador / auxiliar') >= 0) detectedType = 'Offline';

      var parsedRows = [];
      for (var rIdx = 1; rIdx < matrix.length; rIdx++) {
        var row = matrix[rIdx];
        var techVal = String(row[iT] || '').trim().toUpperCase();
        if (!techVal) continue;

        var ncObj = {}, okObj = {}, naObj = {};
        var cOk = 0, cNc = 0, cNa = 0;

        itemCols.forEach(function(cIdx) {
          var v = String(row[cIdx] || '');
          var nm = H[cIdx].replace(/\?/g, '').trim();
          if (/n[aã]o conforme/i.test(v)) {
            ncObj[nm] = 1; cNc++;
          } else if (/se aplica/i.test(v)) {
            naObj[nm] = 1; cNa++;
          } else if (/conforme/i.test(v)) {
            okObj[nm] = 1; cOk++;
          }
        });

        var rawDate = iD >= 0 ? String(row[iD] || '') : '';
        var rawMonth = iM >= 0 ? String(row[iM] || '') : '';
        var dateInfo = parseDateMonthYear(rawDate, rawMonth);

        var irr = cNc > 0;
        if (iI >= 0 && row[iI]) {
          irr = /^sim/i.test(norm(row[iI]));
        }

        parsedRows.push({
          src: detectedType,
          ym: dateInfo.ym,
          base: iB >= 0 ? String(row[iB] || '').trim() || 'OUTRA' : 'OUTRA',
          sup: iS >= 0 ? String(row[iS] || '').trim() || 'OUTRO' : 'OUTRO',
          aud: iA >= 0 ? String(row[iA] || '').trim() : '',
          tech: techVal,
          irr: irr,
          nc: ncObj,
          ok: okObj,
          na: naObj,
          cNc: cNc,
          cOk: cOk,
          cNa: cNa,
          d: dateInfo.d, // DAY NEVER APPEARS! Formatted as 'jul/2026', 'mai/2026', etc.
          p: iP >= 0 ? String(row[iP] || '').trim() || 'S/N' : 'S/N',
          o: iO >= 0 ? String(row[iO] || '').trim() : '',
          f: []
        });
      }

      if (!parsedRows.length) {
        throw new Error('Nenhum registro válido pôde ser extraído da planilha.');
      }

      DATA_SOURCES.unshift({
        id: Date.now() + Math.random(),
        name: sourceName,
        kind: kind || 'Arquivo Importado',
        type: detectedType,
        rows: parsedRows
      });

      return parsedRows.length;
    }

    if ($('btnStandaloneDrive')) {
      $('btnStandaloneDrive').addEventListener('click', function() {
        if (!isAdmin) {
          alert('Apenas o administrador guiomar.ost pode importar planilhas.');
          return;
        }
        var url = ($('standaloneDriveUrl').value || '').trim();
        if (!url) {
          alert('Por favor, informe o link da planilha do Google Drive.');
          return;
        }
        var idMatch = url.match(/\/d\/([\w-]+)/) || url.match(/^([\w-]{20,})$/);
        if (!idMatch) {
          alert('Link do Google Drive inválido. Verifique o link.');
          return;
        }
        var sheetId = idMatch[1];
        var gidMatch = url.match(/gid=(\d+)/);
        var gid = gidMatch ? gidMatch[1] : null;

        var fb = $('uploadFeedback');
        fb.style.display = 'block';
        fb.style.background = 'rgba(59,130,246,0.15)';
        fb.style.border = '1px solid rgba(59,130,246,0.3)';
        fb.style.color = '#60a5fa';
        fb.textContent = 'Buscando dados no Google Drive...';

        var exportUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv' + (gid ? '&gid=' + gid : '');
        fetch(exportUrl)
          .then(function(res) {
            if (!res.ok) throw new Error('Não foi possível acessar a planilha.');
            return res.text();
          })
          .then(function(csvText) {
            if (!csvText || /^\s*<(!doctype|html)/i.test(csvText)) {
              throw new Error('Certifique-se de que a planilha está compartilhada com "Qualquer pessoa com o link pode ler".');
            }
            var wb = XLSX.read(csvText, { type: 'string' });
            var sheet = wb.Sheets[wb.SheetNames[0]];
            var matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
            var count = processMatrixData(matrix, 'Google Drive (' + sheetId.slice(0, 8) + '...)', 'Google Drive');
            try { localStorage.setItem('fttx_data_sources', JSON.stringify(DATA_SOURCES)); } catch(e){}
            renderSourcesList();
            populateFilterOptions();
            renderUI();
            fb.style.background = 'rgba(34,197,94,0.15)';
            fb.style.border = '1px solid rgba(34,197,94,0.3)';
            fb.style.color = '#4ade80';
            fb.textContent = 'Sucesso! ' + count + ' registros importados do Google Drive.';
            $('standaloneDriveUrl').value = '';
          })
          .catch(function(err) {
            fb.style.background = 'rgba(239,68,68,0.15)';
            fb.style.border = '1px solid rgba(239,68,68,0.3)';
            fb.style.color = '#fca5a5';
            fb.textContent = 'Erro ao buscar no Drive: ' + err.message + ' Dica: Você também pode baixar como .xlsx e enviar diretamente.';
          });
      });
    }

    $('excelFileInput').addEventListener('change', function(e) {
      if (!isAdmin) {
        alert('Apenas o administrador guiomar.ost pode enviar arquivos.');
        return;
      }
      var files = e.target.files;
      if (!files || !files.length) return;
      var fb = $('uploadFeedback');
      fb.style.display = 'block';
      fb.style.background = 'rgba(59,130,246,0.15)';
      fb.style.border = '1px solid rgba(59,130,246,0.3)';
      fb.style.color = '#60a5fa';
      fb.textContent = 'Processando ' + files.length + ' arquivo(s)...';

      var loadedCount = 0;
      var processedFiles = 0;

      for (var fIdx = 0; fIdx < files.length; fIdx++) {
        (function(file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            try {
              var data = new Uint8Array(evt.target.result);
              var wb = XLSX.read(data, { type: 'array' });
              var sheetName = wb.SheetNames.find(function(s) { return /respostas/i.test(s); }) || wb.SheetNames[0];
              var sheet = wb.Sheets[sheetName];
              var matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
              
              var count = processMatrixData(matrix, file.name, /\.xlsx?$/i.test(file.name) ? 'Arquivo Excel' : 'Arquivo CSV');
              loadedCount += count;
            } catch (err) {
              alert('Erro no arquivo ' + file.name + ': ' + err.message);
            }

            processedFiles++;
            if (processedFiles === files.length) {
              try { localStorage.setItem('fttx_data_sources', JSON.stringify(DATA_SOURCES)); } catch(e){}
              renderSourcesList();
              populateFilterOptions();
              renderUI();
              fb.style.background = 'rgba(34,197,94,0.15)';
              fb.style.border = '1px solid rgba(34,197,94,0.3)';
              fb.style.color = '#4ade80';
              fb.textContent = 'Sucesso! ' + loadedCount + ' novos registros carregados.';
            }
          };
          reader.readAsArrayBuffer(file);
        })(files[fIdx]);
      }
      e.target.value = '';
    });

    // Background contrast slider handling
    var contrastSlider = $('contrastSlider');
    var bgOverlay = $('bgOverlayLayer');
    if (contrastSlider && bgOverlay) {
      contrastSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        bgOverlay.style.opacity = (1 - val);
        try { localStorage.setItem('fttx_bg_opacity', val); } catch(err){}
      });
      var savedOp = localStorage.getItem('fttx_bg_opacity');
      if (savedOp !== null) {
        contrastSlider.value = savedOp;
        bgOverlay.style.opacity = (1 - parseFloat(savedOp));
      }
    }

    populateFilterOptions();
    renderUI();
    updateAuthStatus();
  </script>
</body>
</html>`;
}
