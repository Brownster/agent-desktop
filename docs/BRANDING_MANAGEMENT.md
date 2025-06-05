# Branding Management System

## Overview

The Branding Management system provides comprehensive control over the visual appearance and branding of the Amazon Connect CCP application. Administrators can customize colors, upload logos, apply custom CSS, and configure advanced branding options with real-time preview capabilities.

## Features

### 🎨 Color Theme Management
- **Theme Presets**: Pre-configured color schemes for quick application
- **Custom Color Picker**: Precise color selection with hex code input
- **Live Preview**: Real-time visualization of color changes
- **Theme Mode Support**: Light, dark, and auto (system) theme modes

### 🖼️ Logo & Asset Management
- **Drag & Drop Upload**: Intuitive logo upload interface
- **Asset Optimization**: Automatic image resizing and optimization
- **Multiple Format Support**: PNG, JPG, SVG logo formats
- **CDN Integration**: Fast asset delivery via content delivery network
- **Logo Properties**: Configurable width, height, and alt text

### 💻 Custom CSS Styling
- **CSS Editor**: Full-featured CSS editor with syntax highlighting
- **Live Preview**: Real-time CSS preview with sample components
- **CSS Variables**: Support for CSS custom properties
- **Validation**: CSS syntax validation and error reporting

### ⚙️ Advanced Configuration
- **Application Branding**: Custom application names and favicons
- **Branding Toggle**: Enable/disable custom branding globally
- **Import/Export**: Configuration backup and restore functionality
- **Version History**: Track and restore previous configurations

## Architecture

### Core Components

#### 1. BrandingConfig Interface
```typescript
interface BrandingConfig {
  customerId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    mode: 'light' | 'dark' | 'auto';
  };
  logo: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  customCSS?: string;
  favicon?: string;
  applicationName: string;
  brandingActive: boolean;
}
```

#### 2. Component Architecture
- **ColorPicker**: Reusable color selection component
- **LogoUpload**: Drag-and-drop file upload with preview
- **ThemePreview**: Live preview of branding changes
- **CSSEditor**: Code editor with live preview capabilities

#### 3. Tab-based Interface
- **Color Theme**: Theme presets and color customization
- **Logo & Assets**: Logo upload and asset management
- **Custom CSS**: Advanced styling with CSS editor
- **Advanced**: Application settings and branding toggles

### State Management

#### Configuration State
```typescript
const [config, setConfig] = useState<BrandingConfig>(defaultBranding);
const [activeTab, setActiveTab] = useState<'theme' | 'logo' | 'css' | 'advanced'>('theme');
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);
```

#### Update Handlers
```typescript
const updateConfig = (updates: Partial<BrandingConfig>) => {
  setConfig(prev => ({ ...prev, ...updates }));
};

const updateTheme = (themeUpdates: Partial<BrandingConfig['theme']>) => {
  setConfig(prev => ({
    ...prev,
    theme: { ...prev.theme, ...themeUpdates }
  }));
};
```

## User Interface

### Color Theme Tab
- **Quick Presets**: 5 built-in themes for rapid deployment
- **Color Pickers**: Visual color selection with hex input
- **Theme Mode**: Light/dark/auto mode selection
- **Real-time Updates**: Instant preview of color changes

### Logo & Assets Tab
- **Upload Area**: Drag-and-drop with file browser fallback
- **Image Preview**: Live preview of uploaded logos
- **Logo Properties**: Width, height, and alt text configuration
- **Asset Management**: Upload, replace, and remove functionality

### Custom CSS Tab
- **Code Editor**: Syntax-highlighted CSS editor
- **Live Preview**: Real-time CSS preview pane
- **Sample Components**: Preview CSS effects on UI elements
- **Validation**: Inline syntax validation and error reporting

### Advanced Settings Tab
- **Application Name**: Custom application title
- **Favicon Configuration**: Custom browser icon
- **Branding Toggle**: Global enable/disable switch
- **Import/Export**: Configuration backup functionality

## API Integration

### Core API Endpoints

#### Configuration Management
```typescript
// Get current branding configuration
GET /api/branding/{customerId}

// Update branding configuration
PUT /api/branding/{customerId}

// Validate branding configuration
POST /api/branding/validate
```

#### Asset Management
```typescript
// Upload logo/asset
POST /api/branding/assets/upload

// Delete asset
DELETE /api/branding/assets/{publicId}
```

#### Theme Presets
```typescript
// Get available presets
GET /api/branding/presets

// Create custom preset
POST /api/branding/presets

// Update preset
PUT /api/branding/presets/{presetId}
```

### React Query Integration

#### Hooks Available
- `useBrandingConfig()`: Get configuration data
- `useUpdateBrandingConfig()`: Save configuration changes
- `useValidateBrandingConfig()`: Validate configuration
- `useThemePresets()`: Fetch available theme presets
- `useUploadAsset()`: Upload logo/asset files
- `useExportBrandingConfig()`: Export configuration
- `useImportBrandingConfig()`: Import configuration

#### Caching Strategy
```typescript
const brandingKeys = {
  all: ['branding'] as const,
  configs: () => [...brandingKeys.all, 'configs'] as const,
  config: (customerId: string) => [...brandingKeys.configs(), customerId] as const,
  presets: () => [...brandingKeys.all, 'presets'] as const,
};
```

## Implementation Details

### Theme Application
```typescript
const previewStyle = {
  '--primary-color': theme.primaryColor,
  '--secondary-color': theme.secondaryColor,
  '--accent-color': theme.accentColor,
  '--bg-color': theme.backgroundColor,
  '--text-color': theme.textColor,
} as React.CSSProperties;
```

### File Upload Handling
```typescript
const handleFileSelect = (file: File) => {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      onLogoChange({
        url: e.target?.result as string,
        alt: file.name.split('.')[0],
      });
    };
    reader.readAsDataURL(file);
  }
};
```

### Configuration Export/Import
```typescript
// Export
const exportConfig = () => {
  const dataStr = JSON.stringify(config, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `branding-config-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Import
const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setConfig(imported);
      } catch (error) {
        alert('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  }
};
```

## Usage Examples

### Applying a Theme Preset
1. Navigate to Branding Management → Color Theme
2. Click on desired preset (e.g., "Professional Blue")
3. Preview updates automatically in the Live Preview panel
4. Click "Save Changes" to apply

### Uploading a Logo
1. Navigate to Branding Management → Logo & Assets
2. Drag logo file onto upload area or click "click to browse"
3. Adjust width/height properties if needed
4. Preview appears in Live Preview panel
5. Click "Save Changes" to apply

### Adding Custom CSS
1. Navigate to Branding Management → Custom CSS
2. Enter CSS code in the editor
3. Click "Show Preview" to see live preview
4. CSS applies to sample components in preview
5. Click "Save Changes" to apply globally

### Export/Import Configuration
1. **Export**: Click "Export" button to download JSON file
2. **Import**: Click "Import" button and select JSON file
3. Configuration applies immediately upon successful import
4. Use for backup, migration, or sharing configurations

## Testing

### Unit Tests
- Component rendering and interaction
- Color picker functionality
- File upload handling
- Configuration import/export
- Theme preset application

### Integration Tests
- API communication for configuration save/load
- Asset upload and management
- Real-time preview updates
- Configuration validation

### E2E Tests
- Complete branding workflow
- Configuration persistence
- Cross-browser compatibility
- Performance testing with large assets

## Performance Considerations

### Asset Optimization
- **Image Compression**: Automatic optimization on upload
- **CDN Delivery**: Fast asset loading via CDN
- **Lazy Loading**: Progressive image loading
- **Caching**: Browser and CDN caching strategies

### CSS Performance
- **CSS Variables**: Efficient runtime theme switching
- **Minimization**: CSS compression and minimization
- **Critical CSS**: Inline critical styling for faster rendering

### Memory Management
- **Asset Cleanup**: Proper URL.revokeObjectURL() usage
- **Event Listeners**: Cleanup on component unmount
- **State Optimization**: Efficient state updates

## Security Considerations

### File Upload Security
- **File Type Validation**: Strict image format checking
- **File Size Limits**: Maximum upload size enforcement
- **Malware Scanning**: Server-side virus scanning
- **Content Validation**: Image header verification

### CSS Security
- **Sanitization**: CSS input sanitization
- **XSS Prevention**: Script injection prevention
- **Content Security Policy**: CSP compliance
- **Validation**: Schema-based CSS validation

## Accessibility

### WCAG Compliance
- **Color Contrast**: Automatic contrast ratio validation
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Proper focus handling

### Color Accessibility
- **Contrast Checking**: Real-time contrast validation
- **Color Blindness**: Color palette accessibility testing
- **High Contrast**: Support for high contrast modes

## Future Enhancements

### Planned Features
1. **Template Library**: Pre-built branding templates
2. **Brand Guidelines**: Automated brand compliance checking
3. **A/B Testing**: Compare different branding configurations
4. **Analytics**: Branding performance metrics
5. **Collaboration**: Multi-user branding workflows
6. **AI Assistance**: AI-powered color and design suggestions

### Technical Improvements
1. **Advanced Preview**: 3D preview and device simulation
2. **Real-time Collaboration**: Multi-user editing
3. **Version Control**: Git-like version management
4. **Asset Library**: Centralized asset management
5. **Design Tokens**: Token-based design system

## Troubleshooting

### Common Issues

#### Logo Not Displaying
- Check file format (PNG, JPG, SVG only)
- Verify file size (under 2MB)
- Ensure proper asset permissions
- Check CDN accessibility

#### Colors Not Applying
- Verify branding is enabled in Advanced settings
- Check CSS custom property support
- Validate color format (hex codes)
- Clear browser cache

#### CSS Not Working
- Validate CSS syntax
- Check for conflicting styles
- Ensure proper CSS variable usage
- Review browser console for errors

#### Import/Export Issues
- Verify JSON file format
- Check file permissions
- Validate configuration schema
- Ensure browser supports File API

### Debug Tools
- **Browser DevTools**: CSS debugging and inspection
- **Network Tab**: Asset loading verification
- **Console**: JavaScript error checking
- **Application Tab**: Local storage inspection

---

*This documentation covers the Branding Management system implementation in Phase 2 of the Amazon Connect CCP Admin Dashboard development.*