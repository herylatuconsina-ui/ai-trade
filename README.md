Updated: Add Yahoo provider instructions and examples.

Notes:
- Provider 'yahoo' uses yahoo-finance2 to fetch recent intraday and historical candles.
- This is for prototyping only (public data, may be delayed). Do not use for production execution.

Usage:
- set PROVIDER_TYPE=yahoo in .env and restart the server.
- add ticker with POST /watch {"symbol":"BBCA.JK"}
