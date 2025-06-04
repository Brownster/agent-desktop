/**
 * @fileoverview Tests for Branding page component
 * @module pages/__tests__/Branding
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Branding, { type BrandingConfig } from '../Branding';

// Mock file reader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/png;base64,mockImageData',
  onload: null as any,
};

global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Branding Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Branding />);
    expect(screen.getByText('Branding Management')).toBeInTheDocument();
  });

  it('displays all navigation tabs', () => {
    render(<Branding />);
    
    expect(screen.getByText('Color Theme')).toBeInTheDocument();
    expect(screen.getByText('Logo & Assets')).toBeInTheDocument();
    expect(screen.getByText('Custom CSS')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('defaults to theme tab', () => {
    render(<Branding />);
    
    expect(screen.getByText('Color Theme Configuration')).toBeInTheDocument();
    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
  });

  it('can switch between tabs', async () => {
    const user = userEvent.setup();
    render(<Branding />);
    
    // Switch to logo tab
    await user.click(screen.getByText('Logo & Assets'));
    expect(screen.getByText('Logo & Brand Assets')).toBeInTheDocument();
    
    // Switch to CSS tab
    await user.click(screen.getByText('Custom CSS'));
    expect(screen.getByText('Custom CSS Styling')).toBeInTheDocument();
    
    // Switch to advanced tab
    await user.click(screen.getByText('Advanced'));
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
  });

  describe('Color Theme Tab', () => {
    it('displays color pickers for all theme colors', () => {
      render(<Branding />);
      
      expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Accent Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Text Color')).toBeInTheDocument();
    });

    it('displays theme presets', () => {
      render(<Branding />);
      
      expect(screen.getByText('Amazon Connect')).toBeInTheDocument();
      expect(screen.getByText('Professional Blue')).toBeInTheDocument();
      expect(screen.getByText('Corporate Green')).toBeInTheDocument();
      expect(screen.getByText('Modern Purple')).toBeInTheDocument();
      expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    });

    it('can apply theme presets', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      // Click on Professional Blue preset
      await user.click(screen.getByText('Professional Blue'));
      
      // Check if primary color input was updated
      const primaryColorInput = screen.getByDisplayValue('#2563EB');
      expect(primaryColorInput).toBeInTheDocument();
    });

    it('can change colors using color picker', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      const colorInput = screen.getAllByDisplayValue('#FF9900')[0]; // Primary color
      await user.clear(colorInput);
      await user.type(colorInput, '#FF0000');
      
      expect(colorInput).toHaveValue('#FF0000');
    });

    it('can change theme mode', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      const modeSelect = screen.getByDisplayValue('Light');
      await user.selectOptions(modeSelect, 'dark');
      
      expect(modeSelect).toHaveValue('dark');
    });
  });

  describe('Logo Tab', () => {
    beforeEach(() => {
      mockFileReader.onload = null;
    });

    it('displays logo upload area', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Logo & Assets'));
      
      expect(screen.getByText('Company Logo')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your logo here, or')).toBeInTheDocument();
    });

    it('can upload logo file', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Logo & Assets'));
      
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const fileInput = screen.getByRole('button', { name: /click to browse/i }).nextElementSibling as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }
      
      await waitFor(() => {
        expect(screen.getByAltText('logo')).toBeInTheDocument();
      });
    });

    it('can handle drag and drop upload', async () => {
      render(<Branding />);
      
      await userEvent.click(screen.getByText('Logo & Assets'));
      
      const dropArea = screen.getByText('Drag and drop your logo here, or').closest('div')!;
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      
      fireEvent.dragOver(dropArea);
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: [file],
        },
      });
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('can remove uploaded logo', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Logo & Assets'));
      
      // First upload a logo
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const fileInput = screen.getByRole('button', { name: /click to browse/i }).nextElementSibling as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });
      
      // Remove the logo
      await user.click(screen.getByText('Remove'));
      
      expect(screen.getByText('Drag and drop your logo here, or')).toBeInTheDocument();
    });
  });

  describe('CSS Tab', () => {
    it('displays CSS editor', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Custom CSS'));
      
      expect(screen.getByText('Custom CSS Styling')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Custom CSS for your application/)).toBeInTheDocument();
    });

    it('can enter custom CSS', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Custom CSS'));
      
      const cssTextarea = screen.getByPlaceholderText(/Custom CSS for your application/);
      await user.type(cssTextarea, '.custom { color: red; }');
      
      expect(cssTextarea).toHaveValue('.custom { color: red; }');
    });

    it('can toggle CSS preview', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Custom CSS'));
      
      const showPreviewButton = screen.getByText('Show Preview');
      await user.click(showPreviewButton);
      
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByText('Hide Preview')).toBeInTheDocument();
    });
  });

  describe('Advanced Tab', () => {
    it('displays advanced settings', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Advanced'));
      
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Application Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Favicon URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable custom branding')).toBeInTheDocument();
    });

    it('can change application name', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Advanced'));
      
      const appNameInput = screen.getByLabelText('Application Name');
      await user.clear(appNameInput);
      await user.type(appNameInput, 'My Custom App');
      
      expect(appNameInput).toHaveValue('My Custom App');
    });

    it('can toggle branding enabled state', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      await user.click(screen.getByText('Advanced'));
      
      const enabledCheckbox = screen.getByLabelText('Enable custom branding');
      expect(enabledCheckbox).toBeChecked();
      
      await user.click(enabledCheckbox);
      expect(enabledCheckbox).not.toBeChecked();
    });
  });

  describe('Live Preview', () => {
    it('displays live preview', () => {
      render(<Branding />);
      
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    it('shows branding disabled warning when branding is disabled', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      // Disable branding
      await user.click(screen.getByText('Advanced'));
      const enabledCheckbox = screen.getByLabelText('Enable custom branding');
      await user.click(enabledCheckbox);
      
      expect(screen.getByText('Branding Disabled')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('can save changes', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/Saved \d+:\d+:\d+/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('can export configuration', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      // Mock link creation
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      
      const exportButton = screen.getByText('Export');
      await user.click(exportButton);
      
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/branding-config-\\d+\\.json/);
    });

    it('can import configuration', async () => {
      const user = userEvent.setup();
      render(<Branding />);
      
      const configData = {
        customerId: 'test',
        theme: {
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
          accentColor: '#0000FF',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          mode: 'light' as const,
        },
        logo: {
          url: 'test-logo.png',
          alt: 'Test Logo',
        },
        applicationName: 'Test App',
        brandingActive: true,
      };
      
      const file = new File([JSON.stringify(configData)], 'config.json', {
        type: 'application/json',
      });
      
      const importInput = screen.getByText('Import').closest('label')!.querySelector('input')!;
      
      // Mock FileReader for import
      const importReader = {
        readAsText: jest.fn(),
        result: JSON.stringify(configData),
        onload: null as any,
      };
      global.FileReader = jest.fn(() => importReader) as any;
      
      await user.upload(importInput, file);
      
      // Simulate FileReader onload
      if (importReader.onload) {
        importReader.onload({ target: importReader } as any);
      }
      
      // Check if primary color was updated
      await waitFor(() => {
        const primaryColorInput = screen.getByDisplayValue('#FF0000');
        expect(primaryColorInput).toBeInTheDocument();
      });\n    });\n  });\n});