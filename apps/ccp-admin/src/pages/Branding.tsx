import React, { useState, useRef } from 'react';
import {
  SwatchIcon,
  PhotoIcon,
  CodeBracketIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

/**
 * Branding configuration interface
 */
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

/**
 * Color theme presets
 */
const themePresets = [
  {
    name: 'Amazon Connect',
    colors: {
      primaryColor: '#FF9900',
      secondaryColor: '#146EB4',
      accentColor: '#FF9900',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
    },
  },
  {
    name: 'Professional Blue',
    colors: {
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      accentColor: '#3B82F6',
      backgroundColor: '#F8FAFC',
      textColor: '#1E293B',
    },
  },
  {
    name: 'Corporate Green',
    colors: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10B981',
      backgroundColor: '#F0FDF4',
      textColor: '#14532D',
    },
  },
  {
    name: 'Modern Purple',
    colors: {
      primaryColor: '#7C3AED',
      secondaryColor: '#6D28D9',
      accentColor: '#8B5CF6',
      backgroundColor: '#FDFAFF',
      textColor: '#4C1D95',
    },
  },
  {
    name: 'Dark Theme',
    colors: {
      primaryColor: '#F59E0B',
      secondaryColor: '#D97706',
      accentColor: '#FBBF24',
      backgroundColor: '#111827',
      textColor: '#F9FAFB',
    },
  },
];

/**
 * Default branding configuration
 */
const defaultBranding: BrandingConfig = {
  customerId: 'default',
  theme: {
    primaryColor: '#FF9900',
    secondaryColor: '#146EB4',
    accentColor: '#FF9900',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    mode: 'light',
  },
  logo: {
    url: '',
    alt: 'Company Logo',
    width: 200,
    height: 60,
  },
  customCSS: '',
  favicon: '',
  applicationName: 'Contact Center',
  brandingActive: true,
};

/**
 * Color picker component
 */
function ColorPicker({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

/**
 * Logo upload component
 */
function LogoUpload({
  logo,
  onLogoChange,
}: {
  logo: BrandingConfig['logo'];
  onLogoChange: (logo: Partial<BrandingConfig['logo']>) => void;
}): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Company Logo
      </label>
      
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-connect-400 bg-connect-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {logo.url ? (
          <div className="space-y-3">
            <img
              src={logo.url}
              alt={logo.alt}
              className="mx-auto max-h-24 object-contain"
              style={{
                width: logo.width ? `${logo.width}px` : 'auto',
                height: logo.height ? `${logo.height}px` : 'auto',
              }}
            />
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                Replace
              </button>
              <button
                onClick={() => onLogoChange({ url: '', alt: 'Company Logo' })}
                className="btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop your logo here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-connect-600 hover:text-connect-500"
                >
                  click to browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, SVG up to 2MB. Recommended: 200x60px
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {/* Logo properties */}
      {logo.url && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={logo.alt}
              onChange={(e) => onLogoChange({ alt: e.target.value })}
              className="input"
              placeholder="Company Logo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              value={logo.width || ''}
              onChange={(e) => onLogoChange({ width: parseInt(e.target.value) || undefined })}
              className="input"
              placeholder="Auto"
              min="50"
              max="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              value={logo.height || ''}
              onChange={(e) => onLogoChange({ height: parseInt(e.target.value) || undefined })}
              className="input"
              placeholder="Auto"
              min="20"
              max="200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Theme preview component
 */
function ThemePreview({
  config,
}: {
  config: BrandingConfig;
}): React.ReactElement {
  const { theme, logo, applicationName } = config;

  const previewStyle = {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--accent-color': theme.accentColor,
    '--bg-color': theme.backgroundColor,
    '--text-color': theme.textColor,
  } as React.CSSProperties;

  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden"
      style={previewStyle}
    >
      {/* Preview header */}
      <div 
        className="px-4 py-3 border-b"
        style={{ 
          backgroundColor: 'var(--primary-color)', 
          color: theme.mode === 'dark' ? '#FFFFFF' : '#FFFFFF' 
        }}
      >
        <div className="flex items-center space-x-3">
          {logo.url && (
            <img
              src={logo.url}
              alt={logo.alt}
              className="h-8 object-contain"
              style={{
                maxWidth: logo.width ? `${Math.min(logo.width, 120)}px` : '120px',
              }}
            />
          )}
          <div>
            <h3 className="font-semibold text-sm">{applicationName}</h3>
            <p className="text-xs opacity-90">Contact Center Agent Desktop</p>
          </div>
        </div>
      </div>

      {/* Preview content */}
      <div 
        className="p-4 space-y-4"
        style={{ 
          backgroundColor: 'var(--bg-color)', 
          color: 'var(--text-color)' 
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Agent Dashboard</h4>
          <div 
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: 'var(--secondary-color)' }}
          >
            Available
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded border" style={{ borderColor: 'var(--secondary-color)' }}>
            <div className="text-lg font-semibold">24</div>
            <div className="text-xs opacity-75">Active Calls</div>
          </div>
          <div className="p-3 rounded border" style={{ borderColor: 'var(--secondary-color)' }}>
            <div className="text-lg font-semibold">156</div>
            <div className="text-xs opacity-75">Queue Length</div>
          </div>
          <div className="p-3 rounded border" style={{ borderColor: 'var(--secondary-color)' }}>
            <div className="text-lg font-semibold">98%</div>
            <div className="text-xs opacity-75">Service Level</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 rounded text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Accept Call
          </button>
          <button 
            className="px-3 py-1 rounded text-sm border"
            style={{ 
              borderColor: 'var(--secondary-color)', 
              color: 'var(--secondary-color)' 
            }}
          >
            Break
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CSS Editor component
 */
function CSSEditor({
  customCSS,
  onChange,
}: {
  customCSS: string;
  onChange: (css: string) => void;
}): React.ReactElement {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Custom CSS
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary text-sm"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CSS Editor */}
        <div className="space-y-2">
          <textarea
            value={customCSS}
            onChange={(e) => onChange(e.target.value)}
            className="input h-64 font-mono text-sm"
            placeholder={`/* Custom CSS for your application */
:root {
  --custom-border-radius: 8px;
  --custom-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.ccp-button {
  border-radius: var(--custom-border-radius);
  box-shadow: var(--custom-shadow);
}

/* Add your custom styles here */`}
          />
          <p className="text-xs text-gray-500">
            CSS will be injected into the application. Use CSS custom properties for best results.
          </p>
        </div>

        {/* CSS Preview */}
        {showPreview && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Live Preview</p>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <style dangerouslySetInnerHTML={{ __html: customCSS }} />
              <div className="space-y-3">
                <div className="ccp-button bg-blue-500 text-white p-2 rounded">
                  Sample Button
                </div>
                <div className="ccp-panel bg-gray-100 p-3 rounded">
                  <h4 className="font-medium">Sample Panel</h4>
                  <p className="text-sm text-gray-600 mt-1">This is how your custom styles will appear.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Branding Management page
 */
function Branding(): React.ReactElement {
  const [config, setConfig] = useState<BrandingConfig>(defaultBranding);
  const [activeTab, setActiveTab] = useState<'theme' | 'logo' | 'css' | 'advanced'>('theme');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Handle configuration updates
  const updateConfig = (updates: Partial<BrandingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateTheme = (themeUpdates: Partial<BrandingConfig['theme']>) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }));
  };

  const updateLogo = (logoUpdates: Partial<BrandingConfig['logo']>) => {
    setConfig(prev => ({
      ...prev,
      logo: { ...prev.logo, ...logoUpdates }
    }));
  };

  // Apply theme preset
  const applyPreset = (preset: typeof themePresets[0]) => {
    updateTheme(preset.colors);
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      // In real implementation, would call API to save configuration
      console.log('Saving branding configuration:', config);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Export configuration
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

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setConfig(imported);
        } catch (error) {
          console.error('Failed to import configuration:', error);
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'theme', name: 'Color Theme', icon: SwatchIcon },
    { id: 'logo', name: 'Logo & Assets', icon: PhotoIcon },
    { id: 'css', name: 'Custom CSS', icon: CodeBracketIcon },
    { id: 'advanced', name: 'Advanced', icon: Cog6ToothIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Branding Management</h2>
          <p className="mt-2 text-gray-600">
            Customize the appearance and branding of your Amazon Connect CCP application
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={exportConfig}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </button>
          <label className="btn-secondary cursor-pointer">
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
          </label>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Tab navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-connect-500 text-connect-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="card p-6">
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Color Theme Configuration
                  </h3>
                  
                  {/* Theme presets */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {themePresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-connect-300 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.colors.primaryColor }}
                            />
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.colors.secondaryColor }}
                            />
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.colors.accentColor }}
                            />
                          </div>
                          <div className="text-xs font-medium text-gray-700">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color customization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorPicker
                      label="Primary Color"
                      value={config.theme.primaryColor}
                      onChange={(color) => updateTheme({ primaryColor: color })}
                      description="Main brand color used for buttons and highlights"
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={config.theme.secondaryColor}
                      onChange={(color) => updateTheme({ secondaryColor: color })}
                      description="Secondary color for accents and borders"
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={config.theme.accentColor}
                      onChange={(color) => updateTheme({ accentColor: color })}
                      description="Accent color for notifications and alerts"
                    />
                    <ColorPicker
                      label="Background Color"
                      value={config.theme.backgroundColor}
                      onChange={(color) => updateTheme({ backgroundColor: color })}
                      description="Main background color"
                    />
                    <ColorPicker
                      label="Text Color"
                      value={config.theme.textColor}
                      onChange={(color) => updateTheme({ textColor: color })}
                      description="Primary text color"
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Theme Mode
                      </label>
                      <select
                        value={config.theme.mode}
                        onChange={(e) => updateTheme({ mode: e.target.value as any })}
                        className="input"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Theme mode preference for the application
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logo' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Logo & Brand Assets
                  </h3>
                  
                  <LogoUpload
                    logo={config.logo}
                    onLogoChange={updateLogo}
                  />
                </div>
              </div>
            )}

            {activeTab === 'css' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Custom CSS Styling
                  </h3>
                  
                  <CSSEditor
                    customCSS={config.customCSS || ''}
                    onChange={(css) => updateConfig({ customCSS: css })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Advanced Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Name
                      </label>
                      <input
                        type="text"
                        value={config.applicationName}
                        onChange={(e) => updateConfig({ applicationName: e.target.value })}
                        className="input"
                        placeholder="Contact Center"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Display name shown in the application header
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Favicon URL
                      </label>
                      <input
                        type="url"
                        value={config.favicon || ''}
                        onChange={(e) => updateConfig({ favicon: e.target.value })}
                        className="input"
                        placeholder="https://example.com/favicon.ico"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Custom favicon for browser tabs (16x16 or 32x32 pixels)
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="brandingActive"
                        checked={config.brandingActive}
                        onChange={(e) => updateConfig({ brandingActive: e.target.checked })}
                        className="h-4 w-4 text-connect-600 border-gray-300 rounded focus:ring-connect-500"
                      />
                      <label htmlFor="brandingActive" className="ml-2 block text-sm text-gray-700">
                        Enable custom branding
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      When disabled, the application will use default styling
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <div className="card p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Live Preview
              </h3>
              <ThemePreview config={config} />
              
              {!config.brandingActive && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Branding Disabled
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Custom branding is currently disabled. Enable it in Advanced settings to apply your changes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Branding;

export type { BrandingConfig };