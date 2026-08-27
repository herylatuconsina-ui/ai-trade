const ti = require('technicalindicators');

function rsi(values, period = 14) {
  if (values.length < period) return [];
  return ti.RSI.calculate({ period, values });
}

function ema(values, period) {
  if (values.length < period) return [];
  return ti.EMA.calculate({ period, values });
}

function latest(arr) {
  return arr[arr.length - 1];
}

function turnoverFilter(latestClose, latestVolume, threshold) {
  return latestClose * latestVolume > threshold;
}

function isUptrend(candles) {
  const closes = candles.map(c => c.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  if (!ema20.length || !ema50.length) return false;
  const lastClose = latest(closes);
  const lastEma20 = latest(ema20);
  const lastEma50 = latest(ema50);
  return lastClose > lastEma50 && lastEma20 > lastEma50;
}

function detectBullishFVG(candles) {
  // simple 3-candle gap heuristic: low of candle3 > high of candle1
  if (candles.length < 3) return null;
  const c1 = candles[candles.length - 3];
  const c3 = candles[candles.length - 1];
  if (c3.low > c1.high) {
    return { top: c3.low, bottom: c1.high };
  }
  return null;
}

function detectInvertedFVG(zone, candles15m) {
  if (!zone) return false;
  const lastN = candles15m.slice(-10);
  for (const c of lastN) {
    if (c.close <= zone.top && c.close >= zone.bottom) {
      // closed inside zone; require bearish candle as "inverted"
      if (c.close < c.open) return true;
    }
  }
  return false;
}

function isBullishEngulfing(prev, curr) {
  const prevBody = Math.abs(prev.close - prev.open);
  const currBody = Math.abs(curr.close - curr.open);
  return prev.close < prev.open && curr.close > curr.open && currBody > prevBody && curr.open <= prev.close && curr.close >= prev.open;
}

function isHammer(candle) {
  const body = Math.abs(candle.close - candle.open);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  if (body === 0) return false;
  return lowerWick >= 2 * body && upperWick <= 0.3 * body;
}

async function checkEntry(candles1h, candles15m, candles5m, config) {
  if (!isUptrend(candles1h)) return { ok: false, reason: 'no uptrend' };
  const fvg = detectBullishFVG(candles1h);
  if (!fvg) return { ok: false, reason: 'no 1H FVG' };
  if (!detectInvertedFVG(fvg, candles15m)) return { ok: false, reason: 'no inverted FVG on 15m' };
  if (candles5m.length < 2) return { ok: false, reason: 'insufficient 5m data' };
  const prev = candles5m[candles5m.length - 2];
  const curr = candles5m[candles5m.length - 1];
  if (!(isBullishEngulfing(prev, curr) || isHammer(curr))) return { ok: false, reason: 'no 5m pattern' };
  const closes5m = candles5m.map(c => c.close);
  const rsiValues = rsi(closes5m, 14);
  const lastRsi = rsiValues.length ? rsiValues[rsiValues.length - 1] : 100;
  if (lastRsi >= 30) return { ok: false, reason: `RSI ${lastRsi.toFixed(1)} >= 30` };
  // turnover check: use latest 1h candle for volume and close
  const latest1h = candles1h[candles1h.length - 1];
  if (!turnoverFilter(latest1h.close, latest1h.volume, config.TURNOVER_THRESHOLD)) return { ok: false, reason: 'turnover below threshold' };
  return { ok: true, reason: 'all conditions met', meta: { rsi: lastRsi } };
}

module.exports = { rsi, ema, isUptrend, detectBullishFVG, detectInvertedFVG, isBullishEngulfing, isHammer, checkEntry };
