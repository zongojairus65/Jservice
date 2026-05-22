# JServices — Vos services digitaux en un clic

> Plateforme SaaS + Marketplace hybride — Afrique de l'Ouest

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + Shadcn |
| Backend | Go 1.23 + Gin Framework |
| Database | PostgreSQL 16 |
| Auth | JWT + Google OAuth |
| Realtime | WebSocket (chat support) |
| Deploy | Cloudflare Pages (FE) + Render (BE) |
| Infra | Docker + GitHub Actions CI/CD |

## Démarrage rapide

```bash
git clone https://github.com/VOTRE_USER/jservices.git
cd jservices
cp .env.example .env
# Remplir les variables dans .env
docker compose up -d
```

- Frontend: http://localhost:3000  
- API: http://localhost:8080  
- Health: http://localhost:8080/health

## Structure

```
jservices/
├── frontend/        # Next.js App Router
├── backend/         # Go Gin REST API
├── docker/          # Docker configs
├── .github/         # CI/CD workflows
└── docs/            # Documentation
```

## Documentation

- [Installation complète](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

## WhatsApp

Canal principal : https://wa.me/22672157058
