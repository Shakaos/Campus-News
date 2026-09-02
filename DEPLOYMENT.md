# Campus News - Portal Inteligente Institucional

App web + mobile com gestão de fluxo acadêmico, comunicados, salas e filas.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+ ou Docker
- npm/yarn

### Instalação Local

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/Campus-News-App.git
cd Campus-News-App

# Copiar variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Iniciar (backend + frontend simultaneamente)
npm run dev
```

**Acesso:**
- Frontend: `http://localhost:4173`
- Backend API: `http://localhost:4001/api`
- Health check: `http://localhost:4001/api/health`

### Usando Docker

```bash
# Build e execução com Docker Compose
docker-compose up -d

# Para visualizar logs
docker-compose logs -f

# Parar containers
docker-compose down
```

## 📋 Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@campus.edu` | `admin123` |
| Professor | `professor@campus.edu` | `prof123` |
| Aluno | `aluno@campus.edu` | `aluno123` |

## 🏗️ Arquitetura

```
├── src/                  # Frontend React + Vite
│   ├── App.tsx          # Componente principal
│   ├── AdminView.tsx    # Interface de administração
│   ├── ProfessorTools.tsx # Ferramentas para professores
│   ├── ErrorBoundary.tsx # Tratamento de erros
│   ├── api.ts           # Cliente HTTP
│   └── types.ts         # Tipos TypeScript
│
├── server/              # Backend Express
│   ├── index.ts         # Servidor principal com endpoints
│   ├── db.ts            # Configuração SQLite
│   ├── dbHelpers.ts     # Funções CRUD
│   ├── schemas.ts       # Validação Zod
│   ├── middleware.ts    # Middlewares de erro
│   ├── utils.ts         # Utilitários (hash, IDs)
│   └── schemas.test.ts  # Testes
│
└── android/, ios/       # Código nativo Capacitor
```

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login com email/senha
- `GET /api/me` - Dados do usuário autenticado

### Notícias (Admin only)
- `GET /api/news` - Listar notícias
- `POST /api/news` - Criar notícia
- `PUT /api/news/:id` - Atualizar notícia
- `DELETE /api/news/:id` - Deletar notícia

### Salas
- `GET /api/rooms` - Listar salas
- `POST /api/rooms` - Criar sala (Admin)
- `PUT /api/rooms/:id` - Atualizar sala (Admin)
- `DELETE /api/rooms/:id` - Deletar sala (Admin)

### Filas
- `GET /api/sectors` - Listar setores
- `POST /api/queues/enter` - Entrar na fila

### Professor Tools
- `POST /api/attendance` - Registrar presença
- `GET /api/attendance/:classId` - Listar presença
- `PUT /api/attendance/:id` - Atualizar presença
- `POST /api/lab-reservations` - Reservar laboratório
- `GET /api/lab-reservations` - Listar reservas
- `DELETE /api/lab-reservations/:id` - Cancelar reserva
- `POST /api/class-notices` - Criar aviso
- `GET /api/class-notices/:classId` - Listar avisos
- `DELETE /api/class-notices/:id` - Deletar aviso

## 🧪 Testes

```bash
# Rodar testes
npm test

# Modo watch
npm test -- --watch

# Com UI
npm run test:ui

# Com cobertura
npm test -- --coverage
```

## 🔒 Segurança

- ✅ Validação com Zod
- ✅ JWT para autenticação
- ✅ CORS habilitado
- ✅ Error Boundaries React
- ⚠️ Senhas em plain text (usar bcryptjs em produção)
- ⚠️ Implementar rate limiting

### Melhorias de Segurança Necessárias
1. Hash de senhas com bcrypt
2. HTTPS em produção
3. Rate limiting
4. Validação CSRF
5. Sanitização de inputs
6. Logging de segurança

## 📦 Build & Deploy

### Build para Produção

```bash
npm run build
```

Gera:
- `dist/` - Frontend compilado (Vite)
- `server/` - Backend TypeScript

### Deployment com Docker

```bash
# Build image
docker build -t campus-news:latest .

# Tag com versão
docker tag campus-news:latest campus-news:v1.0.0

# Push para registro
docker push campus-news:latest

# Executar em produção
docker run -e PORT=4001 \
  -e JWT_SECRET=seu-secret-seguro \
  -p 4001:4001 \
  campus-news:latest
```

### Deploy Script

```bash
# Automatizado (requer .env configurado)
./scripts/deploy.sh
```

## 📱 Mobile (Capacitor)

### Android

```bash
npm run mobile:android
# Abre Android Studio com o projeto configurado
```

### iOS (requer Mac)

```bash
npm run mobile:ios
# Abre Xcode com o projeto configurado
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev              # Iniciar frontend + backend
npm run server           # Apenas backend
npm run build            # Build para produção
npm run preview          # Preview do build
npm run lint             # TypeScript type check
npm test                 # Rodar testes
npm run test:ui          # Testes com UI
npm run clean            # Limpar dist
npm run mobile:sync      # Sincronizar Capacitor
```

### Variáveis de Ambiente

```env
# Backend
PORT=4001
JWT_SECRET=sua-chave-secreta
NODE_ENV=development
DATABASE_PATH=./campus-news.db

# Frontend
VITE_API_URL=http://localhost:4001/api
```

## 📊 Status de Funcionalidades

### ✅ Implementado
- [x] Autenticação JWT
- [x] CRUD Notícias (Admin)
- [x] CRUD Salas (Admin)
- [x] Gestão de Filas
- [x] Interface de Admin
- [x] Dashboard de Professor
- [x] Validação com Zod
- [x] Error Boundaries
- [x] Docker & Docker Compose
- [x] GitHub Actions CI/CD

### 🚧 Em Progresso
- [ ] Testes E2E (Cypress/Playwright)
- [ ] Otimização de performance
- [ ] PWA avançado

### 📋 Planejado
- [ ] Real-time com WebSocket
- [ ] Notificações push
- [ ] Relatórios analíticos
- [ ] Integração OAuth
- [ ] Backup automático

## 🤝 Contribuindo

1. Fork do repositório
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Commit: `git commit -am 'Adicionar feature'`
4. Push: `git push origin feature/sua-feature`
5. Pull Request

## 📝 Changelog

### v2.4.0 (2026-09-01)
- ✨ Novos endpoints de Professor Tools
- ✨ Error Boundaries e melhor tratamento de erros
- ✨ Validação com Zod em todos os endpoints
- 🐳 Docker e docker-compose
- 🔄 GitHub Actions CI/CD
- 🧪 Testes com Vitest
- 🔒 Middleware de erro centralizado

### v2.0.0 (2026-04-15)
- ✨ Interface completa de Admin
- ✨ Componentes de UI refinados
- 🎨 Design system com Tailwind
- 📱 Responsivo para mobile

## 📄 Licença

Apache 2.0 - Veja LICENSE.md

## 👨‍💼 Autor

Campus News App - Portal Inteligente Institucional

---

**Precisa de ajuda?**
- 📖 [Documentação completa](./docs/)
- 🐛 [Reportar bug](https://github.com/seu-usuario/Campus-News-App/issues)
- 💬 [Discussões](https://github.com/seu-usuario/Campus-News-App/discussions)
