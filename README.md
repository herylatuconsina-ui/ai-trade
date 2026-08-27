# AI Trade — Node real-time starter

Ini starter project untuk implementasi real-time trading rules yang Anda minta (IDX, multi-timeframe rules).

Ringkasan teknis:
- Node.js + Express untuk server kontrol
- WebSocket (ws) untuk broadcast sinyal ke frontend/clients
- Modul signal di src/signals.js yang menerjemahkan aturan Anda (turnover, 1H FVG + uptrend, 15m inverted FVG, 5m engulfing/hammer + RSI < 30)
- Pluggable data provider (src/providers) — contoh mock provider disertakan. Ganti dengan provider real-time (broker/IDX feed) untuk produksi.

Langkah menjalankan (development / prototype):
1. Salin .env.example ke .env dan sesuaikan PROVIDER_TYPE serta API keys bila perlu.
2. npm install
3. npm start

Catatan produksi:
- Untuk real-time trading pada IDX: pastikan Anda memiliki data feed resmi (IDX/broker) dan lisensi data.
- Integrasi TradingView: frontend akan subscribe WebSocket untuk menampilkan sinyal dan dapat overlay pada TradingView chart.

Selanjutnya saya akan:
- Menyiapkan endpoint WebSocket untuk client menerima sinyal real-time
- Buat modul provider template untuk integrasi WebSocket feed broker
- Jika Anda setuju, saya bisa membuka branch baru untuk fitur tambahan: integrasi broker, authentication, dan contoh frontend.

