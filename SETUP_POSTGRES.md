# PostgreSQL + Prisma Setup Guide

## Step 1 — Homebrew install (Mac maa chaina bhane)

Terminal kholnu ani run garnu:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install bhayepachhi (Apple Silicon Mac hunu):
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

## Step 2 — PostgreSQL install

```bash
brew install postgresql@16
```

PostgreSQL start garnu:
```bash
brew services start postgresql@16
```

PATH maa thapnu (Apple Silicon):
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

Check garnu:
```bash
psql --version
# postgresql 16.x dekhinu parcha
```

---

## Step 3 — Database create garnu

```bash
psql postgres
```

psql prompt ma:
```sql
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE restaurant_db OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO postgres;
\q
```

---

## Step 4 — .env check garnu

`.env` file maa yo line cha ki chaina herni:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_db"
```

---

## Step 5 — Prisma generate + push + seed

Project folder ma jaanu:
```bash
cd ~/Desktop/restaurant-system
```

Prisma client generate garnu:
```bash
npx prisma generate
```

Tables create garnu (migration):
```bash
npx prisma db push
```

Seed data haalnu (admin user, menu items, tables):
```bash
node prisma/seed.js
```

---

## Step 6 — Server start garnu

```bash
npm run dev
```

Browser maa: http://localhost:3000

Login:
- Admin:  `admin` / `restaurant123`
- Staff:  `waiter1` / `staff123`

---

## Useful Commands

| Command | Kaam |
|---------|------|
| `npx prisma studio` | Database GUI browser maa open |
| `npx prisma db push` | Schema change bhayepachhi sync |
| `npx prisma migrate dev --name change_name` | Production migration |
| `node prisma/seed.js` | Re-seed data |
| `brew services restart postgresql@16` | PostgreSQL restart |
| `psql -U postgres -d restaurant_db` | DB maa direct connect |

---

## Troubleshooting

**"role postgres does not exist" error:**
```bash
createuser -s postgres
```

**"database restaurant_db does not exist" error:**
```bash
createdb -U postgres restaurant_db
```

**Connection refused:**
```bash
brew services restart postgresql@16
```

**Check if Postgres is running:**
```bash
brew services list | grep postgresql
```
