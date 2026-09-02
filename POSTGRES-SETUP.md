# 📖 Migração SQLite → PostgreSQL (Supabase)

## 🎯 Objetivo

Transformar aplicação de SQLite (desenvolvimento local) para PostgreSQL (produção em Supabase).

---

## 🔄 Como Funciona?

```typescript
// server/index.ts verifica:
if (process.env.DATABASE_URL) {
  // ✅ Produção: Usa PostgreSQL (Supabase)
  const pool = await initializeDatabase(); // db-postgres.ts
} else {
  // ✅ Desenvolvimento: Usa SQLite local
  const db = require('./db'); // db.ts
}
```

**Automático!** Nenhuma mudança de código necessária.

---

## 📝 Arquivos Modificados

### 1. `server/db-postgres.ts` (NOVO)
- Conexão PostgreSQL com Supabase
- Create tables automático
- Seed data automático
- Fallback para SQLite se DATABASE_URL vazio

### 2. `package.json` (ATUALIZADO)
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "@types/pg": "^8.11.5"
  }
}
```

### 3. `.env.example.prod` (NOVO)
Modelo para variáveis de produção:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

---

## 🚀 Setup Local (SQLite)

Sem fazer NADA, funciona:

```bash
npm install
npm run server
# Usa ./campus-news.db automaticamente
```

---

## 🌐 Setup Produção (PostgreSQL)

### No Replit:

1. **Copiar DATABASE_URL do Supabase**
   - Supabase → Settings → Database → Connection string

2. **Adicionar no Replit Secrets**
   ```
   DATABASE_URL = postgresql://postgres:senha@db.xxx.supabase.co:5432/postgres?sslmode=require
   ```

3. **Rodar**
   ```bash
   npm install
   npm run server
   ```

4. **Verificar logs**
   - Deve aparecer: `🚀 Using PostgreSQL from Supabase`

---

## ✅ Verificar Conexão

### 1. Health Check
```bash
curl https://seu-repl.replit.dev/api/health
# {"ok": true, "service": "campus-news-api"}
```

### 2. Login (seed data)
```bash
curl -X POST https://seu-repl.replit.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@campus.edu","password":"admin123"}'
```

### 3. Verificar no Supabase
- Supabase → SQL Editor
- Query: `SELECT COUNT(*) FROM users;`
- Deve retornar 3 usuários

---

## 🔑 Seed Data Automático

Quando PostgreSQL é inicializado pela primeira vez:

```sql
-- Usuários criados automaticamente
INSERT INTO users VALUES:
- ID: user-admin-1
  Email: admin@campus.edu
  Senha: admin123
  Role: admin

- ID: user-prof-1
  Email: professor@campus.edu
  Senha: prof123
  Role: professor

- ID: user-aluno-1
  Email: aluno@campus.edu
  Senha: aluno123
  Role: aluno
```

---

## 📊 Tabelas Criadas

| Tabela | Colunas | Descrição |
|--------|---------|-----------|
| `users` | 6 | Usuários (admin, professor, aluno) |
| `news` | 8 | Notícias do campus |
| `rooms` | 9 | Salas de aula |
| `queue_sectors` | 6 | Setores de fila |
| `queue_tickets` | 6 | Tickets de fila |
| `attendance_records` | 8 | Presença (novo) |
| `lab_reservations` | 8 | Laboratórios (novo) |
| `class_notices` | 8 | Avisos de classe (novo) |

---

## 🔐 Segurança

### Environment Variables (Replit Secrets)
```
✅ Não compartilhar DATABASE_URL
✅ Não fazer commit de .env
✅ JWT_SECRET mínimo 32 caracteres
✅ SSL ativado por padrão
```

### Supabase Security
```
✅ Row Level Security (RLS) - configure no Supabase
✅ Conexão SSL obrigatória
✅ Backups automáticos diários
✅ Autenticação OAuth disponível
```

---

## 🐛 Troubleshooting

### "Database connection refused"
```
❌ DATABASE_URL incorreta?
✅ Verificar em Supabase → Settings → Database
✅ Certifique que contém: ?sslmode=require
```

### "Relation 'users' does not exist"
```
❌ Tabelas não foram criadas?
✅ Verificar logs no Replit
✅ Restartar Replit (clique "Run")
✅ Verificar em Supabase → SQL Editor
```

### "too many connections"
```
❌ Pool limit atingido?
✅ Aumentar limite em Supabase
✅ Implementar connection pooling
```

---

## 📈 Monitoramento

### Logs Replit
```bash
# Ver logs em tempo real
tail -f replit.log

# Filtrar erros
grep ERROR replit.log
```

### Supabase Dashboard
1. Vá em Supabase → Database
2. Veja "Database Activity"
3. Monitore queries e performance

---

## 🔄 Rollback (Volta para SQLite)

Se algo deu errado:

```bash
# 1. Remove DATABASE_URL do Replit Secrets
# 2. Reinicia Replit
# 3. Volta a usar SQLite local
```

---

## 🎓 Próximos Passos

1. ✅ Implementar Rate Limiting
2. ✅ Adicionar Bcryptjs para senhas
3. ✅ Backup automático Supabase
4. ✅ Monitoring com Sentry
5. ✅ CDN para uploads

---

**PostgreSQL configurado com sucesso! 🎉**
