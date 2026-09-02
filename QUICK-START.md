# 🚀 Quick Start - Campus News App

## 1️⃣ Instalação (5 minutos)

### Opção A: Com Docker (Recomendado) 🐳

```bash
# Iniciar tudo com um comando
docker-compose up -d

# Acessar
# Frontend: http://localhost:4173
# Backend: http://localhost:4001/api/health
```

### Opção B: Local (Node.js 20+)

```bash
# Instalar
npm install

# Iniciar
npm run dev

# Acessar
# Frontend: http://localhost:4173
# Backend: http://localhost:4001/api/health
```

## 2️⃣ Login

Usar uma das credenciais de teste:

```
👨‍💼 Admin
├─ Email: admin@campus.edu
├─ Senha: admin123
└─ Acesso: Painel Admin, Gerenciar Notícias/Salas

👨‍🏫 Professor  
├─ Email: professor@campus.edu
├─ Senha: prof123
└─ Acesso: Painel Professor, Presença, Labs

👨‍🎓 Aluno
├─ Email: aluno@campus.edu
├─ Senha: aluno123
└─ Acesso: Ver Notícias, Salas, Filas
```

## 3️⃣ Primeiros Passos

### Admin: Criar uma Notícia
1. Login com admin
2. Clique em "Administração"
3. Aba "Notícias"
4. Botão "+ Criar Notícia"
5. Preencher e salvar

### Professor: Registrar Presença
1. Login com professor
2. Clique em "Minhas Aulas"
3. Clique em "Lista Presença"
4. Selecionar status de cada aluno
5. Salvar

### Aluno: Entrar na Fila
1. Login com aluno
2. Clique em "Gestão de Filas"
3. Selecionar setor
4. Clique em "Entrar na Fila"
5. Acompanhar em tempo real

## 4️⃣ Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend
npm run server           # Apenas Backend
npm run build            # Build para produção

# Testes
npm test                 # Rodar testes
npm run test:ui          # UI de testes interativa

# Docker
docker-compose up -d     # Iniciar
docker-compose down      # Parar
docker-compose logs -f   # Ver logs

# Deployment
./scripts/deploy.sh      # Deploy (requer .env)
```

## 5️⃣ Arquivos Importantes

```
.env                 → Configurações (copiar de .env.example)
DEPLOYMENT.md        → Guia completo de deployment
CHANGELOG.md         → Histórico de mudanças
README.md            → Documentação principal
```

## 🔍 Estrutura de Pasta

```
├── src/              Frontend (React + Vite)
├── server/           Backend (Express + SQLite)
├── android/          App nativo Android
├── ios/              App nativo iOS
├── Dockerfile        Para Docker
├── docker-compose.yml
└── scripts/          Scripts de deploy
```

## ⚠️ Troubleshooting

### Porta 4001 em uso
```bash
# Windows: Encontrar e matar processo
netstat -ano | findstr :4001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4001
kill -9 <PID>
```

### Erro ao conectar Backend
- Verificar se backend está rodando: `curl http://localhost:4001/api/health`
- Verificar .env: `VITE_API_URL=http://localhost:4001/api`
- Logs: `docker-compose logs api`

### Database corrompido
```bash
# Remover e reconstruir
rm campus-news.db*
docker-compose restart api
```

## 📚 Próximos Passos

1. **Explorar Admin Panel** - Gerenciar conteúdo
2. **Testar Prof Tools** - Presença e labs
3. **Configurar .env** - Para produção
4. **Rodar testes** - `npm test`
5. **Deploy** - Seguir DEPLOYMENT.md

## 🆘 Precisa de Ajuda?

- 📖 [Documentação completa](./DEPLOYMENT.md)
- 🐛 [Issues](https://github.com/seu-usuario/Campus-News-App/issues)
- 💬 [Discussions](https://github.com/seu-usuario/Campus-News-App/discussions)

---

**Bom desenvolvimento! 🎉**
