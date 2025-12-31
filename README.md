# Stars Mobiler 🚀

> A modern, zoneless Angular 21 implementation of the classic 4X space strategy game, rebuilt from the ground up with cutting-edge web technologies.

[![Azure Static Web Apps CI/CD](https://github.com/zebslc/stars-mobiler/actions/workflows/azure-static-web-apps-deploy.yml/badge.svg)](https://github.com/zebslc/stars-mobiler/actions/workflows/azure-static-web-apps-deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎮 About

Stars Mobiler is a comprehensive modernization of the beloved Stars! 4X strategy game, featuring:

- **Deep Strategy**: Manage fleets, colonize planets, research technologies, and engage in tactical combat
- **Economic Simulation**: Complex resource management and production chains
- **Ship Design**: Customize your fleet with modular components and hull types
- **Tech Progression**: Research trees with specialized racial traits
- **Turn-Based Gameplay**: Strategic planning with asynchronous multiplayer support

## ✨ Features

### Technical Highlights

- ⚡ **Zoneless Angular 21**: Cutting-edge change detection using signals
- 🎯 **Signals-First Architecture**: Modern reactive state management without RxJS
- 📦 **Standalone Components**: Fully modular, tree-shakeable code
- 🎨 **Modern UI/UX**: Responsive design for desktop and mobile
- 🚀 **Optimized Performance**: Lazy loading and route-level code splitting
- 🔧 **TypeScript**: Full type safety throughout the codebase

### Game Features

- 🌌 **Galaxy Map**: Interactive star map with fleet and planet management
- 🛸 **Fleet Management**: Command multiple fleets across the galaxy
- 🏭 **Colony Operations**: Build infrastructure and manage production
- 🔬 **Research System**: Unlock new technologies and ship components
- 🎨 **Ship Designer**: Create custom ship designs with visual designer
- ⚔️ **Combat System**: Tactical turn-based space battles

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/zebslc/stars-mobiler.git
cd stars-mobiler

# Install dependencies
npm install

# Start development server
npm start
```

Navigate to `http://localhost:4200/` — the app will auto-reload on file changes.

### Build

```bash
# Production build
npm run build

# Output: dist/stars-mobiler
```

### Testing

```bash
# Run unit tests
npm test

# Run linter
npm run lint
```

## 📁 Project Structure

```
stars-mobiler/
├── src/
│   ├── app/
│   │   ├── core/          # Cross-cutting concerns (state, guards, config)
│   │   ├── shared/        # Reusable UI components and utilities
│   │   ├── features/      # Feature modules
│   │   ├── screens/       # Page-level components
│   │   ├── services/      # Business logic services
│   │   ├── models/        # TypeScript interfaces and types
│   │   └── data/          # Static game data and tech trees
│   ├── assets/            # Images, sprites, imagemaps
│   └── environments/      # Environment configurations
├── docs/                  # Project documentation
│   ├── specs/            # Feature specifications
│   ├── adr/              # Architecture Decision Records
│   └── guardrails.md     # Development guidelines
├── infra/                # Azure infrastructure (Bicep)
└── .github/workflows/    # CI/CD pipelines
```

## 🏗️ Architecture

### Design Principles

- **Zoneless Change Detection**: Uses `provideZonelessChangeDetection()` for improved performance
- **Signals-First**: State management with Angular signals, avoiding RxJS in application code
- **DRY & YAGNI**: Don't Repeat Yourself, You Ain't Gonna Need It
- **No God Classes**: Small, focused components and services
- **OnPush Strategy**: All components use `ChangeDetectionStrategy.OnPush`

### Key Technologies

- **Angular 21**: Latest Angular with zoneless change detection
- **TypeScript 5.9**: Advanced type safety
- **Signals**: Reactive state management
- **Standalone Components**: No NgModules
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting

## 🌐 Deployment

### Azure Static Web Apps (Recommended)

The application is configured for deployment to Azure Static Web Apps, providing:

- ✅ **Free Tier Available**: 100 GB bandwidth, 250 GB storage
- ✅ **Global CDN**: Fast content delivery worldwide
- ✅ **Free SSL**: Automatic HTTPS certificates
- ✅ **PR Previews**: Staging environments for pull requests
- ✅ **GitHub Integration**: Automated CI/CD

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**

1. Fork this repository
2. Create Azure Static Web App via [Azure Portal](https://portal.azure.com)
3. Connect to your GitHub repository
4. Configure build:
   - Build Preset: Angular
   - App location: `/`
   - Output location: `dist/stars-mobiler`
5. Deploy automatically on push to `main`

**Live Demo**: `https://victorious-bush-0d7258103.4.azurestaticapps.net/` *(replace with your URL)*

## 📚 Documentation

- **[Architecture](ARCHITECTURE.md)**: System design and patterns
- **[Contributing](CONTRIBUTING.md)**: Contribution guidelines
- **[Deployment](DEPLOYMENT.md)**: Deployment guide for Azure
- **[Guardrails](docs/guardrails.md)**: Development best practices
- **[Specs](docs/specs/)**: Feature specifications
- **[ADRs](docs/adr/)**: Architecture decision records

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code of conduct
- Development setup
- Coding conventions
- Pull request process
- Testing requirements

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our conventions
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 Conventions

- Prefer `signal()`, `computed()`, `effect()` over RxJS observables
- All components use `ChangeDetectionStrategy.OnPush`
- Keep components small; extract complex logic to services/stores
- Avoid premature abstractions
- Use descriptive variable names
- Document complex algorithms and business logic
- Write unit tests for services and complex components

## 🎯 Roadmap

- [x] Core game loop and turn processing
- [x] Galaxy generation and map rendering
- [x] Fleet movement and management
- [x] Ship designer with component system
- [x] Research system and tech trees
- [ ] Combat resolution system
- [ ] AI opponents
- [ ] Multiplayer support
- [ ] Save/load game states
- [ ] Advanced analytics dashboard
- [ ] Mobile-optimized UI
- [ ] Progressive Web App (PWA) support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic **Stars!** game by Jeff Johnson and Jeff McBride
- Built with [Angular](https://angular.dev/)
- Hosted on [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/)
- Community contributors and testers

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/zebslc/stars-mobiler/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zebslc/stars-mobiler/discussions)

---

**Note**: This is a fan project and is not affiliated with or endorsed by the original Stars! creators.
