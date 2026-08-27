const MockProvider = require('./providers/mockProvider');
let YahooProvider;
try {
  YahooProvider = require('./providers/yahooProvider');
} catch (e) {
  // yahooProvider may not be present in every branch
}

function createProvider(type) {
  if (type === 'mock') return new MockProvider();
  if (type === 'yahoo') {
    if (!YahooProvider) throw new Error('YahooProvider not available');
    return new YahooProvider();
  }
  // Add more provider implementations here (finnhub, broker websocket, idx feed)
  throw new Error(`Unknown provider type: ${type}`);
}

module.exports = { createProvider };
