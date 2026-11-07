# 🔥 Guia Completo: Firebase Realtime Database (Exportação e Criação do Banco)

Este guia explica como criar o banco de dados no **Firebase Realtime Database**, exportar a base completa daqui e importá-la em 2 cliques no Console do Firebase.

---

## 📦 Arquivos Gerados no Projeto para o Realtime Database

| Arquivo | Descrição |
| :--- | :--- |
| `firebase-realtime-database-export.json` | Arquivo JSON completo pronto para ser importado no Firebase Console |
| `database.rules.json` | Regras de segurança para leitura pública/empresa e escrita restrita ao administrador |
| `src/services/realtimeDb.ts` | Serviço cliente com listener em tempo real e sincronização contínua |
| `scripts/generate-rtdb-export.mjs` | Script para regerar o JSON exportado sempre que quiser (`npm run export:rtdb`) |
| `scripts/seed-rtdb.mjs` | Script para carregar os dados no Realtime Database via linha de comando |

---

## 🎯 Método 1: Exportar e Importar no Console do Firebase (Mais Fácil - Sem Terminal)

### Passo 1: Obter o Arquivo JSON
Você tem 3 formas simples de pegar o arquivo JSON exportado:
1. **Pelo Aplicativo**: Faça login como `guiomar.ost` (senha `123`), clique no botão dourado **`[📂 Importar / Gerenciar Planilhas]`** e clique em **`[⚡ Exportar JSON Firebase RTDB]`**.
2. **Pelo Link Direto**: Acesse `https://ais-pre-57fzb2su7kufkmnaawfp3l-656129884136.us-east1.run.app/api/export-rtdb?download=true`.
3. **No seu repositório local**: O arquivo `firebase-realtime-database-export.json` já está salvo na raiz da pasta do projeto.

---

### Passo 2: Criar o Banco no Console do Firebase
1. Acesse o **[Console do Firebase](https://console.firebase.google.com/)**.
2. Selecione ou crie seu projeto (ex: `sebratel-auditoria-fttx`).
3. No menu lateral esquerdo, vá em **Compilação (Build)** ➜ **Realtime Database**.
4. Clique em **Criar banco de dados**:
   - Escolha o local (ex: `Estados Unidos (us-central1)` ou o mais próximo disponível).
   - Escolha **Iniciar no modo bloqueado** (ou teste).
   - Clique em **Ativar**.

---

### Passo 3: Importar o JSON com 1 Clique
1. Na tela principal do **Realtime Database** no Firebase Console, clique nos **três pontinhos verticais (⋮)** no canto superior direito do painel de dados.
2. Selecione **"Importar JSON"** (ou *Import JSON*).
3. Selecione o arquivo `firebase-realtime-database-export.json`.
4. Clique em **Importar**.
5. **Pronto!** Toda a árvore hierárquica `sebratel_fttx` com todas as 2.813 auditorias e mais de 22.000 itens auditados estará carregada no seu Firebase com sincronização em tempo real.

---

## 🛡️ Passo 4: Aplicar as Regras de Segurança

Para que qualquer usuário da sua equipe possa consultar as auditorias e apenas o administrador possa modificar dados:

1. No Firebase Console ➜ **Realtime Database** ➜ aba **Regras** (Rules).
2. Cole o conteúdo do arquivo `database.rules.json`:
```json
{
  "rules": {
    "sebratel_fttx": {
      ".read": true,
      ".write": "auth != null && (auth.token.email === 'guiomar.kafer@sebratel.com.br' || auth.token.email.matches('.*@sebratel\\\\.com\\\\.br$'))",
      "sources": {
        ".read": true,
        ".write": "auth != null && (auth.token.email === 'guiomar.kafer@sebratel.com.br' || auth.token.email.matches('.*@sebratel\\\\.com\\\\.br$'))"
      }
    }
  }
}
```
3. Clique em **Publicar**.

*(Ou, se estiver usando o terminal, execute `npm run deploy:rtdb`).*

---

## ⚡ Método 2: Importar via Linha de Comando (Automático)

Se preferir enviar tudo pelo terminal sem abrir o navegador:

```bash
# Executar o script passando a URL do seu Realtime Database:
node scripts/seed-rtdb.mjs https://SEU-PROJETO-default-rtdb.firebaseio.com
```

---

## 🔄 Conectar o Frontend Diretamente ao Realtime Database

Para que o aplicativo web consuma os dados diretamente do Firebase Realtime Database em vez do servidor local, adicione a variável no `.env`:

```env
VITE_FIREBASE_API_KEY="sua_chave_aqui"
VITE_FIREBASE_PROJECT_ID="sebratel-auditoria-fttx"
VITE_FIREBASE_DATABASE_URL="https://sebratel-auditoria-fttx-default-rtdb.firebaseio.com"
```

O serviço `src/services/realtimeDb.ts` detectará a URL e ativará a sincronização em tempo real automaticamente.
