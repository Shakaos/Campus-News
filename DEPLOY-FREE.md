# 🚀 Deploy Grátis: Vercel + Replit + Supabase

## 📋 Overview

```
Frontend           Backend            Database
Vercel             Replit             Supabase
react              express.js         PostgreSQL
vite               node.js            (Free 500MB)
(Automatic)        (Always on)        (14 days free)
```

**Custo Total: R$0** ✅

---

## PARTE 1️⃣: Supabase (Database) - 5 min

### Passo 1: Criar conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Sign Up"
3. Registre com email do Google ou GitHub

### Passo 2: Criar projeto
1. Clique "New Project"
2. Database Password: `senhaForte123!` (guarde em lugar seguro)
3. Região: São Paulo (br-sa-1)
4. Clique "Create new project" e espere 2-3 min

### Passo 3: Copiar Connection String
1. Vá em "Settings" → "Database"
2. Copie a string em "Connection string" (URI)
   ```
   postgresql://postgres:SENHA@host:5432/postgres?sslmode=require
   ```
3. **Guarde em local seguro!**

---

## PARTE 2️⃣: Replit (Backend) - 10 min

### Passo 1: Criar Repl
1. Acesse [replit.com](https://replit.com)
2. Clique "Create Repl"
3. Escolha "Node.js"
4. Nome: `campus-news-api`

### Passo 2: Importar Projeto
```bash
git clone https://github.com/seu-usuario/Campus-News-App.git
# OU crie um novo repositório
```

### Passo 3: Instalar Dependências
```bash
npm install
```

### Passo 4: Adicionar Secrets (Environment Variables)

1. Clique em "Secrets" (ícone de cadeado)
2. Adicione:

```
DATABASE_URL = postgresql://postgres:SENHA@host:5432/postgres?sslmode=require
JWT_SECRET = sua-chave-secreta-super-segura
NODE_ENV = production
PORT = 4001
VITE_API_URL = https://seu-repl-name.replit.dev/api
```

### Passo 5: Atualizar package.json
Certifique-se que tem:
```json
"scripts": {
  "server": "npx tsx server/index.ts",
  "start": "npm run server"
}
```

### Passo 6: Rodar Projeto
1. Clique em "Run" (botão verde no topo)
2. Backend está rodando! 🎉
3. URL: `https://seu-repl-name.replit.dev`

**Nota:** Guarde a URL do Repl! Vai usar no Vercel.

---

## PARTE 3️⃣: Vercel (Frontend) - 5 min

### Passo 1: Preparar GitHub
1. Faça push do código para GitHub:
```bash
git add .
git commit -m "Deploy config: Vercel + Replit + Supabase"
git push origin main
```

### Passo 2: Criar projeto Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique "New Project"
3. Selecione seu repositório no GitHub
4. Clique "Import"

### Passo 3: Configurar Environment Variables
1. Vá em "Environment Variables"
2. Adicione:

```
VITE_API_URL = https://seu-repl-name.replit.dev/api
```

### Passo 4: Deploy
1. Clique "Deploy"
2. Espere 2-3 min
3. Frontend pronto! ✅

**URL Final:** `https://seu-projeto.vercel.app`

---

## ✅ Checklist Final

- [ ] Supabase projeto criado
- [ ] DATABASE_URL copiada
- [ ] Replit project criado
- [ ] Environment variables adicionadas no Replit
- [ ] Backend rodando (`npm run server`)
- [ ] GitHub repository atualizado
- [ ] Vercel projeto criado
- [ ] Frontend deploy completo
- [ ] VITE_API_URL aponta para Replit

---

## 🧪 Testar Conexão

### 1. Backend Health Check
```bash
curl https://seu-repl-name.replit.dev/api/health
# Resultado esperado: {"ok": true, "service": "campus-news-api"}
```

### 2. Login
```bash
curl -X POST https://seu-repl-name.replit.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@campus.edu","password":"admin123"}'
```

### 3. Acessar Frontend
Abra: `https://seu-projeto.vercel.app`
Faça login com:
- Email: `admin@campus.edu`
- Senha: `admin123`

---

## 🔒 Segurança Pós-Deploy

### 1. Alterar Senhas Padrão
```bash
# No Supabase, execute SQL:
UPDATE users SET password = 'nova-senha-hasheada' 
WHERE email = 'admin@campus.edu';
```

### 2. Adicionar HTTPS
- Vercel: Automático ✅
- Replit: Automático ✅

### 3. Habilitar CORS Correto
No `server/index.ts`, atualize:
```typescript
app.use(cors({
  origin: ['https://seu-projeto.vercel.app', 'https://seu-repl-name.replit.dev'],
  credentials: true,
}));
```

---

## 📊 Limites Grátis

| Serviço | Limite | Observação |
|---------|--------|-----------|
| **Vercel** | Ilimitado | Redeployments automáticos |
| **Replit** | 100h/mês | ~4 dias ininterruptos |
| **Supabase** | 500MB | Database pequeno |

**Nota:** Para manter Replit sempre online, use [UptimeRobot](https://uptimerobot.com) (grátis)

---

## 🔄 Workflow de Desenvolvimento

```bash
# 1. Desenvolver localmente
npm run dev

# 2. Fazer commit
git add .
git commit -m "Feature: xyz"

# 3. Push para GitHub
git push origin main

# 4. Vercel faz deploy automático do frontend

# 5. Para backend, faça push também no Replit:
git pull upstream main  # No Replit
npm install
npm run server
```

---

## 🆘 Troubleshooting

### Vercel não conecta com Replit
- [ ] Verificar VITE_API_URL está correto
- [ ] Backend está rodando em Replit
- [ ] Testar: `curl https://seu-repl-name.replit.dev/api/health`

### Database vazia
- [ ] Verificar DATABASE_URL está correto
- [ ] Executar seed data manualmente em Supabase
- [ ] Verificar connection string no Supabase

### Replit keep-alive
Use [UptimeRobot](https://uptimerobot.com):
1. Criar monitor HTTP
2. URL: `https://seu-repl-name.replit.dev/api/health`
3. Check a cada 5 min
4. Replit fica online 24/7 ✅

---

## 📈 Próximas Melhorias

1. **Implementar Bcryptjs** para hash de senhas
2. **Rate Limiting** com Redis
3. **CDN** para images (Cloudinary grátis)
4. **Email** com SendGrid (grátis)
5. **Analytics** com Vercel Analytics (grátis)

---

## 🎉 Conclusão

**Campus News App está ONLINE!**

- Frontend: `https://seu-projeto.vercel.app`
- Backend: `https://seu-repl-name.replit.dev`
- Database: Supabase PostgreSQL

Custo total: **R$0** 🎊

---

**Próximos passos:**
1. Compartilhe URL com professor
2. Peça feedback
3. Implemente melhorias
4. Escale conforme necessário

**Boa sorte! 🚀**
