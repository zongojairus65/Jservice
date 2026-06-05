# JServices — Guide d'installation

## Prérequis
- Git, Docker + Docker Compose, Node.js 20+, Go 1.23+

## 1. Cloner et configurer
```bash
git clone https://github.com/VOTRE_USER/jservices.git
cd jservices
cp .env.example .env
# Remplir au minimum: DB_PASSWORD, JWT_SECRET, FRONTEND_URL, NEXT_PUBLIC_API_URL
```

## 2. Démarrage Docker
```bash
docker compose -f docker/docker-compose.yml up -d
# Frontend: http://localhost:3000
# API:      http://localhost:8080
# Admin:    admin@jservices.com / Admin@123 (CHANGER EN PROD)
```

## 3. Dev local sans Docker

### Backend
```bash
cd backend && go mod tidy
export DATABASE_URL="postgres://jservices_user:changeme@localhost:5432/jservices?sslmode=disable"
export JWT_SECRET="secret-min-32-chars"
export PORT=8080
go run ./cmd/server
```

### Frontend
```bash
cd frontend && npm install && npm run dev
```

## 4. Base de données
```bash
docker exec -it jservices_db psql -U jservices_user -d jservices
# Modifier un prix dynamiquement:
UPDATE products SET price = 20000 WHERE slug = 'bot-sportif-pro';
UPDATE services SET price = null, on_quote = true WHERE slug = 'creation-poster';
```

## 5. Déploiement production

### Backend → Render
- Runtime: Docker | Root: `backend`
- Health check: `/health`
- Vars: `ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend → Cloudflare Pages
- Framework: Next.js | Root: `frontend`
- Vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WA_NUMBER=22672157058`

## 6. GitHub Secrets requis
| Secret | Description |
|--------|-------------|
| `RENDER_DEPLOY_HOOK_BACKEND` | URL deploy hook Render |
| `CF_API_TOKEN` | Token Cloudflare Pages |
| `CF_ACCOUNT_ID` | ID compte Cloudflare |
| `NEXT_PUBLIC_API_URL` | URL API production |
| `NEXT_PUBLIC_SITE_URL` | URL site production |
