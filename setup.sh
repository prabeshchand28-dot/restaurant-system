#!/bin/bash
# ════════════════════════════════════════════════════════
#  Restaurant System — PostgreSQL + Prisma Auto Setup
#  Run:  chmod +x setup.sh && ./setup.sh
# ════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}➜ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo "🍽️  Restaurant System — Setup"
echo "══════════════════════════════"
echo ""

# ── 1. Homebrew ──────────────────────────────────────────
info "Homebrew check..."
if ! command -v brew &>/dev/null; then
  info "Homebrew installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon path
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
fi
ok "Homebrew ready"

# ── 2. PostgreSQL ─────────────────────────────────────────
info "PostgreSQL check..."
if ! command -v psql &>/dev/null; then
  info "PostgreSQL installing (this may take a few minutes)..."
  brew install postgresql@16
  brew services start postgresql@16
  # Add to PATH
  PG_PATH="/opt/homebrew/opt/postgresql@16/bin"
  if [ -d "$PG_PATH" ]; then
    export PATH="$PG_PATH:$PATH"
    echo "export PATH=\"$PG_PATH:\$PATH\"" >> ~/.zprofile
  fi
  sleep 3
else
  # Make sure it's running
  brew services start postgresql@16 2>/dev/null || true
  sleep 2
fi
ok "PostgreSQL ready"

# ── 3. Create DB + User ───────────────────────────────────
info "Creating database 'restaurant_db'..."
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
psql postgres -c "CREATE DATABASE restaurant_db OWNER postgres;" 2>/dev/null || true
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO postgres;" 2>/dev/null || true
ok "Database ready"

# ── 4. npm install ────────────────────────────────────────
info "Installing Node packages..."
npm install --silent
ok "Packages installed"

# ── 5. Prisma generate ────────────────────────────────────
info "Generating Prisma client..."
npx prisma generate
ok "Prisma client generated"

# ── 6. Push schema ────────────────────────────────────────
info "Pushing schema to database (creating tables)..."
npx prisma db push
ok "Tables created"

# ── 7. Seed ───────────────────────────────────────────────
info "Seeding initial data..."
node prisma/seed.js
ok "Data seeded"

echo ""
echo "══════════════════════════════════════"
echo -e "${GREEN}✅  Setup complete!${NC}"
echo "══════════════════════════════════════"
echo ""
echo "  Start server:   npm run dev"
echo "  Open browser:   http://localhost:3000"
echo ""
echo "  Admin login:    admin / restaurant123"
echo "  Staff login:    waiter1 / staff123"
echo ""
echo "  DB GUI:         npx prisma studio"
echo ""
