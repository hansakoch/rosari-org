# ICEBERGSITES PROJECT WORKFLOW - STANDARD OPERATING PROCEDURE

## 🎯 Overview

This SOP defines the standardized workflow for creating and deploying icebergsites projects under the Iceberg-Media organization. All projects must follow this structure to ensure consistency, proper deployment, and easy management.

---

## 📋 CRITICAL REQUIREMENTS

### Organization Structure
- **GitHub Organization**: `Iceberg-Media`
- **Repository Naming**: `Iceberg-Media/COMPANY_BIZ_NAME`
- **Cloudflare Account**: Iceberg-Media (Account ID: `0870b0bdbc14bcd31f43fe5e82c3ee8e`)
- **Branch Naming**: `claude/iceberg-sites-repo-[SESSION_ID]`

### ⚠️ DO NOT
- ❌ Create projects in personal accounts (hansakoch)
- ❌ Use personal Cloudflare credentials
- ❌ Skip the business information collection process
- ❌ Deploy without proper configuration

---

## 🚀 PROJECT SETUP WORKFLOW

### Step 1: Start New Session

1. Open Claude Code session
2. Select **Iceberg-Media** organization
3. Session will automatically prompt for business details

### Step 2: Collect Business Information

The session startup script will prompt for the following information in order:

#### 📋 **COMPANY IDENTIFICATION**
- Business Name (for repo naming)
- Legal Business Name (if different)
- DBA / Trading As

#### 📍 **NAP+W - PRIMARY BUSINESS INFORMATION** ⭐
Critical for SEO and local citations:
- Official Business Name
- Street Address
- City
- State/Province
- ZIP/Postal Code
- Country
- Primary Phone Number
- Website URL

#### 🌟 **GOOGLE BUSINESS PROFILE** (MOST IMPORTANT!)
- **GBP Share Link** ⭐⭐⭐ (REQUIRED - This is the #1 priority)
- GBP Place ID (optional)
- GBP CID (optional)

#### 📱 **SOCIAL MEDIA PLATFORMS**
- Facebook URL
- Instagram URL
- Twitter/X URL
- LinkedIn URL
- YouTube URL
- TikTok URL
- Pinterest URL
- Yelp URL

#### 🏆 **MEMBERSHIPS & ACCREDITATIONS**
- BBB Accreditation
- Chamber of Commerce Membership
- Professional Associations/Certifications
- Industry Awards/Recognition
- Other Memberships/Accreditations

#### 📂 **DIRECTORY LISTINGS**
- Apple Maps Business URL
- Bing Places URL
- Yellow Pages URL
- Angi/Angie's List URL
- Houzz URL
- Thumbtack URL
- Other Important Directories

#### 📞 **ADDITIONAL CONTACT INFO**
- Primary Email
- Alternative Phone
- Fax Number
- Business Hours

#### 💼 **BUSINESS DETAILS**
- Industry/Sector
- Primary Services/Products
- Year Founded
- Number of Employees

### Step 3: Configuration File Generation

After collecting all information, the system automatically generates `.business-config.json`:

```json
{
  "projectInfo": {
    "companyBizName": "COMPANY_NAME",
    "organization": "Iceberg-Media",
    "repository": "Iceberg-Media/COMPANY_NAME",
    "createdAt": "2025-11-18T12:00:00Z"
  },
  "napw": {
    "name": "Business Name",
    "address": { ... },
    "phone": "+1-555-1234",
    "website": "https://example.com"
  },
  "googleBusinessProfile": {
    "shareLink": "https://maps.app.goo.gl/...",
    "placeId": "ChIJ...",
    "cid": "123456789"
  },
  "socialMedia": { ... },
  "membershipsAccreditations": { ... },
  "directoryListings": { ... },
  "cloudflare": {
    "accountId": "0870b0bdbc14bcd31f43fe5e82c3ee8e",
    "organization": "Iceberg-Media"
  }
}
```

### Step 4: Repository Setup

The system will:
1. Create repository at `Iceberg-Media/COMPANY_BIZ_NAME`
2. Initialize with icebergsites template
3. Configure Cloudflare Workers with Iceberg-Media account
4. Set up development branch: `claude/iceberg-sites-repo-[SESSION_ID]`

### Step 5: Development & Deployment

```bash
# Install dependencies
npm install

# Generate Cloudflare types
npm run cf-typegen

# Start local development
npm run dev
# Server runs at http://localhost:8787

# Deploy to Cloudflare Workers (Iceberg-Media account)
npm run deploy
```

---

## 🔧 CLOUDFLARE CONFIGURATION

### Account Details
- **Account ID**: `0870b0bdbc14bcd31f43fe5e82c3ee8e`
- **Organization**: Iceberg-Media
- **API Token**: Stored in `.dev.vars` (never commit)

### Wrangler Configuration (`wrangler.jsonc`)
```jsonc
{
  "account_id": "0870b0bdbc14bcd31f43fe5e82c3ee8e",
  "name": "icebergsites-[COMPANY_BIZ_NAME]",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-23",
  "nodejs_compat": true
}
```

### Environment Variables (`.dev.vars`)
```env
CLOUDFLARE_ACCOUNT_ID=0870b0bdbc14bcd31f43fe5e82c3ee8e
CLOUDFLARE_API_TOKEN=JTWnVG4rsjT0v3qBf-Ldu6EMMtFIMWEBItedbJny
CLOUDFLARE_D1_UUID=https://api.cloudflare.com/client/v4/accounts/0870b0bdbc14bcd31f43fe5e82c3ee8e/d1/database
```

**⚠️ SECURITY**: Never commit `.dev.vars` to git. It's in `.gitignore` by default.

---

## 📊 DIRECTORY STRUCTURE

```
Iceberg-Media/COMPANY_BIZ_NAME/
├── .business-config.json       # Auto-generated business info
├── .dev.vars                   # Local secrets (not committed)
├── wrangler.jsonc             # Cloudflare Workers config
├── src/
│   ├── index.ts               # Main worker entry point
│   └── handlers/              # Request handlers
├── container_src/
│   └── src/
│       └── main.ts            # Claude Code container
├── CLAUDE.md                  # Claude Code instructions
├── SOP-ICEBERGSITES.md       # This document
└── README.md                  # Project documentation
```

---

## ✅ VERIFICATION CHECKLIST

Before deployment, verify:

- [ ] Repository is in `Iceberg-Media` organization
- [ ] Repository name matches `COMPANY_BIZ_NAME`
- [ ] `.business-config.json` contains all required information
- [ ] **GBP Share Link is present** (MOST IMPORTANT)
- [ ] NAP+W information is complete and accurate
- [ ] `wrangler.jsonc` uses Iceberg-Media account ID
- [ ] `.dev.vars` is NOT committed to git
- [ ] `npm run cf-typegen` has been run
- [ ] Local development works (`npm run dev`)
- [ ] Deployment succeeds (`npm run deploy`)

---

## 🎯 DATA PRIORITY HIERARCHY

When collecting information, prioritize in this order:

1. **🌟 GBP Share Link** - CRITICAL (Required for local SEO)
2. **📍 NAP+W** - Essential (Name, Address, Phone, Website)
3. **📋 Company Identification** - Essential (For repo naming)
4. **📱 Social Media** - Important (For brand presence)
5. **🏆 Memberships & Accreditations** - Important (For trust signals)
6. **📂 Directory Listings** - Nice to have (For citations)
7. **💼 Business Details** - Nice to have (For context)

---

## 🔄 WORKFLOW DIAGRAM

```
Start New Session
       ↓
Select Iceberg-Media Org
       ↓
Run .session-startup.sh
       ↓
Collect Business Info
  (GBP Link Priority #1)
       ↓
Generate .business-config.json
       ↓
Create Repo: Iceberg-Media/COMPANY_BIZ_NAME
       ↓
Configure Cloudflare
  (Account: Iceberg-Media)
       ↓
npm install
       ↓
npm run cf-typegen
       ↓
npm run dev (test locally)
       ↓
npm run deploy
       ↓
Verify deployment
       ↓
Done! ✅
```

---

## 🆘 TROUBLESHOOTING

### Issue: Deployment fails with 403 error
**Solution**: Ensure branch name starts with `claude/` and matches session ID

### Issue: Types out of sync
**Solution**: Run `npm run cf-typegen` after any `wrangler.jsonc` changes

### Issue: Wrong Cloudflare account
**Solution**: Check `wrangler.jsonc` has correct `account_id`

### Issue: Missing business info
**Solution**: Re-run `.session-startup.sh` to regenerate config

### Issue: GBP link not working
**Solution**: Verify GBP share link format: `https://maps.app.goo.gl/...`

---

## 📚 ADDITIONAL RESOURCES

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/)
- [Google Business Profile Help](https://support.google.com/business/)

---

## 🔐 SECURITY NOTES

1. **Never commit secrets** - Use `.dev.vars` for local development
2. **Use Iceberg-Media credentials only** - No personal accounts
3. **Encrypt sensitive data** - Use Durable Objects for storage
4. **Verify webhook signatures** - Always validate GitHub webhooks
5. **Rotate tokens regularly** - Update API tokens every 90 days

---

## 📝 CHANGE LOG

- **2025-11-18**: Initial SOP creation
  - Defined Iceberg-Media organization structure
  - Created business info collection workflow
  - Established GBP share link as top priority
  - Configured Cloudflare account standardization

---

**Last Updated**: 2025-11-18
**Version**: 1.0
**Owner**: Iceberg Media
**Contact**: hansakoch@icebergmedia.com
