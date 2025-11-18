# 🤖 Claude Code on Cloudflare - Icebergsites Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ghostwriternr/claude-code-containers)

## 🏢 Iceberg Media - Automatic Icebergsites Workflow

**⚠️ TEMPLATE REPOSITORY**: `Iceberg-Media/sites`

This repository should be deployed at **`Iceberg-Media/sites`** and used as a template for all icebergsites projects.

### ⚡ How It Works (FULLY AUTOMATIC!)

1. **Select Repository**: Choose `Iceberg-Media/sites` when starting Claude Code
2. **Auto-Prompts Begin**: Session hook automatically starts collecting business information
3. **Answer Questions**: Provide business details in this order:
   - 🏢 **Business Name** (creates repo: `Iceberg-Media/YOUR-BIZ-NAME`)
   - 🌟 **GBP Share Link** (MOST IMPORTANT!)
   - 📍 **NAP+W** (Name, Address, Phone, Website)
   - 📱 **Social Media**, 🏆 **Accreditations**, 📂 **Directories**, etc.
4. **Auto-Configuration**: `.business-config.json` is generated automatically
5. **Start Building**: Claude is ready to build your icebergsites project!

**No manual scripts to run. No configuration files to edit. Just answer the prompts!**

---

## 🎯 What You'll Be Prompted For

When you start a session, you'll be asked for:

### 🌟 Priority #1: Google Business Profile
- **GBP Share Link** (CRITICAL for local SEO)
- GBP Place ID (optional)
- GBP CID (optional)

### 📍 Core Business Information (NAP+W)
- Business Name
- Complete Address
- Primary Phone
- Website URL

### 📱 Social Media Platforms
- Facebook, Instagram, Twitter/X
- LinkedIn, YouTube, TikTok
- Pinterest, Yelp

### 🏆 Trust Signals
- BBB Accreditation
- Chamber of Commerce
- Professional Associations
- Industry Awards

### 📂 Directory Listings
- Apple Maps, Bing Places
- Yellow Pages, Angi
- Houzz, Thumbtack
- Other directories

### 📞 Additional Details
- Contact info (email, alt phone, fax)
- Business hours
- Industry, services, founding year, employees

---

## 📋 After Auto-Setup Completes

Once the automatic prompts finish, run:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (if needed)
cp .dev.vars.template .dev.vars

# 3. Generate Cloudflare types
npm run cf-typegen

# 4. Start local development
npm run dev

# 5. Deploy to Cloudflare (Iceberg-Media account)
npm run deploy
```

---

## 📊 Repository Structure

**Template Repo**: `Iceberg-Media/sites` ← Select this when starting Claude Code
**Generated Project Repo**: `Iceberg-Media/YOUR-BIZ-NAME` ← Auto-created from your input
**Cloudflare Account**: `0870b0bdbc14bcd31f43fe5e82c3ee8e` (Iceberg-Media)

See **[SOP-ICEBERGSITES.md](./SOP-ICEBERGSITES.md)** for complete workflow documentation.

---

## 📖 About This Template

This template provides a containerized environment on Cloudflare workers for Claude Code to process GitHub issues. It listens to new issues created from your connected repositories, and creates a Pull Request to solve them.

## ✨ Features

- **🔌 Leading coding agent**: Leverage the same [Claude Code](https://claude.ai/code) that you already use for coding tasks
- **⚡ Lightning Fast**: Cloudflare Containers provide instant scaling and sub-millisecond response times so Claude Code can work on any number of issues concurrently
- **🔧 Zero Configuration**: One-click deployment with guided setup process
- **🛡️ Installation Token Management**: Secure, auto-refreshing GitHub App tokens
- **🔒 Secure**: Deploys to your own Cloudflare account

## 🚀 Quickstart

### 1️⃣ Deploy to Cloudflare

Click the deploy button above to instantly deploy to your Cloudflare account. The deployment includes:
- Cloudflare Worker with Container support
- Durable Objects for secure storage
- All necessary bindings and configurations

### 2️⃣ Set Up Anthropic API

After deployment, you'll need to configure your Claude AI integration:

1. **Get your Anthropic API key**:
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an API key with appropriate permissions

2. **Configure the API key**:
   - Navigate to your deployed worker's `/claude-setup` endpoint
   - Enter your Anthropic API key
   - The system will securely encrypt and store your credentials

### 3️⃣ Install GitHub App

Once you complete the Anthropic API setup, you'll be redirected to the `/gh-setup` endpoint (or you can access it manually), which will guide you through installing the GitHub App and configuring access to your repositories. The system will automatically capture installation details.


## 📋 Usage

Once configured, the system works automatically:

1. **Issue Creation**: When someone creates an issue in your repository, Claude receives a webhook
2. **AI Analysis**: Claude analyzes the issue content and begins processing
3. **Progress Updates**: Real-time progress comments appear as Claude works
4. **Solution Delivery**: Claude provides comprehensive solutions with code examples
5. **Task Completion**: Final completion comment marks the end of processing

## 💻 Local development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📄 License

This project is open source and available under the MIT License.
