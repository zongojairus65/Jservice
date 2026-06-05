# JServices — API Reference

**Base URL:** `https://api.jservices.com/api/v1`  
**Auth:** `Authorization: Bearer <JWT>`

---

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ❌ | Créer un compte |
| POST | /auth/login    | ❌ | Connexion |
| GET  | /auth/me       | ✅ | Profil courant |
| POST | /auth/refresh  | ✅ | Renouveler le token |

**POST /auth/register**
```json
// Body
{ "name": "Jean Kofi", "email": "jean@ex.com", "password": "min8chars", "phone": "+226700000" }
// Response 201
{ "token": "eyJ...", "user": { "id": "uuid", "name": "Jean Kofi", "role": "user" } }
```

**POST /auth/login**
```json
{ "email": "jean@ex.com", "password": "min8chars" }
// Response 200
{ "token": "eyJ...", "user": { ... } }
```

---

## Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /products         | ❌ | Liste (query: category, page, limit) |
| GET    | /products/:slug   | ❌ | Détail |
| GET    | /admin/products   | 🔑 Admin | Liste complète |
| POST   | /admin/products   | 🔑 Admin | Créer |
| PATCH  | /admin/products/:id | 🔑 Admin | Modifier (prix dynamique) |
| DELETE | /admin/products/:id | 🔑 Admin | Désactiver |

**PATCH /admin/products/:id** — Modification de prix (feature clé)
```json
{ "price": 18000 }   // nouveau prix FCFA
{ "price": null }    // passer en "sur devis"
```

---

## Services

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /services       | ❌ | Liste |
| GET    | /services/:slug | ❌ | Détail |
| POST   | /admin/services | 🔑 Admin | Créer |
| PATCH  | /admin/services/:id | 🔑 Admin | Modifier |

---

## Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /orders     | ✅ | Créer commande |
| GET  | /orders     | ✅ | Mes commandes |
| GET  | /orders/:id | ✅ | Détail commande |

**POST /orders**
```json
// Body
{
  "items": [
    { "product_id": "uuid", "quantity": 1 },
    { "service_id": "uuid", "quantity": 1 }
  ],
  "payment_method": "mobilemoney",
  "guest_name": "Jean Kofi",
  "guest_phone": "+226700000"
}
// Response 201
{ "order_id": "uuid", "order_ref": "JS-001", "total": 18500, "status": "pending" }
```
> ⚠️ Les prix sont calculés **serveur-side** — jamais envoyés par le client.

---

## Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /payments/:order_id/confirm | ✅ | Soumettre preuve paiement |
| GET  | /payments/:order_id         | ✅ | Statut paiement |

```json
// POST confirm
{ "method": "mobilemoney", "provider": "orange_money", "provider_ref": "OM-123456" }
```

---

## Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /admin/stats                  | 🔑 | Statistiques globales |
| GET    | /admin/orders                 | 🔑 | Toutes commandes |
| PATCH  | /admin/orders/:id/status      | 🔑 | Changer statut |
| GET    | /admin/payments               | 🔑 | Tous paiements |
| PATCH  | /admin/payments/:id/validate  | 🔑 | Valider paiement → commande paid |
| GET    | /admin/users                  | 🔑 | Tous utilisateurs |
| PATCH  | /admin/users/:id/role         | 🔑 | Modifier rôle |

**Statuts de commande:**  
`pending` → `payment_submitted` → `paid` → `processing` → `delivered`  
ou → `cancelled`

---

## WebSocket — Chat

```
wss://api.jservices.com/ws/chat?session=SESSION_ID
```

**Client → Serveur:**
```json
{ "type": "message", "content": "Bonjour, j'ai une question." }
```

**Serveur → Client:**
```json
{ "type": "message", "role": "bot", "content": "...", "timestamp": "2024-01-15T10:30:00Z" }
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide |
| 401  | Token manquant / expiré |
| 403  | Accès refusé |
| 404  | Introuvable |
| 409  | Conflit (email déjà utilisé) |
| 500  | Erreur serveur |

```json
{ "error": "description de l'erreur" }
```
