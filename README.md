# Consultório Dra. Marília Pedrucci — Monorepo

Monorepo com frontend React (Vite + Tailwind) e backend Node/Express com Prisma.

## ✅ Requisitos atendidos
- Agendamento com slots de 30 minutos e validação no frontend e backend.
- Trava anti-dupla marcação: `@@unique([date, startTime])`.
- Envio de e-mails via Resend para dois destinatários fixos.
- Área admin com login JWT, listagem, edição e exclusão de consultas.

## Estrutura
```
.
├── client
└── server
```

## Pré-requisitos
- Node.js 18+
- npm

## Configuração

### 1) Backend
```
cp server/.env.example server/.env
```
Preencha:
- `DATABASE_URL` (SQLite local por padrão)
- `JWT_SECRET`
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`
- `RESEND_API_KEY`
- `EMAIL_FROM` (remetente válido do Resend)

### 2) Frontend
```
cp client/.env.example client/.env
```
`VITE_API_BASE_URL` pode ficar como `http://localhost:3001`.

## Prisma (migrations + seed)
```
npm install
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run seed --workspace server
```

## Rodar localmente
```
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Trocar SQLite por Postgres
1. Atualize `DATABASE_URL` no `.env` com sua string do Postgres.
2. No `server/prisma/schema.prisma`, altere `provider = "sqlite"` para `provider = "postgresql"`.
3. Rode novamente:
```
npm run prisma:migrate --workspace server
```

## Endpoints principais
- `GET /api/availability?date=YYYY-MM-DD`
- `POST /api/appointments`
- `POST /api/auth/login`
- `GET /api/admin/appointments?date=YYYY-MM-DD`
- `PATCH /api/admin/appointments/:id`
- `DELETE /api/admin/appointments/:id`

## Observações
- O e-mail digitado pelo paciente é armazenado, mas o envio é simulado para os destinatários fixos.
- O sistema impede agendamentos no passado e fora do expediente.
