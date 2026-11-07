# 📘 Tutorial Definitivo: Implantação Completa no Firebase (Frontend, Backend & Banco em Tempo Real)

Este guia prático ensina o passo a passo exato para publicar o **SEBRATEL Auditoria FTTX** no Google Firebase, desde o login no terminal até a publicação do Frontend, Backend (Cloud Functions) e Banco de Dados (Firestore e Realtime Database) funcionando em sincronia na nuvem.

---

## 📋 Pré-requisitos

1. **Node.js 20+** instalado no seu computador.
2. Conta Google com acesso ao [Firebase Console](https://console.firebase.google.com/).
3. A pasta deste projeto descompactada ou clonada no seu computador.

---

## 🛠️ ETAPA 1: Login no Firebase pelo Terminal

Abra o terminal (Prompt de Comando, PowerShell ou Terminal do VS Code) dentro da pasta do projeto e execute:

```bash
# 1. Instalar a ferramenta oficial de linha de comando do Firebase globalmente
npm install -g firebase-tools

# 2. Realizar login na sua conta Google
firebase login
```

> **O que vai acontecer**: Uma janela do seu navegador abrirá automaticamente. Selecione a sua conta Google (`guiomar.kafer@sebratel.com.br` ou sua conta corporativa) e clique em **Permitir**. O terminal exibirá: `✔ Success! Logged in as seu-email@...`.

---

## ☁️ ETAPA 2: Criar o Projeto no Firebase Console

1. Acesse o **[Console do Firebase](https://console.firebase.google.com/)**.
2. Clique no card **"Adicionar projeto"** (ou *Create a project*).
3. Digite o nome: `sebratel-auditoria-fttx` (ou o nome que preferir).
4. *(Opcional)* Desmarque ou mantenha o Google Analytics e clique em **Criar projeto**.
5. Quando o projeto estiver pronto, clique em **Continuar**.

---

## 🗄️ ETAPA 3: Ativar o Banco de Dados na Nuvem

Você pode escolher usar o **Realtime Database** (mais rápido e com importação em 1 clique) ou o **Cloud Firestore** (ou ambos):

### Opção A: Firebase Realtime Database (Recomendada - Mais Fácil)
1. No menu lateral do Firebase Console, vá em **Compilação (Build)** ➜ **Realtime Database**.
2. Clique em **Criar banco de dados**:
   - Escolha o local: `us-central1`.
   - Escolha **Iniciar no modo bloqueado**.
   - Clique em **Ativar**.
3. **Importar a base completa da Sebratel**:
   - No painel do banco, clique nos **três pontinhos verticais (⋮)** no canto superior direito.
   - Selecione **"Importar JSON"**.
   - Escolha o arquivo `firebase-realtime-database-export.json` presente na raiz do projeto.
   - Clique em **Importar**. Toda a árvore com os 2.813 registros e métricas de 93% conformes será carregada instantaneamente!
4. Copie a URL do seu banco exibida no topo (ex: `https://sebratel-auditoria-fttx-default-rtdb.firebaseio.com/`).

### Opção B: Cloud Firestore
1. No menu lateral, vá em **Compilação (Build)** ➜ **Firestore Database**.
2. Clique em **Criar banco de dados**:
   - Modo de produção.
   - Local: `southamerica-east1` (São Paulo) ou `us-east1`.
   - Clique em **Ativar**.

---

## 🔑 ETAPA 4: Configurar as Credenciais no Arquivo `.env`

No Firebase Console, acesse a engrenagem **Configurações do Projeto** ➜ **Geral**:
1. Na seção "Seus aplicativos", clique no ícone Web **`</>`**.
2. Digite o apelido: `SEBRATEL Web` e registre o app.
3. Copie as chaves do objeto `firebaseConfig`.
4. No seu computador, crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY="AIzaSyBxxxxxx..."
VITE_FIREBASE_AUTH_DOMAIN="sebratel-auditoria-fttx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="sebratel-auditoria-fttx"
VITE_FIREBASE_DATABASE_URL="https://sebratel-auditoria-fttx-default-rtdb.firebaseio.com"
VITE_FIREBASE_STORAGE_BUCKET="sebratel-auditoria-fttx.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef..."
```

---

## 🔗 ETAPA 5: Associar o Projeto no Terminal

No terminal, vincule a pasta do projeto ao projeto recém-criado no Firebase:

```bash
# Conectar ao projeto do Firebase
firebase use sebratel-auditoria-fttx
```

*(Se o seu projeto tiver outro ID no Firebase, use: `firebase use --add` e selecione-o na lista).*

---

## 🚀 ETAPA 6: Publicação Completa (Frontend, Backend & Regras)

Execute os comandos de deploy:

### 1. Publicar Frontend (Vite) no Firebase Hosting:
```bash
npm run deploy:hosting
```
> O comando roda automaticamente `vite build` compilando os arquivos para `dist/` e publica no CDN global do Firebase com SSL/HTTPS gratuito.

### 2. Publicar as Regras de Segurança do Banco de Dados:
```bash
# Publicar regras do Realtime Database:
npm run deploy:rtdb

# Publicar regras do Firestore:
npm run deploy:firestore
```

### 3. Publicar o Backend (Cloud Functions com Express):
```bash
# Acessar a pasta functions e instalar dependências do backend
cd functions && npm install && cd ..

# Publicar as funções serverless
npm run deploy:functions
```

### 4. Ou publicar TUDO de uma única vez:
```bash
npm run deploy:all
```

---

## ✅ ETAPA 7: Testar e Validar o Aplicativo Funcional

Ao final da publicação, o terminal exibirá o link público definitivo:
```text
✔  Deploy complete!
Hosting URL: https://sebratel-auditoria-fttx.web.app
```

Abra o link no navegador e faça os testes:
1. **Visualização Pública**:
   - A página carrega com o fundo oficial da Sebratel.
   - O indicador geral exibe **93,0% Conformes (21.057)** e **7,0% Não Conformes (1.586)**.
   - Todos os filtros de Mês/Ano, Base, Supervisor e Técnico funcionam com gráficos dinâmicos.
2. **Acesso do Administrador**:
   - Clique em **Entrar** no canto superior direito.
   - Usuário: `guiomar.ost`
   - Senha: `123`
   - A barra dourada de ações e o botão **`[📂 Importar / Gerenciar Planilhas]`** aparecem.
3. **Sincronização em Nuvem em Tempo Real**:
   - Importe uma nova planilha Excel ou adicione um link do Google Drive.
   - Os dados são salvos na nuvem imediatamente.
   - Abra o mesmo link em outro navegador ou celular: os novos dados já estarão visíveis instantaneamente sem recarregar a página!

---

## 🌐 ETAPA 8: Incorporar no Google Sites da Empresa

1. No seu **Google Sites**, clique em **Inserir** ➜ **Incorporar** (`< >`).
2. Cole o link do seu app publicado:
   ```text
   https://sebratel-auditoria-fttx.web.app
   ```
3. Ajuste a largura/altura para preencher a tela e publique o Google Sites.
