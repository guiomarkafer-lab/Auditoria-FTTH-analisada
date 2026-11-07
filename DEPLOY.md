# ⚡ Guia Rápido de Comandos para Terminal (Cheat-Sheet)

Copie e cole os blocos de comandos abaixo no terminal do seu computador para subir o projeto no GitHub e no Firebase:

---

### 1. Inicializar e Enviar para o GitHub
```bash
git init
git add .
git commit -m "Publicação inicial Sebratel Auditoria FTTX"
git branch -M main
# Substitua o link abaixo pelo link do repositório criado no seu GitHub:
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

### 2. Login e Deploy no Firebase Hosting + Firestore
```bash
# Instalação do Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login no Google
firebase login

# Criar build de produção e enviar tudo (Site + Banco de Dados + Regras)
npm run deploy:firebase
```

---

### 3. Deploy com CI/CD Automático via GitHub
Ao conectar o GitHub com o Firebase:
```bash
firebase init hosting:github
```
*Responda `Y` para configurar o workflow automático; o arquivo `.github/workflows/deploy.yml` já está pronto e gerenciará as publicações automaticamente.*
