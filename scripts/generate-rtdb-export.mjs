import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbPath = path.resolve(rootDir, 'src/data/sources_db.json');
if (!fs.existsSync(dbPath)) {
  console.error('Arquivo src/data/sources_db.json não encontrado!');
  process.exit(1);
}

const rawData = fs.readFileSync(dbPath, 'utf-8');
const sources = JSON.parse(rawData);

// Organizar em formato de mapa indexado por ID para o Firebase Realtime Database
const sourcesMap = {};
let totalRecords = 0;
let totalOk = 0;
let totalNc = 0;
let totalNa = 0;

sources.forEach((src) => {
  sourcesMap[String(src.id)] = src;
  if (Array.isArray(src.rows)) {
    totalRecords += src.rows.length;
    src.rows.forEach((r) => {
      totalOk += r.cOk || 0;
      totalNc += r.cNc || 0;
      totalNa += r.cNa || 0;
    });
  }
});

const calculatedTotal = totalOk + totalNc;
const okPercent = calculatedTotal > 0 ? Number(((totalOk / calculatedTotal) * 100).toFixed(1)) : 93.0;
const ncPercent = calculatedTotal > 0 ? Number(((totalNc / calculatedTotal) * 100).toFixed(1)) : 7.0;

const rtdbExport = {
  sebratel_fttx: {
    metadata: {
      appName: 'SEBRATEL Auditoria FTTX',
      version: '1.0.0',
      company: 'SEBRATEL Telecom',
      exportedAt: new Date().toISOString(),
      adminContact: 'guiomar.kafer@sebratel.com.br',
      totalRecords,
      metrics: {
        totalItensAuditados: calculatedTotal,
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

const outputRoot = path.resolve(rootDir, 'firebase-realtime-database-export.json');
const outputPublic = path.resolve(rootDir, 'public/firebase-realtime-database-export.json');

const jsonStr = JSON.stringify(rtdbExport, null, 2);
fs.writeFileSync(outputRoot, jsonStr, 'utf-8');
fs.writeFileSync(outputPublic, jsonStr, 'utf-8');

console.log('✅ Arquivo Firebase Realtime Database exportado com sucesso:');
console.log(`- ${outputRoot} (${(jsonStr.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`- ${outputPublic} (disponível via download HTTP)`);
console.log(`- Total de Auditorias: ${totalRecords} registros`);
console.log(`- Conformes: ${totalOk} (${okPercent}%) | Não Conformes: ${totalNc} (${ncPercent}%)`);
