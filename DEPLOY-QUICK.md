# 🚀 DEPLOY GRÁTIS - Guia Simplificado (20 min)

## 📋 O que você vai fazer

```
1. Criar banco de dados (Supabase) ........... 5 min
2. Subir backend (Replit) .................. 10 min  
3. Subir frontend (Vercel) ................. 5 min
```

**Total: R$0** 💰

---

## PASSO 1: Banco de Dados (Supabase)

### 1️⃣ Criar conta
- Vá em https://supabase.com
- Clique "Sign Up"
- Use Google ou GitHub

### 2️⃣ Criar projeto
- Clique "New Project"
- Escolha senha (ex: `senhaForte123!`)
- Região: São Paulo
- Espere 3 min

### 3️⃣ Copiar URL
- Vá em "Settings" → "Database"
- Copie a string em "Connection string"
- Deve parecer: `postgresql://postgres:SENHA@host:5432/postgres?sslmode=require`

**✅ Banco criado!**

---

## PASSO 2: Backend (Replit)

### 1️⃣ Criar Repl
- Vá em https://replit.com
- Clique "Create Repl"
- Escolha "Node.js"
- Nome: `campus-news`

### 2️⃣ Importar código
No terminal do Replit, execute:
```bash
git clone https://github.com/seu-usuario/Campus-News-App.git
cd Campus-News-App
npm install
```

### 3️⃣ Adicionar secrets
- Clique no ícone de cadeado (Secrets)
- Adicione:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | Cola aqui a URL do Supabase |
| `JWT_SECRET` | `minha-chave-secreta-123` |
| `NODE_ENV` | `production` |
| `VITE_API_URL` | Deixe em branco por enquanto |

### 4️⃣ Rodar
- Clique no botão "Run" (verde)
- Backend está online!

### 5️⃣ Copiar URL
- Você verá uma URL como: `https://campus-news.replit.dev`
- **Copie isso!** Vai usar no Vercel

**✅ Backend rodando!**

---

## PASSO 3: Frontend (Vercel)

### 1️⃣ Fazer push no GitHub
```bash
git add .
git commit -m "Deploy grátis"
git push origin main
```

### 2️⃣ Conectar Vercel
- Vá em https://vercel.com
- Clique "New Project"
- Selecione seu repositório
- Clique "Import"

### 3️⃣ Adicionar variável
- Vá em "Environment Variables"
- Nome: `VITE_API_URL`
- Valor: Cola aqui a URL do Replit
  - Ex: `https://campus-news.replit.dev/api`

### 4️⃣ Deploy
- Clique "Deploy"
- Espera 2-3 min
- Pronto!

**✅ Frontend online!**

---

## 🎉 Sucesso!

Agora você tem:

```
Frontend: https://seu-projeto.vercel.app
Backend:  https://campus-news.replit.dev
Database: Supabase PostgreSQL
Custo:    R$0
```

### Login com:
- Email: `admin@campus.edu`
- Senha: `admin123`

---

## 💡 Para manter online 24/7

Replit tira seu projeto do ar se não for usado. Para evitar:

1. Vá em https://uptimerobot.com
2. Clique "Add Monitor"
3. URL: `https://seu-repl-name.replit.dev/api/health`
4. Check interval: 5 min
5. Pronto! Backend fica online 24/7 ✅

---

## 🆘 Problemas?

### Frontend não conecta com backend
- [ ] Verificar VITE_API_URL está correto (com `/api` no final)
- [ ] Testar: `https://seu-repl-name.replit.dev/api/health`

### Banco vazio
- [ ] Verificar DATABASE_URL está correto no Replit
- [ ] Restartar Replit (clique Run novamente)

### Replit desligou
- [ ] Usar UptimeRobot (ver acima)

---

## 📚 Próximas aulas?

Ver arquivo: [DEPLOY-FREE.md](./DEPLOY-FREE.md) (mais detalhado)

---

**Tudo pronto? Mostre pro professor! 🎓**
