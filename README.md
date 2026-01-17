# Mind Ease - Pomodoro Timer Backend

Back-end profissional para aplicativo de timer Pomodoro, construído com Node.js, TypeScript e Fastify.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Fastify** - Framework web rápido e eficiente
- **Prisma ORM** - ORM type-safe para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação com Access + Refresh Tokens
- **Zod** - Validação de schemas
- **Bcrypt** - Hash de senhas

## 📋 Funcionalidades

### ✅ MVP Implementado

- **Autenticação**

  - Registro de usuário
  - Login com JWT
  - Refresh token
  - Logout
  - Rota `/me` para obter usuário atual

- **Configurações Pomodoro**

  - GET/PUT configurações personalizadas
  - Tempo de foco (padrão: 25 min)
  - Descanso curto (padrão: 5 min)
  - Descanso longo (padrão: 15 min)
  - Intervalo para descanso longo (padrão: a cada 4 focos)

- **Sessões (Timer)**

  - Iniciar sessão (FOCUS, SHORT_BREAK, LONG_BREAK)
  - Finalizar sessão (COMPLETED, CANCELED, EXPIRED)
  - Consultar sessão ativa
  - Regra: 1 sessão ativa por usuário

- **Histórico e Analytics**
  - Listar sessões por período
  - Métricas: total focado, sessões completas, média, streak

## 📁 Estrutura do Projeto

```
src/
├── modules/
│   ├── auth/           # Autenticação e autorização
│   ├── pomodoro/       # Configurações do Pomodoro
│   ├── sessions/       # Gerenciamento de sessões
│   └── history/        # Histórico e estatísticas
├── shared/
│   ├── db/            # Cliente Prisma
│   ├── config/        # Configurações da aplicação
│   ├── middleware/    # Middlewares (authGuard)
│   └── utils/         # Utilitários (password, time)
├── app.ts             # Configuração do Fastify
└── server.ts          # Inicialização do servidor
```

## 🛠️ Setup e Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/mind_ease?schema=public"

JWT_SECRET=sua-chave-secreta-jwt
JWT_REFRESH_SECRET=sua-chave-secreta-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Configurar banco de dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar e aplicar migrations
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 4. Rodar o servidor

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Build para produção
npm run build

# Rodar produção
npm start
```

Servidor rodará em `http://localhost:3000`

## 📚 Documentação da API

### Autenticação

#### `POST /auth/register`

Registra novo usuário e cria configurações padrão.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2026-01-14T..."
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "random-hex-token"
}
```

#### `POST /auth/login`

Faz login e retorna tokens.

**Body:**

```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### `POST /auth/refresh`

Renova o access token usando refresh token.

**Body:**

```json
{
  "refreshToken": "token-aqui"
}
```

#### `POST /auth/logout`

Revoga o refresh token.

**Body:**

```json
{
  "refreshToken": "token-aqui"
}
```

#### `GET /me`

Retorna dados do usuário autenticado.

**Headers:**

```
Authorization: Bearer {accessToken}
```

### Configurações Pomodoro

#### `GET /pomodoro/settings`

Retorna configurações do usuário.

#### `PUT /pomodoro/settings`

Atualiza configurações.

**Body:**

```json
{
  "focusMinutes": 25,
  "shortBreakMinutes": 5,
  "longBreakMinutes": 15,
  "longBreakEvery": 4
}
```

### Sessões

#### `POST /pomodoro/sessions/start`

Inicia nova sessão.

**Body:**

```json
{
  "type": "FOCUS",
  "taskId": "opcional-uuid"
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "FOCUS",
  "status": "COMPLETED",
  "startedAt": "2026-01-14T...",
  "plannedDurationSeconds": 1500,
  "endedAt": null,
  "actualDurationSeconds": null
}
```

#### `POST /pomodoro/sessions/:id/finish`

Finaliza sessão ativa.

**Body:**

```json
{
  "status": "COMPLETED",
  "endedAt": "2026-01-14T..." // opcional
}
```

#### `GET /pomodoro/sessions/active`

Retorna sessão ativa com tempo restante.

**Response:**

```json
{
  "id": "uuid",
  "type": "FOCUS",
  "startedAt": "2026-01-14T...",
  "plannedDurationSeconds": 1500,
  "elapsedSeconds": 300,
  "remainingSeconds": 1200
}
```

### Histórico

#### `GET /pomodoro/history?from=YYYY-MM-DD&to=YYYY-MM-DD`

Lista todas as sessões do período.

#### `GET /pomodoro/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`

Retorna estatísticas agregadas.

**Response:**

```json
{
  "totalSessions": 42,
  "completedSessions": 38,
  "canceledSessions": 4,
  "totalFocusSessions": 30,
  "completedFocusSessions": 28,
  "totalFocusMinutes": 700,
  "totalBreakMinutes": 150,
  "averageFocusMinutes": 25,
  "streak": 7
}
```

## 🔐 Autenticação

Todas as rotas exceto `/auth/*` e `/health` exigem autenticação via JWT.

**Header:**

```
Authorization: Bearer {accessToken}
```

O `accessToken` expira em 15 minutos (configurável). Use o `refreshToken` na rota `/auth/refresh` para obter novo token.

## 🗄️ Modelo de Dados

### User

- `id` (UUID)
- `name` (string)
- `email` (string, único)
- `passwordHash` (string)
- `createdAt` (DateTime)

### PomodoroSettings

- `id` (UUID)
- `userId` (FK)
- `focusMinutes` (int, padrão: 25)
- `shortBreakMinutes` (int, padrão: 5)
- `longBreakMinutes` (int, padrão: 15)
- `longBreakEvery` (int, padrão: 4)

### PomodoroSession

- `id` (UUID)
- `userId` (FK)
- `taskId` (UUID, opcional)
- `type` (FOCUS | SHORT_BREAK | LONG_BREAK)
- `status` (COMPLETED | CANCELED | EXPIRED)
- `startedAt` (DateTime)
- `endedAt` (DateTime, nullable)
- `plannedDurationSeconds` (int)
- `actualDurationSeconds` (int, nullable)
- `meta` (JSON, opcional)

### RefreshToken

- `id` (UUID)
- `userId` (FK)
- `tokenHash` (string)
- `expiresAt` (DateTime)

## 🎯 Regras de Negócio

1. **Uma sessão ativa por vez**: Usuário só pode iniciar nova sessão após finalizar a ativa
2. **Duração calculada pelo back-end**: Baseada nas configurações do usuário
3. **Front-end controla o timer**: Back-end armazena início, fim e duração real
4. **Configurações padrão**: Criadas automaticamente no registro
5. **Refresh token**: Válido por 7 dias (configurável)
6. **Streak**: Conta dias consecutivos com pelo menos 1 foco completo

## 📝 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento com hot-reload
npm run build            # Build TypeScript
npm start                # Rodar versão compilada
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:migrate   # Criar/aplicar migrations
npm run prisma:studio    # Abrir Prisma Studio (GUI)
```

## 🚧 Próximos Passos (Opcional)

- [ ] Kanban/Tarefas (vincular sessões a tarefas)
- [ ] WebSocket/SSE para eventos em tempo real
- [ ] Auditoria de mudanças de configuração
- [ ] Testes unitários e de integração
- [ ] Docker e docker-compose
- [ ] Rate limiting
- [ ] Logs estruturados
- [ ] Documentação OpenAPI/Swagger

## 📄 Licença

MIT
