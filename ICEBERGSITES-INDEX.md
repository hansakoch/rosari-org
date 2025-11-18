# 📚 ICEBERGSITES DOCUMENTATION INDEX

Complete guide to working with icebergsites projects in the Iceberg-Media organization.

---

## 📖 Documentation Files

### 1. [REPOSITORY-SETUP.md](./REPOSITORY-SETUP.md) 🏢
**CRITICAL: Repository location and structure**
- Where this template should live (`Iceberg-Media/sites`)
- How the automatic workflow works
- Repository naming conventions
- First-time setup instructions

### 2. [README.md](./README.md)
**Quick overview and automatic workflow**
- How the automatic prompts work
- What information will be collected
- Template features and capabilities

### 3. [QUICKSTART-ICEBERGSITES.md](./QUICKSTART-ICEBERGSITES.md) ⚡
**START HERE for new projects**
- Automatic session start workflow
- Essential commands reference
- Super quick TL;DR version
- Common troubleshooting

### 4. [SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md) 📋
**Complete Standard Operating Procedure**
- Detailed workflow documentation
- Business information collection requirements
- Cloudflare configuration details
- Security guidelines
- Full troubleshooting guide

### 5. [CLAUDE.md](./CLAUDE.md) 🤖
**Claude Code integration instructions**
- Development commands
- Tech stack architecture
- Container management
- GitHub integration
- Best practices

---

## 🗂️ Configuration Files

### Templates (Check into Git)

- **`.business-config.template.json`** - Example business configuration
- **`.dev.vars.template`** - Environment variables template
- **`.session-startup.sh`** - Interactive business info collector

### Generated Files (DO NOT COMMIT)

- **`.business-config.json`** - Actual business configuration (generated per project)
- **`.dev.vars`** - Actual environment variables (contains secrets)

### Cloudflare Configuration

- **`wrangler.jsonc`** - Cloudflare Workers configuration
- **`worker-configuration.d.ts`** - Auto-generated TypeScript types

---

## 🚀 Workflow Summary

### For New Projects (FULLY AUTOMATIC!):

**Step 1: Select Template**
- Open Claude Code
- Select: `Iceberg-Media/sites`

**Step 2: Answer Auto-Prompts**
- SessionStart hook automatically begins
- Answer questions about business (name, GBP link, NAP+W, etc.)
- `.business-config.json` auto-generated

**Step 3: Build & Deploy**
```bash
npm install
npm run cf-typegen
npm run dev      # Test locally
npm run deploy   # Deploy to Iceberg-Media Cloudflare
```

**No manual script running needed - it's all automatic!**

### Critical Information Priority:

1. 🌟 **GBP Share Link** (MOST IMPORTANT)
2. 📍 **NAP+W** (Name, Address, Phone, Website)
3. 📋 **Company Name** (for repository naming)
4. 📱 **Social Media** (Facebook, Instagram, etc.)
5. 🏆 **Accreditations** (BBB, Chamber, etc.)
6. 📂 **Directory Listings** (Yelp, Apple Maps, etc.)

---

## 🏢 Organization Standards

**Always use:**
- GitHub Organization: `Iceberg-Media`
- Repository Format: `Iceberg-Media/COMPANY_BIZ_NAME`
- Cloudflare Account: `0870b0bdbc14bcd31f43fe5e82c3ee8e`
- Branch Format: `claude/iceberg-sites-repo-[SESSION_ID]`

**Never use:**
- Personal accounts (hansakoch)
- Personal Cloudflare credentials
- Non-standard repository naming

---

## 📞 Support & Resources

### Internal

- **Owner**: Iceberg Media
- **Contact**: hansakoch@icebergmedia.com
- **Organization**: https://github.com/Iceberg-Media

### External Documentation

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Claude Code](https://docs.claude.com/en/docs/claude-code/)
- [Google Business Profile](https://support.google.com/business/)

---

## ✅ Pre-Deployment Checklist

Use this before every deployment:

- [ ] `.business-config.json` exists and complete
- [ ] **GBP Share Link present** (CRITICAL)
- [ ] NAP+W information accurate
- [ ] Repository: `Iceberg-Media/COMPANY_BIZ_NAME`
- [ ] `wrangler.jsonc` has account ID: `0870b0bdbc14bcd31f43fe5e82c3ee8e`
- [ ] `.dev.vars` NOT committed
- [ ] `npm run cf-typegen` executed
- [ ] Local dev tested (`npm run dev`)
- [ ] All dependencies installed

---

## 🔄 Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `bash .session-startup.sh` | Collect business information |
| `npm install` | Install dependencies |
| `npm run dev` | Start local development server |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run cf-typegen` | Generate TypeScript types |
| `cp .dev.vars.template .dev.vars` | Initialize environment variables |

---

## 🎯 File Decision Tree

**Need to...**

- **Set up the template repository?** → Read [REPOSITORY-SETUP.md](./REPOSITORY-SETUP.md) 🏢
- **Start a new project?** → Read [QUICKSTART-ICEBERGSITES.md](./QUICKSTART-ICEBERGSITES.md) ⚡
- **Understand the automatic workflow?** → Read [README.md](./README.md)
- **Understand the full SOP?** → Read [SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md) 📋
- **Configure Claude Code?** → Read [CLAUDE.md](./CLAUDE.md) 🤖
- **Troubleshoot issues?** → Check [QUICKSTART-ICEBERGSITES.md](./QUICKSTART-ICEBERGSITES.md) or [SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md)

---

**Last Updated**: 2025-11-18
**Version**: 1.0
