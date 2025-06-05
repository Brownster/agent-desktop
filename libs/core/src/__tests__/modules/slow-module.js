// Use a Promise-based delay instead of a blocking while loop
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = class SlowModule {
  constructor() {
    // This will make the constructor async, but we can't do that in a constructor
    // So we'll use a flag to indicate the module is still initializing
    this._initializing = true;
    
    // Initialize metadata
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
    
    // Start the async initialization
    this._initPromise = this.initialize();
  }

  async initialize() {
    await delay(100); // Simulate slow initialization
    this._initializing = false;
    return this;
  }
  
  // Add a method to wait for initialization to complete
  async waitForInitialization() {
    if (!this._initializing) return this;
    return this._initPromise;
  }

  async getHealth() { return { status: 'healthy', timestamp: new Date() }; }
  async getMetrics() { return {}; }
  validateConfig() { return { success: true, data: undefined }; }
};
