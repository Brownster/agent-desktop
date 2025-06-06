# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Amazon Connect CCP (Contact Control Panel) desktop application project focused on building a modular, configurable solution for contact center agents. The application emphasizes VDI optimization, enterprise-grade architecture, and customer-specific deployments.

## Technology Stack

**Core Technologies:**
- **Framework:** React 18+ with TypeScript 5.2+
- **Build System:** Vite + SWC for fast compilation
- **Package Manager:** pnpm for performance and workspace support
- **Node Version:** 20.x LTS
- **Monorepo:** Nx 17+ with TypeScript
- **Bundling:** Webpack 5 with Module Federation for modular loading

**Infrastructure:**
- **Cloud Platform:** AWS with Infrastructure as Code (CDK)
- **Hosting:** S3 + CloudFront for static hosting
- **Configuration Storage:** DynamoDB with global tables
- **API:** AWS Lambda + API Gateway
- **CI/CD:** GitHub Actions with comprehensive testing pipeline

**UI & Styling:**
- **UI Components:** Tailwind CSS + Headless UI
- **State Management:** Zustand or Redux Toolkit (to be determined)
- **Testing:** Jest + React Testing Library + Cypress

## Project Structure

```
amazon-connect-ccp/
├── apps/
│   ├── ccp-admin/          # Configuration dashboard
│   ├── ccp-client/         # Main CCP application
│   └── ccp-docs/           # Developer documentation site
├── libs/
│   ├── core/               # Core business logic
│   ├── ui-components/      # Shared UI components
│   ├── config/             # Configuration management
│   ├── logging/            # Centralized logging
│   ├── testing/            # Testing utilities
│   └── types/              # TypeScript definitions
├── infrastructure/
│   ├── aws-cdk/            # Infrastructure as Code
│   ├── terraform/          # Multi-cloud infrastructure
│   └── docker/             # Container configurations
├── tools/
│   ├── build/              # Custom build tools
│   ├── scripts/            # Development scripts
│   └── generators/         # Code generators
└── docs/                   # Architecture documentation
```

## Development Commands

**Package Management:**
```bash
pnpm install                 # Install dependencies
pnpm install --frozen-lockfile  # Install with exact versions (CI)
```

**Development:**
```bash
pnpm nx run @agent-desktop/ccp-client:dev     # Start CCP client development server
pnpm nx run @agent-desktop/ccp-admin:dev      # Start admin dashboard development server
pnpm nx build ccp-client     # Build CCP client application
pnpm nx build ccp-admin      # Build admin dashboard
```

**Code Quality:**
```bash
pnpm nx run-many --target=lint --all --parallel=3        # Run ESLint on all projects
pnpm nx run-many --target=type-check --all --parallel=3  # TypeScript type checking
pnpm nx format:check         # Check code formatting (Prettier)
pnpm nx format:write         # Fix code formatting
```

**Testing:**
```bash
pnpm nx test ccp-client      # Run unit tests for CCP client
pnpm nx test:coverage ccp-client  # Run tests with coverage
pnpm nx run-many --target=test --all --parallel=3  # Run all unit tests
pnpm nx run-many --target=test:integration --all   # Run integration tests
pnpm nx e2e ccp-client-e2e   # Run end-to-end tests
```

**Infrastructure:**
```bash
pnpm nx deploy:staging ccp-client   # Deploy to staging environment
pnpm nx deploy:prod ccp-client      # Deploy to production environment
pnpm nx smoke:test ccp-client       # Run smoke tests
```

## Core Architecture Concepts

### Modular System
The application uses a sophisticated module system where each feature (customer info, cases, knowledge base, tasks, etc.) is implemented as a separate module that can be enabled/disabled per customer configuration.

**Key Interfaces:**
- `CCPModule`: All modules must implement this interface
- `ModuleMetadata`: Defines module dependencies and configuration
- `ModuleRegistry`: Handles module loading and dependency resolution

### Configuration Management
Customer-specific configurations are stored in DynamoDB and loaded at runtime to determine which modules to enable and how to configure them.

**Configuration Schema:**
```typescript
interface CustomerConfig {
  customer_id: string;
  branding: BrandingConfig;
  modules: ModuleConfig[];
  features: FeatureFlags;
  integrations: IntegrationConfig[];
  deployment: DeploymentConfig;
}
```

### Logging System
Enterprise-grade structured logging with multiple transports:
- Console transport for development
- CloudWatch transport for AWS environments
- Support for correlation IDs, session tracking, and performance metrics

### VDI Optimization
Special focus on Virtual Desktop Infrastructure (VDI) environments:
- Audio path optimization for Citrix, VMware Horizon, AWS WorkSpaces
- Performance monitoring and automatic failover
- Browser compatibility testing across VDI platforms

## Code Standards

**TypeScript Requirements:**
- Strict TypeScript configuration with no `any` types
- Explicit function return types required
- JSDoc comments required for all public APIs
- Maximum function complexity of 10
- Maximum lines per function of 50

**Security:**
- Security-focused ESLint rules enabled
- No object injection vulnerabilities
- No unsafe regex patterns
- All API endpoints require authentication

**Testing Requirements:**
- Minimum 80% code coverage for new code
- Unit tests for all business logic
- Integration tests for module interactions
- E2E tests for critical user flows
- Performance testing in VDI environments

-## Important Notes

- This project is actively under development with initial module implementations already in progress
- The repository contains both planning documents and working code examples
- Focus on enterprise-grade reliability, scalability, and maintainability
- VDI audio optimization is a key differentiator
- Multi-tenant deployment architecture supports customer-specific configurations
- Module system allows for flexible feature enablement per customer

## Development Workflow

1. All changes must pass the comprehensive CI/CD pipeline
2. Code must pass security audits and SonarCloud analysis
3. Performance tests are required for VDI environments
4. Deployment happens automatically to staging on `develop` branch
5. Production deployment requires manual approval and happens from `main` branch

## Security Considerations

- Content Security Policy (CSP) configuration
- Cross-Origin Resource Sharing (CORS) setup
- AWS IAM roles and permissions
- Data encryption at rest and in transit
- Audit logging for compliance (SOC 2, HIPAA)