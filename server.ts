import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getInitialEmbeddedRecords } from './src/utils/auditEngine';
import { DataSource } from './src/types/audit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Gemini analysis endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, contextType, targetName, targetMetrics } = req.body;

    if (!prompt && !targetMetrics) {
      res.status(400).json({ error: 'Parâmetros insuficientes para análise.' });
      return;
    }

    if (!apiKey || !aiClient) {
      res.status(503).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Utilize a análise inteligente local.',
        fallback: true,
      });
      return;
    }

    const systemInstruction = `Você é um Engenheiro Sênior Especialista em Garantia da Qualidade Técnica de Redes Ópticas FTTx (GPON) da Sebratel Telecom.
Sua missão é analisar dados de auditorias técnicas de campo (tanto instalações Online quanto vistorias Offline) e gerar pareceres técnicos detalhados, acionáveis, didáticos e motivadores para instaladores e supervisores de campo.

Itens comuns de auditoria e seu impacto técnico:
1. Local da ONT: ventilação, fixação, longe de fontes de calor/umidade.
2. Nível de sinal Óptico: atenuação dentro da janela GPON (-15dBm a -25dBm), reflexões.
3. Limpeza da fibra: uso de caneta limpadora one-click e álcool isopropílico no conector antes do acoplamento.
4. Identificação na CTO: plaquetas com porta, data e matrícula do instalador para evitar desconexões indevidas.
5. Passagem e ancoragem do cabo drop: esticadores tipo cunha, raio de curvatura mínimo, fixação em postes e fachadas.
6. Plaquinhas de identificação no cliente e na CTO.
7. Acabamento interno: roseta óptica, cabo acomodado, visual limpo na residência.
8. Uso indevido de emenda: emendas clandestinas ou mecânicas mal executadas que geram perdas.
9. Configurações de Wi-Fi: canais sem sobreposição (2.4GHz e 5GHz), segurança WPA2/WPA3, potência.
10. Sinal no app RX ONU x RX OLT: divergências indicando problema de conectorização ou atenuação de fusão.

Instruções de resposta:
- Linguagem em Português do Brasil (PT-BR), profissional e objetiva.
- Formate a resposta em Markdown com títulos claros (###), tópicos em bullet points e tabelas ou destaques quando relevante.
- Estrutura esperada:
  1. Diagnóstico Geral do Desempenho (Taxa de conformidade e gravidade dos desvios).
  2. Principais Causas Raiz e Impactos Operacionais (por que o erro ocorre e o risco para o cliente/rede).
  3. Plano de Ação Prático & Treinamento Recomendado (passo a passo para zerar as não conformidades).
  4. Mensagem de Feedback e Orientação Direta para o Profissional/Equipe.`;

    const userPrompt = prompt || `Analise os seguintes dados de auditoria para ${contextType === 'supervisor' ? 'o supervisor' : 'o instalador'} "${targetName}":
${JSON.stringify(targetMetrics, null, 2)}
Por favor forneça um diagnóstico técnico completo, pontos críticos de atenção e recomendações prioritárias para melhoria.`;

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
        },
      });
    } catch (genErr: any) {
      console.warn('Gemini generateContent transient error:', genErr?.message || genErr);
      res.json({
        success: false,
        fallback: true,
        error: 'O modelo Gemini está com alta demanda momentânea. A análise inteligente local foi ativada.',
      });
      return;
    }

    res.json({
      success: true,
      text: response.text || 'Análise concluída com sucesso.',
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Erro na chamada Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Falha ao processar análise via Gemini.',
      fallback: true,
    });
  }
});

// Proxy for Google Drive spreadsheet export to avoid CORS issues
app.post('/api/drive/fetch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL da planilha não fornecida.' });
      return;
    }

    // Extract sheet ID and gid
    const idMatch = url.match(/\/d\/([\w-]+)/) || url.match(/^([\w-]{20,})$/);
    if (!idMatch) {
      res.status(400).json({ error: 'Link do Google Drive inválido. Verifique o ID da planilha.' });
      return;
    }

    const sheetId = idMatch[1];
    const gidMatch = url.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    const urlsToTry = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Respostas ao formulário 1')}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
    ];

    let csvText = '';
    let success = false;
    let lastError = '';

    for (const fetchUrl of urlsToTry) {
      try {
        const fetchRes = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        if (fetchRes.ok) {
          const text = await fetchRes.text();
          if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
            csvText = text;
            success = true;
            break;
          }
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!success || !csvText) {
      res.status(422).json({
        error:
          'Não foi possível extrair os dados da planilha do Google Drive. Certifique-se de que a planilha está compartilhada com "Qualquer pessoa com o link pode ler" ou faça o download como .xlsx/.csv no computador e faça o upload direto.',
        details: lastError,
      });
      return;
    }

    res.json({
      success: true,
      sheetId,
      csv: csvText,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar planilha no Drive.' });
  }
});

// Centralized Persistent Database for Spreadsheets (shared among all users)
const DB_DIR = path.resolve(__dirname, 'src/data');
const DB_FILE = path.resolve(DB_DIR, 'sources_db.json');

function getInitialDefaultSources(): DataSource[] {
  return [
    {
      id: 1,
      name: 'Base Oficial Sebratel (Online + Offline)',
      kind: 'Embutido',
      type: 'Online',
      rows: getInitialEmbeddedRecords(),
      loadedAt: 'Oficial',
    },
  ];
}

let cachedSources: DataSource[] | null = null;

function loadSources(): DataSource[] {
  if (cachedSources && cachedSources.length > 0) return cachedSources;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedSources = parsed;
        return cachedSources;
      }
    }
  } catch (err) {
    console.error('Erro ao ler fontes do disco, restaurando base padrão:', err);
  }

  const def = getInitialDefaultSources();
  saveSources(def);
  return def;
}

function saveSources(sources: DataSource[]): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(sources), 'utf-8');
    cachedSources = sources;
  } catch (err) {
    console.error('Erro ao salvar fontes no disco:', err);
  }
}

// 1. Get all active data sources
app.get('/api/sources', (_req: Request, res: Response) => {
  try {
    const sources = loadSources();
    res.json({ success: true, sources });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao carregar fontes do servidor.' });
  }
});

// 2. Add or update a data source (admin only)
app.post('/api/sources', (req: Request, res: Response): void => {
  try {
    const { source, adminPassword } = req.body;
    const headerPass = req.headers['x-admin-password'];
    if (adminPassword !== '123' && headerPass !== '123') {
      res.status(403).json({
        error: 'Acesso restrito. Somente o administrador guiomar.ost (senha: 123) pode adicionar planilhas ao servidor.',
      });
      return;
    }

    if (!source || !source.name || !Array.isArray(source.rows)) {
      res.status(400).json({ error: 'Estrutura da planilha inválida.' });
      return;
    }

    const current = loadSources();
    // Add new source and update
    const updated = [source, ...current.filter((s) => s.id !== source.id)];
    saveSources(updated);
    res.json({ success: true, sources: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao salvar planilha no servidor.' });
  }
});

// 3. Delete a data source (admin only)
app.delete('/api/sources/:id', (req: Request, res: Response): void => {
  try {
    const adminPassword = (req.query.adminPassword as string) || (req.headers['x-admin-password'] as string);
    if (adminPassword !== '123') {
      res.status(403).json({
        error: 'Acesso restrito. Somente o administrador guiomar.ost (senha: 123) pode excluir planilhas do servidor.',
      });
      return;
    }

    const targetId = parseFloat(req.params.id);
    const current = loadSources();
    const updated = current.filter((s) => s.id !== targetId);
    saveSources(updated);
    res.json({ success: true, sources: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao excluir planilha no servidor.' });
  }
});

// 4. Reset to default base (admin only)
app.post('/api/sources/reset', (req: Request, res: Response): void => {
  try {
    const { adminPassword } = req.body;
    const headerPass = req.headers['x-admin-password'];
    if (adminPassword !== '123' && headerPass !== '123') {
      res.status(403).json({
        error: 'Acesso restrito. Somente o administrador guiomar.ost (senha: 123) pode restaurar a base do servidor.',
      });
      return;
    }

    const def = getInitialDefaultSources();
    saveSources(def);
    res.json({ success: true, sources: def });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao restaurar fontes no servidor.' });
  }
});

// 5. Export formatted JSON for Firebase Realtime Database
app.get('/api/export-rtdb', (req: Request, res: Response): void => {
  try {
    const current = loadSources();
    const sourcesMap: Record<string, DataSource> = {};
    let totalRecords = 0;
    let totalOk = 0;
    let totalNc = 0;
    let totalNa = 0;

    current.forEach((s) => {
      sourcesMap[String(s.id)] = s;
      if (Array.isArray(s.rows)) {
        totalRecords += s.rows.length;
        s.rows.forEach((r) => {
          totalOk += r.cOk || 0;
          totalNc += r.cNc || 0;
          totalNa += r.cNa || 0;
        });
      }
    });

    const total = totalOk + totalNc;
    const okPercent = total > 0 ? Number(((totalOk / total) * 100).toFixed(1)) : 93.0;
    const ncPercent = total > 0 ? Number(((totalNc / total) * 100).toFixed(1)) : 7.0;

    const payload = {
      sebratel_fttx: {
        metadata: {
          appName: 'SEBRATEL Auditoria FTTX',
          version: '1.0.0',
          company: 'SEBRATEL Telecom',
          exportedAt: new Date().toISOString(),
          adminContact: 'guiomar.kafer@sebratel.com.br',
          totalRecords,
          metrics: {
            totalItensAuditados: total,
            conformeCount: totalOk,
            naoConformeCount: totalNc,
            naoSeAplicaCount: totalNa,
            conformePercent: okPercent,
            naoConformePercent: ncPercent,
          },
        },
        sources: sourcesMap,
        settings: {
          brand: 'SEBRATEL',
          adminUser: 'guiomar.ost',
          allowPublicView: true,
          lastSync: new Date().toISOString(),
        },
      },
    };

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="sebratel_realtime_database.json"');
    }
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao exportar banco Realtime' });
  }
});

// Setup Vite or static serving
async function startServer() {
  app.use('/standalone', express.static(path.resolve(__dirname, 'public')));
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auditoria FTTx Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
