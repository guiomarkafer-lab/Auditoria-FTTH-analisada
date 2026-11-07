/**
 * Script para importar dados diretamente no Firebase Realtime Database via REST API
 * 
 * Uso:
 *   node scripts/seed-rtdb.mjs [URL_DO_BANCO] [AUTH_TOKEN_OPCIONAL]
 * 
 * Exemplo:
 *   node scripts/seed-rtdb.mjs https://sebratel-auditoria-fttx-default-rtdb.firebaseio.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const exportFile = path.resolve(rootDir, 'firebase-realtime-database-export.json');
if (!fs.existsSync(exportFile)) {
  console.error('Arquivo firebase-realtime-database-export.json não encontrado! Execute primeiro: npm run export:rtdb');
  process.exit(1);
}

const dbUrlArg = process.argv[2] || process.env.VITE_FIREBASE_DATABASE_URL;
if (!dbUrlArg) {
  console.log('--------------------------------------------------------------------------------');
  console.log('📌 INSTRUÇÃO DE USO DO SCRIPT:');
  console.log('node scripts/seed-rtdb.mjs <URL_DO_REALTIME_DATABASE> [AUTH_SECRET]');
  console.log('');
  console.log('Exemplo:');
  console.log('node scripts/seed-rtdb.mjs https://sebratel-auditoria-fttx-default-rtdb.firebaseio.com');
  console.log('--------------------------------------------------------------------------------');
  process.exit(0);
}

const cleanUrl = dbUrlArg.replace(/\/+$/, '');
const authSecret = process.argv[3] || '';
const endpoint = `${cleanUrl}/sebratel_fttx.json${authSecret ? `?auth=${authSecret}` : ''}`;

console.log(`🚀 Enviando dados para o Firebase Realtime Database em: ${endpoint}...`);

const payload = fs.readFileSync(exportFile, 'utf-8');
const data = JSON.parse(payload);

fetch(endpoint, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data.sebratel_fttx),
})
  .then(async (res) => {
    if (res.ok) {
      console.log('✅ Banco de Dados Firebase Realtime Database inicializado com sucesso!');
      console.log(`URL do banco: ${cleanUrl}`);
    } else {
      const errText = await res.text();
      console.error(`❌ Erro HTTP ${res.status}: ${errText}`);
      console.log('💡 Dica: Se o banco exigir autenticação, verifique se as regras em database.rules.json permitem escrita ou passe o auth token como 2º argumento.');
    }
  })
  .catch((err) => {
    console.error('❌ Falha na conexão com o Firebase:', err.message);
  });
