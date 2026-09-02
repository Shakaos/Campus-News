# 🏗️ Arquitetura Campus News App

## Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAMPUS NEWS APP v2.4.0                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Frontend       │         │   Backend        │              │
│  │  React + Vite    │◄────────►   Express.js     │              │
│  │  Port: 4173      │   HTTP  │   Port: 4001     │              │
│  └──────────────────┘  JSON   └────────┬─────────┘              │
│         │                              │                         │
│         │                              │                         │
│     Browser │                      ┌───▼─────────┐              │
│             │                      │  SQLite DB  │              │
│             │                      │ campus-news │              │
│             │                      │   .db       │              │
│             │                      └─────────────┘              │
│             │                                                    │
│  ┌──────────▼───────────────────────────────────────┐          │
│  │         Docker Container (Optional)               │          │
│  │  ┌────────────┐       ┌────────────┐             │          │
│  │  │ Frontend   │       │ Backend    │             │          │
│  │  │ Container  │       │ Container  │             │          │
│  │  └────────────┘       └────────────┘             │          │
│  │  Volume Mount: Database                          │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Stack de Tecnologia

```
Frontend                Backend              Database
─────────────          ────────────         ────────
React 19              Express.js            SQLite 3
Vite 6.2              TypeScript            better-sqlite3
Tailwind CSS          Node 20               8 Tables
Motion/Framer         JWT Auth              WAL Mode
Lucide Icons          Zod Validation
TypeScript            Error Handling

DevOps
──────
Docker
Docker Compose
GitHub Actions
Bash Scripts
```

## Fluxo de Dados - Login

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters credentials                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  LoginSchema.parse()   │  Validation
        │  (Zod)                 │
        └────────────┬───────────┘
                     │
        ┌────────────▼──────────────┐
        │ POST /api/auth/login      │
        │ + credentials             │
        └────────────┬──────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ Backend: index.ts             │
        │ - Check DB                    │
        │ - Create JWT                  │
        │ - Return {token, user}        │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Frontend stores:           │
        │ - localStorage.campus_token│
        │ - localStorage.campus_user │
        └────────────┬──────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Redirect to /home      │
        │ Protected Route        │
        └────────────────────────┘
```

## Fluxo de Dados - Criar Notícia (Admin)

```
Admin Panel
    │
    ├─► Form Input ─┐
    │               │
    ├─► Validation ─┤  Frontend
    │   (Zod)       │  (src/AdminView.tsx)
    │               │
    └─► POST /api/news + JWT Token
        │
        ▼
    Backend (server/index.ts)
    ├─► authMiddleware ──► Verify JWT
    ├─► adminMiddleware ─► Check role
    ├─► NewsSchema.parse() ──► Validate
    └─► createNews() ────────► Insert DB
        │
        └─► Response: {id, title, ...}
            │
            ▼
        Frontend (src/AdminView.tsx)
        ├─► Update state
        ├─► Show success
        └─► Reload list
```

## Estrutura de Pastas - Melhorada

```
Campus-News-App/
│
├── 📁 src/                     # Frontend
│   ├── App.tsx                 # 🆕 Com ErrorBoundary
│   ├── AdminView.tsx           # Admin interface
│   ├── ProfessorTools.tsx       # Professor features
│   ├── ErrorBoundary.tsx        # 🆕 Error handling
│   ├── hooks.ts                # 🆕 Custom hooks
│   ├── api.ts                  # HTTP client
│   ├── types.ts                # TypeScript types
│   ├── constants.ts
│   ├── index.css
│   └── main.tsx
│
├── 📁 server/                  # Backend
│   ├── index.ts                # 🔄 Refactored with validation
│   ├── db.ts                   # 🆕 +3 tables
│   ├── dbHelpers.ts            # 🆕 +12 CRUD functions
│   ├── schemas.ts              # 🆕 Zod validation
│   ├── middleware.ts           # 🆕 Error handling
│   ├── utils.ts                # 🆕 Security utils
│   └── schemas.test.ts         # 🆕 Tests
│
├── 📁 .github/
│   └── workflows/
│       └── ci-cd.yml           # 🆕 GitHub Actions
│
├── 📁 scripts/
│   └── deploy.sh               # 🆕 Deployment script
│
├── 📁 android/                 # Capacitor Android
├── 📁 ios/                     # Capacitor iOS
│
├── 📄 Dockerfile               # 🆕 Production-ready
├── 📄 docker-compose.yml       # 🆕 Local orchestration
├── 📄 .dockerignore            # 🆕 Build optimization
├── 📄 vitest.config.ts         # 🆕 Test config
├── 📄 .env.example             # 🆕 Env template
├── 📄 .env                     # Local config
│
├── 📖 DEPLOYMENT.md            # 🆕 Full guide
├── 📖 QUICK-START.md           # 🆕 Quick setup
├── 📖 CHANGELOG.md             # 🆕 Version history
├── 📖 SUMMARY.md               # 🆕 Implementation summary
├── 📖 README.md                # Updated
│
└── 📄 package.json             # 🔄 +4 deps

🆕 = Novo arquivo
🔄 = Modificado
📄 = Arquivo
📁 = Pasta
```

## Fluxo de Desenvolvimento

```
                Developer
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    npm run    npm run    npm run
    dev        build      test
    │          │          │
    ├────┬─────┴─────┬────┤
    │    │           │    │
    ▼    ▼           ▼    ▼
 Frontend Backend TypeScript Vitest
 Vite     Express  Check    Tests
 4173     4001
    │    │           │    │
    └────┴─────┬─────┴────┘
              │
         Git Push
              │
    ┌─────────▼─────────┐
    │  GitHub Actions   │
    │  CI/CD Pipeline   │
    │                   │
    │ 1. npm ci         │
    │ 2. npm run lint   │
    │ 3. npm run build  │
    │ 4. docker build   │
    │ 5. docker push    │
    │                   │
    └──────────┬────────┘
               │
        ┌──────▼────────┐
        │  Docker Hub   │
        │  campus-news  │
        │  :latest      │
        └───────────────┘
              │
        Production Deploy
        (manual via script)
```

## Modelo de Dados - Tabelas

```
┌──────────────────────┐
│  users               │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ role (enum)          │
│ email (UNIQUE)       │
│ password             │
└──────────────────────┘

┌──────────────────────┐
│  news                │
├──────────────────────┤
│ id (PK)              │
│ title                │
│ category (enum)      │
│ summary              │
│ content              │
│ date                 │
│ imageUrl             │
└──────────────────────┘

┌──────────────────────┐
│  rooms               │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ building             │
│ floor                │
│ status (enum)        │
│ currentProfessor     │
│ nextClass            │
│ capacity             │
└──────────────────────┘

┌──────────────────────────┐  🆕
│  attendance_records      │
├──────────────────────────┤
│ id (PK)                  │
│ classId                  │
│ professorId (FK)         │
│ studentName              │
│ status (enum)            │
│ date                     │
│ timestamp                │
└──────────────────────────┘

┌──────────────────────────┐  🆕
│  lab_reservations        │
├──────────────────────────┤
│ id (PK)                  │
│ labName                  │
│ professorId (FK)         │
│ date                     │
│ startTime                │
│ endTime                  │
│ purpose                  │
│ timestamp                │
└──────────────────────────┘

┌──────────────────────────┐  🆕
│  class_notices           │
├──────────────────────────┤
│ id (PK)                  │
│ classId                  │
│ professorId (FK)         │
│ title                    │
│ content                  │
│ date                     │
│ timestamp                │
└──────────────────────────┘
```

## Fluxo de Segurança

```
Request
  │
  ├─► CORS Middleware ────► Allow origins
  │
  ├─► Express JSON ────────► Parse body
  │
  ├─► authMiddleware ──────┐
  │                         ├─► Extract JWT
  │                         ├─► Verify signature
  │                         ├─► Check expiration
  │                         ├─► Get user from DB
  │                         └─► Attach to request
  │
  ├─► roleMiddleware ──────┐
  │   (admin/professor)     ├─► Check user.role
  │                         └─► Deny if not match
  │
  ├─► Zod Validation ──────┐
  │                         ├─► Parse input
  │                         ├─► Type check
  │                         ├─► Range check
  │                         └─► Return errors
  │
  ├─► Handler Function ────┐
  │                         ├─► Business logic
  │                         ├─► DB query
  │                         └─► Sanitize response
  │
  ├─► Error Handler ───────┐
  │                         ├─► Catch ZodError
  │                         ├─► Catch ApiError
  │                         ├─► Generic errors
  │                         └─► No stack traces
  │
  └─► Response ────────────► Secure JSON
```

## Status do Projeto

```
┌─────────────────────────────────────────────────────┐
│ ANTES (v2.0.0)          DEPOIS (v2.4.0)            │
├──────────────────────────────────────────────────────┤
│ ✅ Funcional            │ ✅ Pronto Produção         │
│ ⚠️ Sem validação        │ ✅ Validação Zod           │
│ ⚠️ Erro handling básico │ ✅ Error Boundaries        │
│ ⚠️ Sem testes           │ ✅ Vitest + 9 tests        │
│ ⚠️ Deploy manual         │ ✅ Docker + CI/CD           │
│ ⚠️ Docs limitada        │ ✅ 4 documentos            │
│                          │ ✅ +8 endpoints            │
│                          │ ✅ +3 tabelas BD           │
└──────────────────────────────────────────────────────┘
```

---

**Veja também:** [QUICK-START.md](./QUICK-START.md) | [DEPLOYMENT.md](./DEPLOYMENT.md)
