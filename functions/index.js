const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json({ limit: '50mb' }));

// Helper: Obter ou inicializar fontes no Firestore
async function getSourcesFromDb() {
  const snapshot = await db.collection('sources').orderBy('id', 'desc').get();
  if (snapshot.empty) {
    return [];
  }
  const items = [];
  snapshot.forEach((doc) => items.push(doc.data()));
  return items;
}

// 1. GET /api/sources - Retorna todas as planilhas para qualquer usuário
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await getSourcesFromDb();
    res.json({ success: true, sources });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao carregar fontes' });
  }
});

// 2. POST /api/sources - Adicionar nova planilha (Apenas Admin guiomar.ost com senha 123)
app.post('/api/sources', async (req, res) => {
  try {
    const { source, adminPassword } = req.body;
    const headerPass = req.headers['x-admin-password'];
    if (adminPassword !== '123' && headerPass !== '123') {
      return res.status(403).json({ error: 'Acesso restrito ao administrador guiomar.ost.' });
    }
    if (!source || !source.id) {
      return res.status(400).json({ error: 'Dados da planilha inválidos.' });
    }

    const docRef = db.collection('sources').doc(String(source.id));
    await docRef.set({
      ...source,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await getSourcesFromDb();
    res.json({ success: true, sources: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao salvar no Firestore' });
  }
});

// 3. DELETE /api/sources/:id - Excluir planilha (Apenas Admin)
app.delete('/api/sources/:id', async (req, res) => {
  try {
    const adminPassword = req.query.adminPassword || req.headers['x-admin-password'];
    if (adminPassword !== '123') {
      return res.status(403).json({ error: 'Acesso restrito ao administrador guiomar.ost.' });
    }

    const targetId = req.params.id;
    await db.collection('sources').doc(String(targetId)).delete();

    const updated = await getSourcesFromDb();
    res.json({ success: true, sources: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao excluir no Firestore' });
  }
});

// 4. POST /api/sources/reset - Restaurar base padrão
app.post('/api/sources/reset', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    const headerPass = req.headers['x-admin-password'];
    if (adminPassword !== '123' && headerPass !== '123') {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    // Limpar coleções
    const snapshot = await db.collection('sources').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    res.json({ success: true, sources: [] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao restaurar fontes' });
  }
});

exports.api = functions.https.onRequest(app);
