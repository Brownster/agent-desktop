# Amazon Connect Agent Desktop

[![GitHub Issues](https://img.shields.io/github/issues/Brownster/agent-desktop)](https://github.com/Brownster/agent-desktop/issues)
[![GitHub Stars](https://img.shields.io/github/stars/Brownster/agent-desktop)](https://github.com/Brownster/agent-desktop/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Links

- **[📖 Main Documentation](../README.md)** - Complete project overview
- **[🗺️ Roadmap](../ROADMAP.md)** - Development timeline and milestones  
- **[📋 Component Docs](../docs/COMPONENTS.md)** - Detailed component documentation
- **[📝 Changelog](../CHANGELOG.md)** - Version history and changes

## 🎯 Project Status

### ✅ Phase 1 Complete (Q1 2024)
- **Core CCP Components**: 5 major components built
- **State Management**: Complete Zustand store architecture
- **Documentation**: Comprehensive docs and roadmap
- **TypeScript**: Strict typing throughout

### 🚧 Phase 2 In Progress (Q2 2024)
- **Admin Dashboard**: Customer configuration management
- **Module System**: Dynamic feature loading
- **Infrastructure**: AWS CDK deployment
- **Enterprise Features**: Multi-tenant support

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript 5.2+ |
| **Build** | Vite + SWC |
| **Styling** | Tailwind CSS + Headless UI |
| **State** | Zustand + Immer |
| **Monorepo** | Nx 17+ |
| **Testing** | Jest + RTL + Playwright |

## 📱 Applications

### CCP Client (`apps/ccp-client`) ✅
The main contact center agent application with full Amazon Connect integration.

**Components Built:**
- 📞 **Call Controls** - Accept, hold, mute, transfer, conference
- 👤 **Contact Info** - Customer details and interaction timeline  
- 🔢 **Dialpad** - DTMF tones with Web Audio API
- 💬 **Chat Interface** - Real-time messaging with attachments
- 📊 **Queue Dashboard** - Live statistics and performance metrics

### CCP Admin (`apps/ccp-admin`) 🚧
Configuration dashboard for managing customer deployments and features.

**Planned Features:**
- Customer configuration management
- Module enable/disable controls
- User management and permissions
- Analytics and reporting

## 🏗️ Libraries

| Library | Purpose | Status |
|---------|---------|--------|
| `@agent-desktop/types` | TypeScript definitions | ✅ Complete |
| `@agent-desktop/core` | Business logic & modules | ✅ Foundation |
| `@agent-desktop/config` | Configuration management | ✅ Complete |
| `@agent-desktop/logging` | Enterprise logging | ✅ Complete |

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Brownster/agent-desktop.git
cd agent-desktop

# Install dependencies
pnpm install

# Start development
pnpm nx run @agent-desktop/ccp-client:dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](../CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for the contact center community**