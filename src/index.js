require('dotenv').config();

const express = require('express');
const WebSocket = require('ws');
const schedule = require('node-schedule');
const { createProvider } = require('./dataProvider');
const signals = require('./signals');
const config = require('./config');

const app = express();
app.use(express.json());

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('client connected');
  ws.send(JSON.stringify({ type: 'hello', version: '0.1.0' }));
});

// default watchlist provided by user
let watchlist = [
  'KOTAJK','TPIAJK','BRMSJK','BULLJK','DSSAJK','PSABJK','MBMAJK'
];

app.post('/watch', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).send({ error: 'symbol required' });
  if (!watchlist.includes(symbol)) watchlist.push(symbol);
  res.send({ ok: true, watchlist });
});

app.get('/health', (req, res) => res.send({ ok: true }));

// API endpoint for frontend to fetch candles in lightweight format
app.get('/api/candles', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const tf = req.query.tf || '5m';
    if (!symbol) return res.status(400).send({ error: 'symbol required' });
    const provider = createProvider(config.PROVIDER_TYPE);
    const candles = await provider.getRecentCandles(symbol, tf, 500);
    // map to lightweight-charts / tradingview format: time in YYYY-MM-DD or unix seconds
    // we'll return time in ISO 8601 (ms -> ISO)
    const out = candles.map(c => ({ time: new Date(c.time).toISOString(), open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));
    res.send(out);
  } catch (err) {
    console.error('GET /api/candles error', err && err.message);
    res.status(500).send({ error: err.message });
  }
});

async function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

async function evaluateSymbol(provider, symbol) {
  try {
    const [c1h, c15m, c5m] = await Promise.all([
      provider.getRecentCandles(symbol, '1h', 200),
      provider.getRecentCandles(symbol, '15m', 200),
      provider.getRecentCandles(symbol, '5m', 200)
    ]);
    const result = await signals.checkEntry(c1h, c15m, c5m, config);
    if (result.ok) {
      const msg = { type: 'signal', symbol, result };
      console.log('SIGNAL:', symbol, result);
      await broadcast(msg);
    }
  } catch (err) {
    console.error('evaluateSymbol error', symbol, err.message || err);
  }
}

async function startLoop() {
  const provider = createProvider(config.PROVIDER_TYPE);
  // schedule fetch every FETCH_INTERVAL_SECONDS
  schedule.scheduleJob(`*/${Math.max(1, Math.floor(config.FETCH_INTERVAL_SECONDS / 1))} * * * * *`, async () => {
    for (const sym of watchlist) {
      await evaluateSymbol(provider, sym);
    }
  });
}

startLoop().catch(err => console.error(err));

const port = config.PORT || 3000;
server.listen(port, () => console.log(`server listening on ${port}`));
