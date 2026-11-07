/**
 * Firebase Service & Firestore Integration
 * 
 * Permite que a aplicação conecte diretamente ao Google Firebase / Cloud Firestore
 * quando as variáveis de ambiente VITE_FIREBASE_* estiverem configuradas, ou opere
 * em modo híbrido com o backend Express integrado.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, Firestore } from 'firebase/firestore';
import { DataSource } from '../types/audit';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let dbInstance: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (!dbInstance) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      dbInstance = getFirestore(app);
    } catch (e) {
      console.warn('Erro ao inicializar Firebase Firestore:', e);
      return null;
    }
  }
  return dbInstance;
}

/**
 * Salva ou atualiza uma fonte de dados no Firestore
 */
export async function syncSourceToFirestore(source: DataSource): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, 'sources', String(source.id));
    await setDoc(docRef, {
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
    console.error('Falha ao salvar no Firestore:', err);
    return false;
  }
}

/**
 * Remove uma fonte de dados do Firestore
 */
export async function deleteSourceFromFirestore(sourceId: number): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, 'sources', String(sourceId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Falha ao remover do Firestore:', err);
    return false;
  }
}

/**
 * Carrega todas as fontes de dados do Firestore
 */
export async function loadSourcesFromFirestore(): Promise<DataSource[] | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, 'sources'));
    const items: DataSource[] = [];
    querySnapshot.forEach((d) => {
      items.push(d.data() as DataSource);
    });
    return items.sort((a, b) => a.id - b.id);
  } catch (err) {
    console.error('Falha ao ler fontes do Firestore:', err);
    return null;
  }
}
