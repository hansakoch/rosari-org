# 🏢 ICEBERGSITES REPOSITORY SETUP GUIDE

## 📍 Repository Location

This repository should be located at:

```
Iceberg-Media/sites
```

**This is the TEMPLATE repository** that you select when starting a new icebergsites project in Claude Code.

---

## 🔄 Workflow Overview

### Step 1: Select Template Repository

When starting Claude Code, select:
```
Organization: Iceberg-Media
Repository: sites
```

### Step 2: Automatic Prompts Begin

As soon as the session starts, the **session-start hook** automatically runs and prompts you for:

**Note**: This hook is configured for **Claude Code on the web** (claude.ai/code). Once this repository is pushed to the default branch, all future sessions will automatically trigger the business information collection prompts.

1. **Business Name** (e.g., "Acme-Plumbing")
   - This determines the final repo name: `Iceberg-Media/Acme-Plumbing`

2. **🌟 GBP Share Link** (MOST IMPORTANT!)
   - Example: `https://maps.app.goo.gl/abc123`
   - This is the #1 priority for local SEO

3. **📍 NAP+W Information**
   - Name, Address, Phone, Website

4. **Additional Information**
   - Social media, accreditations, directories, etc.

### Step 3: Auto-Configuration

The system automatically generates `.business-config.json` with all your answers.

### Step 4: Ready to Build!

Claude is now ready to help you build the icebergsites project with full context of the business.

---

## 📂 Repository Structure

```
Iceberg-Media/
├── sites/                           ← TEMPLATE (select this in Claude Code)
│   ├── .claude/
│   │   └── hooks/
│   │       └── SessionStart         ← Automatic prompt script
│   ├── .business-config.json        ← Generated per project
│   ├── .dev.vars                    ← Local secrets (not committed)
│   ├── wrangler.jsonc               ← Pre-configured for Iceberg-Media
│   ├── SOP-ICEBERGSITES.md         ← Full documentation
│   └── ...
│
├── Acme-Plumbing/                   ← GENERATED PROJECT (example)
│   └── (icebergsites project files)
│
├── Smiths-HVAC/                     ← GENERATED PROJECT (example)
│   └── (icebergsites project files)
│
└── Joes-Auto-Body/                  ← GENERATED PROJECT (example)
    └── (icebergsites project files)
```

---

## ⚡ Quick Start (TL;DR)

1. Open Claude Code
2. Select `Iceberg-Media/sites`
3. Answer the automatic prompts
4. Run `npm install && npm run cf-typegen && npm run dev`
5. Build your icebergsites project!

**That's it! No manual configuration needed.**

---

## 🎯 Why This Structure?

### Benefits:

1. **Single Template**: One `Iceberg-Media/sites` repository contains the template
2. **Automatic Prompts**: No manual script running - hooks do it automatically
3. **Consistent Setup**: Every project starts with the same workflow
4. **Easy to Find**: All icebergsites projects are in `Iceberg-Media` org
5. **No Manual Config**: Everything is automated via the SessionStart hook

### Repository Naming Convention:

- **Template**: `Iceberg-Media/sites`
- **Projects**: `Iceberg-Media/[BUSINESS-NAME]`
  - Examples:
    - `Iceberg-Media/Acme-Plumbing`
    - `Iceberg-Media/Smiths-HVAC`
    - `Iceberg-Media/Joes-Auto-Body`

---

## 🔧 Setting Up the Template Repository

### First Time Setup:

1. **Create the repository** on GitHub:
   ```
   Organization: Iceberg-Media
   Repository name: sites
   Visibility: Private
   ```

2. **Push this codebase**:
   ```bash
   git remote set-url origin git@github.com:Iceberg-Media/sites.git
   git push -u origin main
   ```

3. **Done!** The template is ready to use.

### Using the Template:

Every time you start a new icebergsites project:

1. Open Claude Code
2. Select `Iceberg-Media/sites`
3. Answer the prompts (business name, GBP link, etc.)
4. Build the project

The `.business-config.json` file will be different for each project session, but the template remains the same.

---

## ✅ Verification Checklist

Before using this template, ensure:

- [ ] Repository exists at `Iceberg-Media/sites`
- [ ] `.claude/hooks/SessionStart` is executable (`chmod +x`)
- [ ] `wrangler.jsonc` has Iceberg-Media account ID
- [ ] `.dev.vars.template` has correct credentials
- [ ] `.gitignore` excludes `.business-config.json`
- [ ] All documentation files are present

---

## 🆘 Troubleshooting

### Prompts don't start automatically
**Cause**: SessionStart hook not executable
**Fix**: `chmod +x .claude/hooks/SessionStart`

### Wrong Cloudflare account
**Cause**: `wrangler.jsonc` not configured
**Fix**: Check `account_id` is `0870b0bdbc14bcd31f43fe5e82c3ee8e`

### Can't find template repository
**Cause**: Repository not at `Iceberg-Media/sites`
**Fix**: Create or rename repository to `Iceberg-Media/sites`

---

## 📚 Additional Resources

- [QUICKSTART-ICEBERGSITES.md](./QUICKSTART-ICEBERGSITES.md) - Quick reference
- [SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md) - Complete SOP
- [ICEBERGSITES-INDEX.md](./ICEBERGSITES-INDEX.md) - Documentation index

---

**Questions?** Contact: hansakoch@icebergmedia.com

**Last Updated**: 2025-11-18
