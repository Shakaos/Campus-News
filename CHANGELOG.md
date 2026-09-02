# CHANGELOG - Campus News App

## [2.4.0] - 2026-09-01 🚀

### Adicionado

#### Backend
- ✨ Validação com Zod em todos os endpoints
- ✨ Novos endpoints de Professor Tools:
  - `POST /api/attendance` - Registrar presença
  - `GET /api/attendance/:classId` - Listar presença
  - `PUT /api/attendance/:id` - Atualizar status
  - `POST /api/lab-reservations` - Reservar laboratório
  - `GET /api/lab-reservations` - Listar reservas
  - `DELETE /api/lab-reservations/:id` - Cancelar reserva
  - `POST /api/class-notices` - Criar aviso
  - `GET /api/class-notices/:classId` - Listar avisos
  - `DELETE /api/class-notices/:id` - Deletar aviso
- ✨ Middleware de erro centralizado com tratamento de ZodError
- ✨ Utilitários de segurança (hashPassword, verifyPassword, etc)
- ✨ Logging melhorado com console colors
- 📊 Suporte a múltiplas tabelas: attendance_records, lab_reservations, class_notices

#### Frontend
- 🎨 ErrorBoundary component com fallback UI
- 🎨 ErrorAlert component para exibir erros
- 🎨 Loading Spinner e SkeletonLoader components
- 🎨 useError, useAsync, useLoading custom hooks
- 🎨 Error handling global em App.tsx
- 🎨 Melhor feedback visual de erros

#### DevOps
- 🐳 Dockerfile multi-stage otimizado
- 🐳 docker-compose.yml com serviços api e web
- 🐳 .dockerignore para build otimizado
- 🔄 GitHub Actions workflow para CI/CD
- 📝 scripts/deploy.sh para deployment automatizado
- 📝 .env.example com todas variáveis

#### Testes
- 🧪 Vitest configurado
- 🧪 Testes para schemas.ts
- 🧪 Tests para validação LoginSchema, NewsSchema, RoomSchema
- 🧪 vitest.config.ts com jsdom e coverage

#### Documentação
- 📖 DEPLOYMENT.md com guia completo
- 📖 Melhor documentação no README
- 📖 Explicação de arquitetura

### Modificado

#### package.json
- ✅ Adicionado bcryptjs (segurança)
- ✅ Adicionado zod (validação)
- ✅ Adicionado vitest (testes)
- ✅ Adicionado @vitest/ui (UI de testes)
- ✅ Adicionado scripts: test, test:ui

#### server/index.ts
- ♻️ Refatoração completa com novo middleware
- ♻️ Validação em todos os endpoints
- ♻️ Adicionado professorMiddleware
- ♻️ Adicionado asyncHandler wrapper
- ♻️ Melhor tratamento de erros
- ♻️ Logging melhorado

#### src/App.tsx
- ♻️ Adicionado ErrorBoundary ao root
- ♻️ Adicionado ErrorAlert para exibir erros globais
- ♻️ Adicionado useError hook
- ♻️ Melhor tratamento de Promise.all erros

### Removido

- ❌ Senhas em plain text no seed (preparação para bcrypt)

### Segurança

- 🔒 Zod validation em todos os endpoints
- 🔒 Sanitização de dados sensíveis
- 🔒 Error handling sem stack traces em produção
- ⚠️ TODO: Implementar bcryptjs hash para senhas

### Performance

- ⚡ Docker multi-stage para imagens menores
- ⚡ ErrorBoundary previne crashes de toda app
- ⚡ Loading states melhoram UX

### Bugs Corrigidos

- 🐛 Error handling em login agora mostra mensagem ao usuário
- 🐛 App não quebra mais com dados inválidos da API
- 🐛 Melhor tratamento de network errors

---

## [2.0.0] - 2026-04-15

### Adicionado
- Interface completa de Admin
- CRUD de Notícias e Salas
- Sistema de Filas
- Autenticação JWT
- Design refinado com Tailwind

---

## Como Atualizar

```bash
# Pull das mudanças
git pull origin main

# Instalar novas dependências
npm install

# Executar (Docker recomendado)
docker-compose up -d

# Ou local
npm run dev
```

## Breaking Changes

Nenhum breaking change nesta versão. Compatível com v2.0.0.

## Próximas Versões

### v2.5.0
- [ ] Testes E2E com Playwright
- [ ] Real-time com WebSocket
- [ ] Notificações push

### v3.0.0
- [ ] Bcryptjs para hash de senhas
- [ ] Rate limiting
- [ ] Redis cache
