import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

export default function Chart({ symbol = 'KOTAJK', timeframe = '5m', onSignal }) {
  const containerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const dataRef = useRef([]);
  const markersRef = useRef([]);
  const wsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;
    chartRef.current = createChart(container, { width: container.clientWidth, height: 600 });
    seriesRef.current = chartRef.current.addCandlestickSeries();

    const handleResize = () => chartRef.current.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', handleResize);

    async function loadData() {
      try {
        const resp = await axios.get(`/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(timeframe)}`);
        // Expect ISO times from backend; map to lightweight format with unix seconds
        const out = resp.data.map(c => ({ time: Math.floor(new Date(c.time).getTime() / 1000), open: c.open, high: c.high, low: c.low, close: c.close }));
        dataRef.current = out;
        seriesRef.current.setData(out);
      } catch (err) {
        console.error('loadData error', err && err.message);
      }
    }

    loadData();

    // setup WS
    const wsUrl = process.env.REACT_APP_WS_URL || ((location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.hostname + ':3000');
    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => console.log('ws connected', wsUrl);
      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'signal' && msg.symbol === symbol) {
            // call parent
            onSignal && onSignal(msg);
            // place marker at latest candle
            const latest = dataRef.current && dataRef.current.length ? dataRef.current[dataRef.current.length - 1] : null;
            const t = latest ? latest.time : Math.floor(Date.now() / 1000);
            const marker = {
              time: t,
              position: 'belowBar',
              color: 'green',
              shape: 'arrowUp',
              text: 'BUY'
            };
            markersRef.current = [...markersRef.current, marker];
            seriesRef.current.setMarkers(markersRef.current);
          }
        } catch (err) { console.warn('ws parse err', err); }
      };
      wsRef.current.onclose = () => console.log('ws closed');
      wsRef.current.onerror = (e) => console.warn('ws error', e);
    } catch (err) {
      console.warn('could not connect ws', err && err.message);
    }

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) try { wsRef.current.close(); } catch(e) {}
      if (chartRef.current) chartRef.current.remove();
    };
  }, [symbol, timeframe, onSignal]);

  return <div ref={containerRef} style={{ width: '100%', height: 600 }} />;
}
