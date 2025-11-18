# ⚡ ICEBERGSITES QUICK START GUIDE

## 🎯 For New Projects

### Step 1: Run Setup Script

```bash
bash .session-startup.sh
```

This will prompt you for all business information. **Most important: GBP Share Link!**

### Step 2: Review Configuration

```bash
cat .business-config.json
```

Verify all information is correct, especially:
- ✅ Company name (used for repo naming)
- ✅ GBP share link (critical for SEO)
- ✅ NAP+W information (Name, Address, Phone, Website)

### Step 3: Set Up Environment

```bash
# Copy template
cp .dev.vars.template .dev.vars

# Install dependencies
npm install

# Generate Cloudflare types
npm run cf-typegen
```

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:8787` to test your worker.

### Step 5: Deploy

```bash
npm run deploy
```

Deploys to Iceberg-Media Cloudflare account automatically.

---

## 🔍 Quick Reference

### Essential Files

| File | Purpose |
|------|---------|
| `.business-config.json` | Auto-generated business info (GBP, NAP+W, socials) |
| `.dev.vars` | Local secrets (DO NOT COMMIT) |
| `wrangler.jsonc` | Cloudflare configuration |
| `SOP-ICEBERGSITES.md` | Complete workflow documentation |

### Essential Commands

```bash
# Collect business info
bash .session-startup.sh

# Local development
npm run dev

# Deploy to production
npm run deploy

# Update types after config changes
npm run cf-typegen
```

### Verification Checklist

Before deploying, confirm:

- [ ] `.business-config.json` exists and is complete
- [ ] **GBP Share Link** is present (MOST IMPORTANT)
- [ ] NAP+W information is accurate
- [ ] Repository is named `Iceberg-Media/COMPANY_BIZ_NAME`
- [ ] `wrangler.jsonc` has correct account ID
- [ ] `.dev.vars` is NOT committed to git
- [ ] Local dev works (`npm run dev`)

---

## 🆘 Common Issues

### "Permission denied" when running script
```bash
chmod +x .session-startup.sh
bash .session-startup.sh
```

### "Types out of sync" error
```bash
npm run cf-typegen
```

### "Deployment failed - wrong account"
Check `wrangler.jsonc` has:
```json
"account_id": "0870b0bdbc14bcd31f43fe5e82c3ee8e"
```

### "Missing business config"
```bash
bash .session-startup.sh
```
Re-run the setup script.

---

## 📊 Data Priority

When collecting information, prioritize:

1. **🌟 GBP Share Link** (Required - #1 priority)
2. **📍 NAP+W** (Essential for local SEO)
3. **📋 Company Name** (Required for repo)
4. **📱 Social Media** (Important for brand)
5. **🏆 Accreditations** (Trust signals)
6. **📂 Directory Listings** (Citations)

---

## 🔗 Resources

- **Full SOP**: [SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md)
- **Template Config**: [.business-config.template.json](./.business-config.template.json)
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Claude Code**: https://docs.claude.com/en/docs/claude-code/

---

**Questions?** Contact: hansakoch@icebergmedia.com

**Last Updated**: 2025-11-18
