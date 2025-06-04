# CCP Admin Dashboard

A comprehensive administrative dashboard for managing Amazon Connect CCP configurations, modules, and analytics with enterprise-grade features.

## Overview

The CCP Admin Dashboard provides a centralized interface for:

- **Customer Management**: CRUD operations for customer configurations
- **Module Catalog**: Browse, install, and manage CCP modules
- **Analytics Dashboard**: Real-time metrics and performance monitoring
- **System Administration**: Configuration management and audit trails

## Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript 5.2+
- **State Management**: Zustand + React Query
- **UI Framework**: Tailwind CSS + Headless UI
- **Real-time**: WebSocket connections
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Vite + SWC

### API Service Layer

The application features a comprehensive API service layer with:

- **Type-safe API clients** for all backend operations
- **React Query integration** for caching and state management
- **WebSocket services** for real-time updates
- **Error handling** with user-friendly notifications
- **Optimistic updates** for better UX

#### Core Services

```typescript
// Customer management
import { useCustomers, useCreateCustomer, useUpdateCustomer } from './services/queries';

// Module operations
import { useModuleCatalog, useEnableModule } from './services/queries';

// Analytics and monitoring
import { useAnalyticsDashboard, useSystemMetrics } from './services/queries';

// Real-time updates
import { useRealtimeCustomers, useWebSocketConnection } from './services/websocket';
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Access to the Configuration API endpoints

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Development Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Code formatting
pnpm format

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── Header.tsx      # Application header
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Customers.tsx   # Customer management
│   ├── CustomerDetail.tsx # Customer details
│   ├── Modules.tsx     # Module management
│   ├── Settings.tsx    # Application settings
│   └── NotFound.tsx    # 404 error page
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── lib/                # Third-party library configurations
└── App.tsx             # Root application component
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=https://api.example.com
VITE_WS_ENDPOINT=wss://ws.example.com

# Application Configuration
VITE_APP_NAME=CCP Admin Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
```

### API Integration

The dashboard integrates with the Configuration API for:

- Customer configuration CRUD operations
- Module management and installation
- System settings and preferences
- Real-time updates via WebSocket

## Pages Overview

### Dashboard
- System health overview
- Recent activity feed
- Quick action buttons
- Key metrics and statistics

### Customer Management
- List all customers with filtering and search
- Create new customer configurations
- Edit existing customer settings
- View detailed customer information
- Manage customer-specific modules

### Module Management
- Browse available modules by category
- View module details and documentation
- Install/uninstall modules
- Configure module settings
- Manage module dependencies

### Settings
- General application settings
- Security and authentication
- System configuration
- Notification preferences
- User management
- Audit and compliance settings

## Styling and Theming

### Tailwind CSS Configuration

The application uses a custom Tailwind configuration with:

- **Amazon Connect Brand Colors**: Primary blue color scheme
- **Extended Color Palette**: Success, error, warning variants
- **Custom Typography**: Inter font family with optimized line heights
- **Component Classes**: Pre-built button, input, card, and badge styles
- **Responsive Design**: Mobile-first responsive breakpoints

### Component Patterns

```tsx
// Button variants
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outline Button</button>

// Status badges
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Error</span>

// Cards
<div className="card">Basic card</div>
<div className="card-hover">Hoverable card</div>
<div className="card-interactive">Interactive card</div>
```

## Development Guidelines

### Code Standards

- **TypeScript**: Strict typing with explicit return types
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Organization**: External imports first, then internal imports

### Best Practices

1. **Performance**: Use React.memo for expensive components
2. **Accessibility**: Include ARIA labels and keyboard navigation
3. **Error Handling**: Implement error boundaries and loading states
4. **Testing**: Write unit tests for business logic and components
5. **Security**: Sanitize user inputs and validate API responses

## Deployment

### Production Build

```bash
# Create optimized production build
pnpm build

# Preview production build locally
pnpm preview
```

### Build Optimization

The production build includes:

- **Code Splitting**: Automatic chunking for vendor libraries
- **Tree Shaking**: Dead code elimination
- **Asset Optimization**: Image compression and minification
- **Source Maps**: For debugging production issues

### Environment-Specific Builds

```bash
# Development build
VITE_ENVIRONMENT=development pnpm build

# Staging build
VITE_ENVIRONMENT=staging pnpm build

# Production build
VITE_ENVIRONMENT=production pnpm build
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `pnpm install`
2. **Type Errors**: Run `pnpm type-check` to identify TypeScript issues
3. **Linting Errors**: Run `pnpm lint` to fix code style issues
4. **API Connection**: Verify API endpoints in environment variables

### Performance Optimization

- Use React DevTools Profiler to identify performance bottlenecks
- Implement virtualization for large lists
- Optimize images and assets
- Enable gzip compression on the server

## Contributing

1. Follow the established code style and patterns
2. Write tests for new features and bug fixes
3. Update documentation for significant changes
4. Ensure all checks pass before submitting pull requests

## License

This project is proprietary software developed for Amazon Connect CCP configuration management.