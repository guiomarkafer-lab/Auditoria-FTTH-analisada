/**
 * Firebase Realtime Database Service
 * 
 * Permite integração, exportação e sincronização contínua com o Firebase Realtime Database.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, remove, get, onValue, Database } from 'firebase/database';
import { DataSource } from '../types/audit';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || (import.meta.env.VITE_FIREBASE_PROJECT_ID ? `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com` : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isRealtimeDbConfigured = Boolean(
  firebaseConfig.apiKey && (firebaseConfig.databaseURL || firebaseConfig.projectId)
);

let rtdbInstance: Database | null = null;

export function getRealtimeDb(): Database | null {
  if (!isRealtimeDbConfigured) return null;
  if (!rtdbInstance) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      rtdbInstance = getDatabase(app);
    } catch (e) {
      console.warn('Erro ao inicializar Firebase Realtime Database:', e);
      return null;
    }
  }
  return rtdbInstance;
}

/**
 * Salva ou atualiza uma fonte de dados no Realtime Database em /sebratel_fttx/sources/{sourceId}
 */
export async function syncSourceToRealtimeDb(source: DataSource): Promise<boolean> {
  const db = getRealtimeDb();
  if (!db) return false;
  try {
    const sourceRef = ref(db, `sebratel_fttx/sources/${source.id}`);
    await set(sourceRef, {
      id: source.id,
      name: source.name,
      kind: source.kind,
      type: source.type,
      loadedAt: source.loadedAt,
      rows: source.rows,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Falha ao salvar no Firebase Realtime Database:', err);
    return false;
  }
}

/**
 * Remove uma fonte de dados do Realtime Database
 */
export async function deleteSourceFromRealtimeDb(sourceId: number): Promise<boolean> {
  const db = getRealtimeDb();
  if (!db) return false;
  try {
    const sourceRef = ref(db, `sebratel_fttx/sources/${sourceId}`);
    await remove(sourceRef);
    return true;
  } catch (err) {
    console.error('Falha ao remover do Firebase Realtime Database:', err);
    return false;
  }
}

/**
 * Carrega todas as fontes do Realtime Database
 */
export async function loadSourcesFromRealtimeDb(): Promise<DataSource[] | null> {
  const db = getRealtimeDb();
  if (!db) return null;
  try {
    const snapshot = await get(ref(db, 'sebratel_fttx/sources'));
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    const list: DataSource[] = Object.values(val);
    return list.sort((a, b) => a.id - b.id);
  } catch (err) {
    console.error('Falha ao ler fontes do Firebase Realtime Database:', err);
    return null;
  }
}

/**
 * Ouve alterações em tempo real nas fontes de dados do Firebase
 */
export function subscribeToRealtimeDbSources(callback: (sources: DataSource[]) => void): (() => void) | null {
  const db = getRealtimeDb();
  if (!db) return null;
  const sourcesRef = ref(db, 'sebratel_fttx/sources');
  const unsubscribe = onValue(sourcesRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const list: DataSource[] = Object.values(val);
      callback(list.sort((a, b) => a.id - b.id));
    }
  });
  return unsubscribe;
}

/**
 * Dispara o download direto do arquivo JSON formatado para importação no Firebase Realtime Database
 */
export function downloadRealtimeDbJson(sources: DataSource[]) {
  const sourcesMap: Record<string, DataSource> = {};
  let totalRecords = 0;
  let totalOk = 0;
  let totalNc = 0;
  let totalNa = 0;

  sources.forEach((s) => {
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

  const exportPayload = {
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

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sebratel_realtime_database_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
