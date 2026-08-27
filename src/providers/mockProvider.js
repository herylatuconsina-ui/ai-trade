// Mock provider: reads sample historical candles (embedded) and returns OHLCV arrays per symbol and timeframe

const sample = require('./sample_candles.json');

class MockProvider {
  constructor() {}

  // expected timeframe values: '1h', '15m', '5m'
  async getRecentCandles(symbol, timeframe, limit = 200) {
    const key = `${symbol}_${timeframe}`;
    if (!sample[key]) {
      // fallback to a single symbol data
      return sample['SAMPLE_1h'] || [];
    }
    return sample[key].slice(-limit);
  }
}

module.exports = MockProvider;
