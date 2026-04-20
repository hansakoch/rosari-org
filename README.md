# ✝️Rosari📿 — A Modern Rosary Web App🙏

A beautiful, fully-featured Progressive Web App (PWA) for praying the rosary with authentic Latin prayers, intelligent text-to-speech, and a seamless cross-platform experience.

## ✨ Features

- **📿 Latin Prayers** — Complete rosary prayers in Latin with proper liturgical structure
- **🎤 AI Voice** — xAI WebSocket Voice API for natural, expressive audio narration with gender selection
- **🔊 Ambient Audio** — Gentle ambient audio accompaniment with customizable volume
- **💾 Smart Caching** — KV cache-first TTS system minimizes API usage and costs
- **🎵 Karaoke Mode** — Follow along with prayer text synchronized to audio
- **📅 Liturgical Seasons** — Dynamically adapts prayers based on the liturgical calendar
- **🌐 Full-Screen Design** — Immersive, distraction-free prayer interface
- **📱 Mobile First** — Optimized for iOS, Android, and all modern browsers
- **⚡ Offline Ready** — Works as a PWA with offline capabilities
- **♿ Accessible** — WCAG-compliant with proper semantic HTML and ARIA labels
- **🚀 Fast** — Built with Astro 5 for optimal performance and instant load times

## 🛠️ Tech Stack

- **[Astro 5](https://astro.build/)** — Static site generation with partial hydration
- **[Cloudflare Workers](https://workers.cloudflare.com/)** — Serverless edge computing
- **[Cloudflare KV](https://developers.cloudflare.com/kv/)** — Distributed caching for TTS results
- **[xAI Voice API](https://docs.xai.com/)** — Advanced text-to-speech with natural voice synthesis
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **[PWA](https://web.dev/progressive-web-apps/)** — Progressive Web App standards

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/hansakoch/rosari-org.git
cd rosari-org

# Install dependencies
npm install

# Set up environment variables
cp .dev.vars.template .dev.vars
# Edit .dev.vars with your xAI API key and other configuration
```

## 🚀 Development

```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Generate Cloudflare types
npm run cf-typegen
```

## 🚀 Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

The app will be deployed to your Cloudflare account with all bindings (KV storage, environment variables) configured.

## 🔧 Configuration

Create a `.dev.vars` file based on `.dev.vars.template` with the following:

- `XAI_API_KEY` — Your xAI API key for Voice API access
- `KV_NAMESPACE_ID` — Cloudflare KV namespace ID for TTS caching
- Other environment-specific settings

## 📖 Project Structure

```
src/
├── pages/           # Astro pages and routes
├── components/      # Reusable UI components
├── layouts/         # Page layouts
├── api/            # API endpoints for KV caching, TTS processing
├── styles/         # Global styles and theme
└── utils/          # Helper functions, prayer data
```

## 📜 License

This project is **open source** and licensed under the **MIT License** — free for anyone to download, use, modify, and distribute. See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests to improve the app.

## 🙌 Acknowledgments

- Built with [Astro](https://astro.build/)
- Powered by [xAI](https://www.x.ai/) for voice synthesis
- Hosted on [Cloudflare](https://cloudflare.com/)
- Prayer texts sourced from traditional Roman Catholic liturgical sources

---

**Made with ❤️ for the faithful.**
