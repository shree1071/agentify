# Supabase Setup Guide

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name**: `agentify-trading`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for start

### 2. Run Database Migrations

Once your project is created:

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Copy and paste the SQL from each migration file **in order**:

   **Run these in sequence:**
   ```
   1. supabase/migrations/001_initial_schema.sql
   2. supabase/migrations/002_rls_policies.sql
   3. supabase/migrations/003_functions_and_triggers.sql
   ```

4. Click **Run** for each migration

### 3. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ keep secret!)

### 4. Configure Environment Variables

**Backend (.env)**:
```bash
cd c:\Users\shree\Desktop\agentify\backend
# Add to your .env file:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend (.env.local)**:
```bash
cd c:\Users\shree\Desktop\agentify\frontend
# Add to your .env.local file:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📦 Install Dependencies

### Backend
```bash
cd c:\Users\shree\Desktop\agentify\backend
pip install supabase
```

### Frontend
```bash
cd c:\Users\shree\Desktop\agentify\frontend
npm install @supabase/supabase-js
```

---

## ✅ Verify Setup

### Test in Supabase Dashboard

1. Go to **Table Editor**
2. You should see 8 tables:
   - users
   - user_settings
   - ai_signals
   - trades
   - portfolios
   - performance_metrics
   - trade_strategies
   - audit_logs

3. Try inserting a test user:
   ```sql
   INSERT INTO users (wallet_address, username)
   VALUES ('0x1234...', 'test_user');
   ```

4. Check if `user_settings` was auto-created (trigger should work!)

---

## 🔐 Security Checklist

- ✅ RLS (Row Level Security) is enabled on all tables
- ✅ Users can only see/edit their own data
- ✅ Service role key is NEVER exposed to frontend
- ✅ Anon key is safe for frontend use (with RLS)

---

## 📊 Database Features

### ✨ What You Get:

1. **Auto-timestamps**: `created_at`, `updated_at` auto-managed
2. **Auto-settings**: User settings created on signup
3. **Win Rate Function**: `calculate_win_rate(user_id, days)`
4. **Portfolio Value**: `get_portfolio_value(user_id)`
5. **Audit Logging**: `log_user_action()` for compliance
6. **Indexes**: Optimized for common queries

### 📈 Example Queries:

**Get user win rate:**
```sql
SELECT calculate_win_rate(auth.uid(), 30) as win_rate_30d;
```

**Get recent trades:**
```sql
SELECT * FROM trades 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 Next Steps

After setup is complete:

1. ✅ Run migrations in Supabase dashboard
2. ✅ Add API keys to `.env` files
3. ✅ Install dependencies (`pip install supabase`, `npm install @supabase/supabase-js`)
4. ✅ Test connection with a simple query
5. 🚀 Start integrating into backend/frontend!

---

## 🆘 Troubleshooting

**Issue**: "relation doesn't exist"
- **Fix**: Run migrations in correct order (001, 002, 003)

**Issue**: "RLS policy violation"
- **Fix**: Ensure you're using `auth.uid()` in queries
- Or use service role key for backend operations

**Issue**: "JWT expired"
- **Fix**: Regenerate API keys in Supabase dashboard

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

**You're all set!** 🎉
