module.exports = class DependentVersionModule {
  constructor() {
    this.metadata = {
      id: 'dependent-version',
      name: 'Dependent Version Module',
      version: '1.0.0',
      description: 'Requires good-module >=2.0.0',
      author: 'Tester',
      dependencies: [
        { moduleId: 'good-module', version: '^2.0.0', optional: false },
      ],
      permissions: [],
      loadStrategy: 'eager',
      position: 'main',
      priority: 1,
      tags: []
    };
  }

  async getHealth() { return { status: 'healthy', timestamp: new Date() }; }
  async getMetrics() { return { ok: true }; }
  validateConfig() { return { success: true, data: undefined }; }
};
