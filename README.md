# SEBRATEL - Dashboard de Auditoria FTTX

Sistema corporativo de auditoria de qualidade da rede FTTX da **SEBRATEL Telecom**. O aplicativo consolida auditorias de campo, calcula indicadores de conformidade (93,0% Conformes vs 7,0% Não Conformes), avalia desempenho de supervisores e técnicos, plota gráficos interativos e oferece importação/exclusão de planilhas Excel (.xlsx) e links do Google Drive com controle de acesso para o administrador **guiomar.ost**.

---

## 🚀 Arquitetura & Tecnologias

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Motion
- **Visualização**: Gráficos dinâmicos com SVG responsivo e cards de KPI
- **Backend / Persistência**: 
  - Banco de Dados JSON nativo persistente no servidor (`/api/sources`)
  - Compatibilidade nativa com **Google Cloud Firebase / Firestore** (`firestore.rules`, `firebase-blueprint.json`)
- **CI/CD**: GitHub Actions para deploy contínuo no Firebase Hosting

---

## 📁 Arquivos de Implantação Inclusos no Projeto

| Arquivo | Descrição |
| :--- | :--- |
| `firebase.json` | Configuração do Firebase Hosting (SPA rewrite) e Firestore |
| `.firebaserc` | Mapeamento do projeto Firebase padrão |
| `firestore.rules` | Regras de segurança de banco de dados (ABAC, proteção de admin) |
| `firestore.indexes.json` | Índices compostos para consultas no Firestore |
| `firebase-blueprint.json` | Definição estruturada de entidades e coleções do banco |
| `.github/workflows/deploy.yml` | Pipeline de CI/CD para deploy automático via GitHub Actions |
| `src/services/firebase.ts` | Serviço de integração e sincronização com o Firestore |

---

## 🛠️ Passo 1: Enviar o Código para o GitHub

Execute os comandos abaixo no seu terminal (computador ou servidor) dentro da pasta do projeto:

```bash
# 1. Inicializar o repositório Git local
git init

# 2. Adicionar todos os arquivos ao controle de versão
git add .

# 3. Criar o primeiro commit
git commit -m "feat: versão de produção SEBRATEL Auditoria FTTX com integração Firebase e GitHub Actions"

# 4. Renomear o branch principal para main
git branch -M main

# 5. Conectar com o seu repositório no GitHub (substitua com o link do seu repo)
# Exemplo: git remote add origin https://github.com/SEU_USUARIO/sebratel-auditoria-fttx.git
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# 6. Enviar para o GitHub
git push -u origin main
```

---

## 🔥 Passo 2: Criar e Configurar o Firebase (com Banco de Dados Firestore)

### 2.1 Criar o Projeto no Console do Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/) com a sua conta Google corporativa.
2. Clique em **"Adicionar projeto"** (ex: `sebratel-auditoria-fttx`).
3. No menu lateral esquerdo, vá em **Compilação (Build) ➜ Firestore Database**.
4. Clique em **Criar banco de dados**:
   - Selecione **Modo de produção** (Production mode).
   - Escolha o local (ex: `southamerica-east1` em São Paulo ou `us-east1`).
5. No menu lateral, vá em **Configurações do Projeto** (ícone da engrenagem) ➜ **Geral**:
   - Em "Seus aplicativos", clique no ícone **Web** (`</>`).
   - Dê o nome de `SEBRATEL Auditoria`.
   - Copie as credenciais geradas (`apiKey`, `projectId`, etc.).

### 2.2 Configurar as Variáveis de Ambiente Locais
Crie ou edite o arquivo `.env` na raiz do projeto com os valores do seu Firebase:

```bash
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="sebratel-auditoria-fttx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="sebratel-auditoria-fttx"
VITE_FIREBASE_STORAGE_BUCKET="sebratel-auditoria-fttx.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef"
```

---

## 💻 Passo 3: Comandos de Implantação no Firebase (Manual)

Instale a ferramenta oficial do Firebase e faça o deploy com um único comando:

```bash
# 1. Instalar o Firebase CLI globalmente
npm install -g firebase-tools

# 2. Efetuar login com a conta Google
firebase login

# 3. Associar o projeto (caso necessário)
firebase use sebratel-auditoria-fttx

# 4. Compilar o aplicativo e implantar (Hosting + Regras do Firestore + Índices)
npm run deploy:firebase
```

Se quiser implantar apenas o site ou apenas as regras do banco de dados:
```bash
# Apenas o site no Firebase Hosting:
npm run deploy:hosting

# Apenas as regras de segurança e índices do Firestore:
npm run deploy:firestore
```

---

## 🤖 Passo 4: Automação Total com GitHub Actions (CI/CD)

O arquivo `.github/workflows/deploy.yml` já está pronto no projeto. Sempre que você fizer um `git push` no GitHub, o deploy será feito automaticamente no Firebase Hosting!

Para ativar:
1. No seu repositório do GitHub, vá em **Settings ➜ Secrets and variables ➜ Actions**.
2. Clique em **New repository secret**.
3. Obtenha a chave de serviço do Firebase executando no terminal:
   ```bash
   firebase init hosting:github
   ```
   *(O assistente criará automaticamente a secret `FIREBASE_SERVICE_ACCOUNT_...` no seu GitHub)*.
4. Adicione também as seguintes Secrets com os dados do `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

---

## 🌐 Incorporação no Google Sites

Para exibir o aplicativo completo dentro de qualquer página interna do Google Sites:
1. Abra o **Google Sites** em modo edição.
2. Clique em **Inserir** ➜ **Incorporar** (`< >`) ➜ aba **Por URL**.
3. Insira o endereço do Firebase Hosting (ex: `https://sebratel-auditoria-fttx.web.app`) ou do Cloud Run.
4. Redimensione o bloco e publique.

---

## 💬 Prompts Prontos para Assistentes de IA (ChatGPT, Claude, Cursor)

Você pode copiar e colar qualquer um dos prompts abaixo para solicitar alterações ou melhorias futuras:

### Prompt 1: Adicionar Novo Cálculo de Indicador
```text
Atue como desenvolvedor sênior React/TypeScript. No projeto de Auditoria FTTX da Sebratel, preciso adicionar um novo indicador no dashboard:
- Nome do indicador: [INFORME O NOME, ex: "Taxa de Resolução por Supervisor"]
- Fórmula de cálculo: [INFORME A FÓRMULA, ex: "Total de Auditorias Conformes dividido pelo Total Geral da Base"]
- Exibição: Criar um novo card no componente KPICards.tsx com cor personalizada e ícone relevante da biblioteca lucide-react.
Mantenha a reatividade de acordo com os filtros selecionados (Mês/Ano, Base, Supervisor, Técnico, Auditor).
```

### Prompt 2: Atualizar Regras de Segurança do Firestore
```text
Atue como arquiteto de segurança Firebase. No arquivo firestore.rules do projeto Sebratel Auditoria, adicione uma nova regra para a coleção 'relatorios_mensais'. Apenas administradores com e-mail do domínio @sebratel.com.br ou guiomar.kafer@sebratel.com.br podem criar ou alterar relatórios, e qualquer usuário autenticado pode consultar (get e list). Valide que o tamanho do documento não ultrapasse 500KB e que a data de criação use request.time.
```

### Prompt 3: Criar um Novo Filtro de Pesquisa Avançado
```text
No projeto Sebratel Auditoria FTTX, crie um novo filtro no componente FilterBar.tsx para permitir filtrar por "Tipo de Falha Mais Frequente" (itens não conformes como ancoragem, sangria, fusão, conectorização, etc). Ao selecionar uma falha, todos os gráficos e cards de técnicos e supervisores devem atualizar instantaneamente com os dados correspondentes.
```

---

## 🔒 Acesso Administrativo
- **Usuário**: `guiomar.ost`
- **Senha**: `123`
- **Permissões**:
  - Usuários sem login: visualizam dashboards, gráficos, filtros, exportação e relatórios.
  - Administrador `guiomar.ost`: acesso liberado aos botões dourados **`[📥 Importar Planilha]`** e **`[🗑️ Excluir Planilhas]`**, sincronizando em tempo real com todos os acessos.
