const start = Date.now();
while (Date.now() - start < 100) {}
module.exports = class SlowModule {
  constructor() {
    this.metadata = {
      id: 'slow-module',
      name: 'Slow Module',
      version: '1.0.0',
      description: 'Slow loading module',
      author: 'Tester',
      dependencies: [],
      permissions: [],
      loadStrategy: 'eager',
      position: 'main',
      priority: 1,
      tags: []
    };
  }

  async getHealth() { return { status: 'healthy', timestamp: new Date() }; }
  async getMetrics() { return {}; }
  validateConfig() { return { success: true, data: undefined }; }
};
