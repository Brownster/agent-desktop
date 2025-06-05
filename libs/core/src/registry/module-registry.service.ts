import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import semver from 'semver';
import type { ModuleID, Logger } from '@agent-desktop/types';
import type { ModuleDependency } from '../base-module';

export interface ModulePackageMetadata {
  readonly id: ModuleID;
  readonly version: string;
  readonly checksum: string;
  readonly dependencies: readonly ModuleDependency[];
  readonly filePath: string;
  readonly signature?: string;
}

export class ModuleRegistryService {
  private registry: Record<string, ModulePackageMetadata[]> = {};

  constructor(
    private readonly registryFile: string,
    private readonly modulesRoot: string,
    private readonly logger: Logger,
  ) {
    if (fs.existsSync(this.registryFile)) {
      try {
        this.registry = JSON.parse(fs.readFileSync(this.registryFile, 'utf-8'));
      } catch (err) {
        this.logger.warn('Failed to read module registry, starting fresh', {
          error: (err as Error).message,
        });
      }
    }
  }

  getModuleMetadata(id: ModuleID, versionRange?: string): ModulePackageMetadata | undefined {
    const entries = this.registry[id];
    if (!entries) return undefined;
    const sorted = entries.slice().sort((a, b) => semver.rcompare(a.version, b.version));
    if (!versionRange) {
      return sorted[0];
    }
    return sorted.find(e => semver.satisfies(e.version, versionRange));
  }

  getModulePath(id: ModuleID, versionRange?: string): string | undefined {
    const meta = this.getModuleMetadata(id, versionRange);
    return meta ? path.join(this.modulesRoot, id, meta.version, 'index.js') : undefined;
  }

  async publishModule(moduleDir: string): Promise<ModulePackageMetadata> {
    const modulePath = path.resolve(moduleDir, 'index.js');
    let mod: any;
    // Use dynamic import when running under ESM
    if (typeof require === 'function') {
      mod = require(modulePath);
    } else {
      const { pathToFileURL } = await import('url');
      mod = await import(pathToFileURL(modulePath).href);
    }
    const ModuleClass = mod.default || mod.Module || mod;
    const instance = new ModuleClass();
    const metadata = instance.metadata as {
      id: ModuleID;
      version: string;
      dependencies?: ModuleDependency[];
    };
    const buffer = fs.readFileSync(modulePath);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const destDir = path.join(this.modulesRoot, metadata.id, metadata.version);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(modulePath, path.join(destDir, 'index.js'));

    const record: ModulePackageMetadata = {
      id: metadata.id,
      version: metadata.version,
      checksum,
      dependencies: metadata.dependencies || [],
      filePath: path.join(destDir, 'index.js'),
    };
    if (!this.registry[metadata.id]) {
      this.registry[metadata.id] = [];
    }
    const existing = this.registry[metadata.id].find(e => e.version === record.version);
    if (!existing) {
      this.registry[metadata.id].push(record);
      this.save();
    }
    this.logger.info('Module published', { id: record.id, version: record.version });
    return record;
  }

  removeModule(id: ModuleID, version: string): void {
    if (!this.registry[id]) return;
    this.registry[id] = this.registry[id].filter(e => e.version !== version);
    if (this.registry[id].length === 0) delete this.registry[id];
    this.save();
  }

  private save(): void {
    fs.writeFileSync(this.registryFile, JSON.stringify(this.registry, null, 2));
  }
}
