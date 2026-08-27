const MockProvider = require('./providers/mockProvider');

function createProvider(type) {
  if (type === 'mock') return new MockProvider();
  // Add more provider implementations here (finnhub, broker websocket, idx feed)
  throw new Error(`Unknown provider type: ${type}`);
}

module.exports = { createProvider };
