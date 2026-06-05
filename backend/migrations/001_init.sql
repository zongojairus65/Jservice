-- 001_init.sql
-- JServices — PostgreSQL Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255),
  name        VARCHAR(255) NOT NULL DEFAULT '',
  phone       VARCHAR(20) NOT NULL DEFAULT '',
  whatsapp    VARCHAR(20) NOT NULL DEFAULT '',
  avatar_url  TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'user',
  provider    VARCHAR(20) NOT NULL DEFAULT 'email',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  name_fr     VARCHAR(255) NOT NULL,
  name_en     VARCHAR(255) NOT NULL,
  desc_fr     TEXT NOT NULL DEFAULT '',
  desc_en     TEXT NOT NULL DEFAULT '',
  price       INTEGER,
  category    VARCHAR(50) NOT NULL DEFAULT 'file',
  badge       VARCHAR(20),
  icon        VARCHAR(10) NOT NULL DEFAULT '📦',
  file_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ─── Services ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug               VARCHAR(255) UNIQUE NOT NULL,
  name_fr            VARCHAR(255) NOT NULL,
  name_en            VARCHAR(255) NOT NULL,
  desc_fr            TEXT NOT NULL DEFAULT '',
  desc_en            TEXT NOT NULL DEFAULT '',
  price              INTEGER,
  on_quote           BOOLEAN NOT NULL DEFAULT FALSE,
  badge              VARCHAR(20),
  icon               VARCHAR(10) NOT NULL DEFAULT '⚙️',
  whatsapp_template  TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ─── Orders ───────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS order_ref_seq START 1;

CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ref      VARCHAR(20) UNIQUE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name     VARCHAR(255),
  guest_phone    VARCHAR(20),
  total          INTEGER,
  status         VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30) NOT NULL DEFAULT 'manual',
  payment_ref    VARCHAR(255),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_ref    ON orders(order_ref);

-- Auto-generate order_ref (JS-001, JS-002, ...)
CREATE OR REPLACE FUNCTION set_order_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_ref = 'JS-' || LPAD(nextval('order_ref_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_ref ON orders;
CREATE TRIGGER trg_order_ref
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_ref IS NULL)
  EXECUTE FUNCTION set_order_ref();

-- ─── Order Items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  service_id  UUID REFERENCES services(id),
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  INTEGER,
  total_price INTEGER
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  amount       INTEGER NOT NULL,
  method       VARCHAR(30) NOT NULL,
  provider     VARCHAR(50),
  provider_ref VARCHAR(255),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ─── Chat Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id),
  session_id VARCHAR(255) NOT NULL,
  role       VARCHAR(10) NOT NULL DEFAULT 'user',
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);

-- ─── Page Views (analytics) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path       VARCHAR(500),
  referrer   VARCHAR(1000),
  user_agent TEXT,
  ip_hash    VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pageviews_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pageviews_date ON page_views(created_at);

-- ─── Seed Data ────────────────────────────────────────────────────────────────

-- Default admin user (password: Admin@123 — CHANGE IN PRODUCTION)
INSERT INTO users (id, email, password, name, role, provider)
VALUES (
  uuid_generate_v4(),
  'admin@jservices.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'JServices Admin',
  'admin',
  'email'
) ON CONFLICT (email) DO NOTHING;

-- Seed products
INSERT INTO products (slug, name_fr, name_en, desc_fr, desc_en, price, category, badge, icon) VALUES
  ('bot-sportif-pro',    'Bot Sportif Pro',     'Pro Sports Bot',      'Pronostics sportifs automatisés en temps réel', 'Automated real-time sports predictions', 15000, 'bot',      'popular', '⚽'),
  ('bot-crypto-trader',  'Bot Crypto Trader',   'Crypto Trader Bot',   'Signaux de trading crypto automatisés',         'Automated crypto trading signals',        25000, 'bot',      'new',     '₿'),
  ('pack-donnees-foot',  'Pack Données Foot',   'Football Data Pack',  'Base de données complète des matchs',           'Complete football match database',         8000,  'file',     null,      '📊'),
  ('template-business',  'Template Business',   'Business Template',   'Pack de templates professionnels',              'Professional template pack',               5000,  'template', null,      '📁')
ON CONFLICT (slug) DO NOTHING;

-- Seed services
INSERT INTO services (slug, name_fr, name_en, desc_fr, desc_en, price, on_quote, badge, icon, whatsapp_template) VALUES
  ('carte-virtuelle',   'Carte Virtuelle',    'Virtual Card',       'Cartes de visite virtuelles professionnelles', 'Professional virtual business cards',  3500,  false, 'popular', '💳', 'Bonjour ! Je souhaite commander une carte virtuelle.'),
  ('creation-poster',   'Création Poster',    'Poster Design',      'Design de posters et visuels marketing',       'Marketing poster and visual design',    null,  true,  'quote',   '🎨', 'Bonjour ! Je souhaite un devis pour la création d''un poster.'),
  ('restauration-photo','Restauration Photo', 'Photo Restoration',  'Restauration IA de photos anciennes',          'AI restoration of old or damaged photos', 4000, false, 'new',     '🖼️', 'Bonjour ! Je souhaite restaurer une photo.'),
  ('assistance-whatsapp','Assistance WhatsApp','WhatsApp Support',  'Accompagnement personnalisé via WhatsApp',     'Personalized support via WhatsApp',     null,  true,  'quote',   '💬', 'Bonjour ! J''ai besoin d''assistance.'),
  ('logo-branding',     'Logo & Branding',    'Logo & Branding',    'Création d''identité visuelle complète',       'Complete visual identity creation',      null,  true,  'quote',   '✨', 'Bonjour ! Je souhaite créer mon identité visuelle.'),
  ('setup-digital',     'Setup Digital',      'Digital Setup',      'Configuration de vos outils digitaux',         'Digital tools configuration & setup',  12000, false, null,      '⚙️', 'Bonjour ! Je souhaite configurer mes outils digitaux.')
ON CONFLICT (slug) DO NOTHING;
