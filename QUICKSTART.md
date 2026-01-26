# 🚀 Aviaframe Quickstart Guide

**Welcome!** This guide will help you get started with your Aviaframe monorepo.

---

## ✅ What's Already Done

Your project has been created with:
- ✅ **Complete documentation** (7 detailed MD files in `docs/`)
- ✅ **Project structure** (backend, portal, widget, infra)
- ✅ **Configuration files** (ESLint, Jest, Docker Compose)
- ✅ **GitHub templates** (Issues, PRs, CI workflow)
- ✅ **Copilot instructions** (AI coding guidelines in `.github/`)

**Total:** 36 files, 2092 lines of documentation, 248KB

---

## 📍 Current Status

```bash
Location: ~/projects/aviaframe
Status:   ✅ Files created, ⏳ Not yet pushed to GitHub
```

---

## 🎯 Next Steps

### **Step 1: Navigate to Project**

```bash
cd ~/projects/aviaframe
```

### **Step 2: Review the Structure**

```bash
# See all files
ls -la

# View architecture overview
cat ARCHITECTURE.md

# Check documentation
ls docs/
```

### **Step 3: Install GitHub CLI (if needed)**

```bash
# Check if installed
gh --version

# If not installed:
brew install gh

# Authenticate
gh auth login
```

### **Step 4: Initialize Git & Push to GitHub**

```bash
# Initialize git
git init -b main

# Add all files
git add .

# Create first commit
git commit -m "chore: initial scaffold and documentation

- Complete BRD, PRD, SRS, Data Model, API Spec, Security docs
- Backend, Portal, Widget scaffolding
- Docker Compose setup
- ESLint + Jest configuration
- Copilot instructions for AI-assisted development

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Create private GitHub repo and push (one command does it all!)
gh repo create Sergiodan2013/aviaframe \
  --private \
  --description "Aviaframe B2B SaaS platform for flight search & booking via DRCT API" \
  --source=. \
  --remote=origin \
  --push
```

**Alternative (manual push):**

```bash
git remote add origin git@github.com:Sergiodan2013/aviaframe.git
git push -u origin main
```

### **Step 5: View on GitHub**

```bash
# Open in browser
gh repo view --web

# Or visit directly:
open https://github.com/Sergiodan2013/aviaframe
```

---

## 📖 Understanding the Project

### **Start Here:**

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** — System overview & architecture
2. **[docs/README.md](docs/README.md)** — Documentation index
3. **[docs/01_BRD.md](docs/01_BRD.md)** — Business requirements

### **For Developers:**

- **Backend:** [backend/README.md](backend/README.md)
- **Portal:** [portal/README.md](portal/README.md)
- **Widget:** [widget/README.md](widget/README.md)
- **API Spec:** [docs/06_API_SPEC.md](docs/06_API_SPEC.md)
- **Security:** [docs/08_SECURITY.md](docs/08_SECURITY.md)

### **For AI Coding:**

- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** — Binding rules for Copilot/AI

---

## 🛠️ Development Commands

```bash
# Install dependencies (after adding package.json details)
npm ci

# Lint code
npm run lint

# Run tests
npm test

# Build all packages
npm run build

# Start Docker Compose (backend + portal)
npm start
```

---

## 📋 TODO: Implementation Phases

### **Phase 1: Setup (Current)**
- [x] Documentation complete
- [x] Project structure created
- [ ] Push to GitHub
- [ ] Set up CI/CD (GitHub Actions already configured)

### **Phase 2: Backend Development**
- [ ] Implement tenant management
- [ ] DRCT adapter with rate limiting
- [ ] Idempotency middleware
- [ ] Authentication & authorization
- [ ] Sandbox integration tests

### **Phase 3: Portal Development**
- [ ] Tenant onboarding UI
- [ ] Widget config editor
- [ ] Order management dashboard
- [ ] API key management

### **Phase 4: Widget Development**
- [ ] Search form component
- [ ] Results listing
- [ ] Booking flow
- [ ] Origin validation

### **Phase 5: Production Readiness**
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring & alerting
- [ ] Production DRCT integration

---

## 🔒 Security Reminders

**CRITICAL RULES** (see [.github/copilot-instructions.md](.github/copilot-instructions.md)):

1. **Never expose DRCT bearer tokens to frontend**
2. **All backend operations must be tenant-scoped**
3. **Mask PII in logs** (passport numbers, emails, etc.)
4. **Use idempotency keys** for order creation & ticket issuing
5. **Respect DRCT rate limits** (e.g., offers_search = 1 rps)
6. **Docs in /docs are the source of truth** — update them!

---

## 📊 Project Stats

```
Total Files:        36
Markdown Docs:      18
JavaScript Files:   6
Documentation Lines: 2,092
Project Size:       248 KB
```

---

## 🆘 Troubleshooting

### "Command not found: gh"
```bash
brew install gh
gh auth login
```

### "Permission denied (publickey)"
```bash
# Generate SSH key if needed
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
ssh-add ~/.ssh/id_ed25519

# Add to GitHub: Settings → SSH Keys
cat ~/.ssh/id_ed25519.pub
```

### "Directory not empty"
```bash
# If you need to reinitialize:
cd ~/projects
rm -rf aviaframe
# Re-run create_project.sh from source directory
```

---

## 📞 Support

- **Issues:** Use GitHub Issues (after pushing to GitHub)
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md)
- **License:** MIT — See [LICENSE](LICENSE)

---

## 🎉 Success Checklist

- [ ] Navigated to `~/projects/aviaframe`
- [ ] Reviewed `ARCHITECTURE.md`
- [ ] Installed `gh` CLI
- [ ] Ran `git init -b main`
- [ ] Ran `git add .` and `git commit`
- [ ] Created repo with `gh repo create`
- [ ] Verified on GitHub
- [ ] Read `docs/01_BRD.md`
- [ ] Ready to start Phase 2 development!

---

**Last Updated:** 2026-01-26
**Project Created By:** Sergiodan2013 + Claude Sonnet 4.5
