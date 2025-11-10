# Voxa Auris Dashboard

AI voice agent dashboard voor ondernemers - Next.js + Supabase + PWA

## ✨ Features

- 🔐 **Authenticatie**: Email/wachtwoord login via Supabase
- 👨‍💼 **Admin Dashboard**: Volledige toegang tot alle klanten, gesprekken en analyses
- 👤 **Client Dashboard**: Klanten zien alleen hun eigen data en statistieken
- 📊 **Real-time Stats**: Live tracking van gesprekken en minutengebruik
- 📱 **PWA Support**: Installeerbaar als mobiele app
- 🎨 **Voxa Auris Design**: Matching design met hoofdwebsite (#11b4eb, #f4dd8d)
- ⚡ **Snel & Modern**: Next.js 15 + React 19 + Tailwind CSS

## 🚀 SETUP INSTRUCTIES

### Stap 1: Run SQL in Supabase

**BELANGRIJK: Doe dit eerst!**

1. Ga naar: https://tsayxwcckrsawwtloxed.supabase.co/project/_/sql
2. Klik "New Query"
3. Copy-paste hele inhoud van `supabase-schema.sql`
4. Klik "Run" (of F5)

### Stap 2: Start Dashboard

```bash
cd /home/user/voxa-auris-dashboard
npm run dev
```

Dashboard: http://localhost:3000

### Stap 3: Maak Admin Account

1. Ga naar: https://tsayxwcckrsawwtloxed.supabase.co/project/_/auth/users
2. Klik "Add User" → "Create new user"
3. Email: **jouw@email.com** + Password
4. Run in SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin', client_id = NULL WHERE email = 'jouw@email.com';
```

5. Log in via: http://localhost:3000/login

## 🚀 Deploy naar Vercel

1. Push naar GitHub repo
2. Import in Vercel
3. Add Environment Variables (same as .env.local)
4. Deploy!
5. Add domain: dashboard.voxa-auris.com

---

Made with ❤️ by Claude Code
