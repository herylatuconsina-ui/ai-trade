// Yahoo provider (uses yahoo-finance2)
// Converts Yahoo chart API result into array of { time, open, high, low, close, volume }
const yahoo = require('yahoo-finance2').default;

const TF_MAP = {
  '1h': '60m',
  '15m': '15m',
  '5m': '5m'
};

async function getRecentCandles(symbol, timeframe = '1h', limit = 200) {
  const interval = TF_MAP[timeframe];
  if (!interval) throw new Error('unsupported timeframe: ' + timeframe);

  // choose a reasonable period window based on timeframe and limit
  // Rough heuristic: for 5m candles, limit 200 -> ~1000 minutes -> 1 day; use '7d' safe upper bound
  let period = '7d';
  if (timeframe === '5m') period = '7d';
  if (timeframe === '15m') period = '30d';
  if (timeframe === '1h') period = '90d';

  const opts = { period, interval };
  // yahoo.chart returns timestamps in seconds
  const res = await yahoo.chart(symbol, opts);
  if (!res || !res.indicators || !res.indicators.quote) return [];

  const quote = res.indicators.quote[0];
  const timestamps = res.timestamp || [];
  const out = [];
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    const o = quote.open && quote.open[i];
    const h = quote.high && quote.high[i];
    const l = quote.low && quote.low[i];
    const c = quote.close && quote.close[i];
    const v = quote.volume && quote.volume[i];
    if ([o, h, l, c].some(x => x === null || x === undefined)) continue;
    out.push({
      time: t * 1000, // ms epoch
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v || 0
    });
  }
  // return last `limit` candles
  return out.slice(-limit);
}

module.exports = class YahooProvider {
  constructor() {}
  async getRecentCandles(symbol, timeframe = '1h', limit = 200) {
    // symbol example: 'BBCA.JK' or 'TLKM.JK'
    return getRecentCandles(symbol, timeframe, limit);
  }
};
