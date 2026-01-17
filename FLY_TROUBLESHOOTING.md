# Fly.io Troubleshooting

## Error: "Could not find a Dockerfile"

### Problem
You're running `flyctl launch` from the wrong directory.

### Solution

**You MUST run `flyctl launch` from the directory containing the Dockerfile:**

```bash
# For backend
cd backend
flyctl launch  # ✅ Correct - Dockerfile is in this directory

# NOT from root:
cd /path/to/gitgud
flyctl launch  # ❌ Wrong - no Dockerfile in root
```

---

## Verify You're in the Right Directory

Before running `flyctl launch`, check:

```bash
# Should show Dockerfile
ls Dockerfile

# Should show fly.toml (after first launch)
ls fly.toml
```

---

## Step-by-Step Fix

1. **Check current directory:**
   ```bash
   pwd
   # Should be: .../gitgud/backend or .../gitgud/frontend
   ```

2. **If you're in root, navigate:**
   ```bash
   cd backend  # or cd frontend
   ```

3. **Verify Dockerfile exists:**
   ```bash
   ls -la Dockerfile
   # Should show: -rw-r--r-- ... Dockerfile
   ```

4. **Now run launch:**
   ```bash
   flyctl launch
   ```

---

## If fly.toml Already Exists

If you already have a `fly.toml` but it's in the wrong place:

1. **Delete the app (if created):**
   ```bash
   flyctl apps destroy gitgud-backend
   ```

2. **Navigate to correct directory:**
   ```bash
   cd backend  # or frontend
   ```

3. **Launch again:**
   ```bash
   flyctl launch
   ```

---

## Directory Structure

Your project should look like this:

```
gitgud/
├── backend/
│   ├── Dockerfile      ← Backend Dockerfile
│   ├── fly.toml       ← Backend Fly config (created by flyctl launch)
│   └── ...
├── frontend/
│   ├── Dockerfile      ← Frontend Dockerfile
│   ├── fly.toml       ← Frontend Fly config (created by flyctl launch)
│   └── ...
└── ...
```

**Each service has its own directory with its own Dockerfile and fly.toml.**

---

## Common Mistakes

❌ **Running from root:**
```bash
cd /path/to/gitgud
flyctl launch  # Can't find Dockerfile
```

✅ **Running from service directory:**
```bash
cd /path/to/gitgud/backend
flyctl launch  # Finds Dockerfile ✅
```

---

## Still Having Issues?

1. **Check Dockerfile exists:**
   ```bash
   find . -name "Dockerfile"
   # Should show: ./backend/Dockerfile and ./frontend/Dockerfile
   ```

2. **Check you're logged in:**
   ```bash
   flyctl auth whoami
   ```

3. **Try manual launch:**
   ```bash
   cd backend
   flyctl launch --name gitgud-backend --region iad
   ```

4. **Check Fly.io docs:**
   https://fly.io/docs/getting-started/
