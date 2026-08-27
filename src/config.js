// Simple configuration
module.exports = {
  FETCH_INTERVAL_SECONDS: parseInt(process.env.FETCH_INTERVAL_SECONDS || '30', 10),
  PROVIDER_TYPE: process.env.PROVIDER_TYPE || 'mock',
  PROVIDER_API_KEY: process.env.PROVIDER_API_KEY || null,
  PORT: parseInt(process.env.PORT || '3000', 10),
  TURNOVER_THRESHOLD: 1000000000 // IDR 1_000_000_000
};
