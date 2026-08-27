import React, { useEffect, useRef } from 'react';

// TradingView widget wrapper — uses the embeddable widget (tv.js)
// Note: This uses TradingView's embeddable widget (free). For the full Charting Library features you need a license.

function mapTickerToTV(symbol){
  // convert BBCA.JK -> IDX:BBCA or KOTAJK -> IDX:KOTA (assumes .JK suffix or already raw)
  let s = symbol.toUpperCase().trim();
  if (s.endsWith('.JK')) s = s.replace('.JK','');
  // if user provided without suffix like KOTAJK, try to remove trailing JK
  if (s.endsWith('JK') && s.length>2) s = s.slice(0,-2);
  return `IDX:${s}`;
}

export default function TVChart({ symbol='KOTAJK', onSignal }){
  const containerRef = useRef();
  const widgetRef = useRef();

  useEffect(() => {
    const tvSymbol = mapTickerToTV(symbol);
    // remove existing widget if any
    if (widgetRef.current && widgetRef.current.remove) {
      try { widgetRef.current.remove(); } catch(e){}
      widgetRef.current = null;
    }

    // Create TradingView widget
    const widget = new window.TradingView.widget({
      width: containerRef.current.clientWidth || 800,
      height: 600,
      symbol: tvSymbol,
      interval: '5',
      timezone: 'Asia/Jakarta',
      theme: 'light',
      style: '1',
      locale: 'id',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: containerRef.current.id
    });

    widgetRef.current = widget;

    widget.onChartReady && widget.onChartReady(() => {
      console.log('TradingView chart ready for', tvSymbol);
    });

    // WebSocket listen for signals
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host);
    ws.onmessage = (e) => {
      try{
        const msg = JSON.parse(e.data);
        if (msg.type === 'signal'){
          // forward to parent
          onSignal && onSignal(msg);
          // try to add a simple alert on chart if possible
          try{
            if (widget && widget.createStudy) {
              // Charting Library features not always available in embeddable widget
            }
          }catch(err){console.warn('could not annotate TV chart', err.message)}
        }
      }catch(err){ console.warn('invalid ws msg', err); }
    };

    return () => {
      ws.close();
      // no direct remove API for embeddable widget; if available remove
      if (widgetRef.current && widgetRef.current.remove) try{ widgetRef.current.remove(); }catch(e){}
    };
  }, [symbol, onSignal]);

  return (
    <div style={{ width: '100%' }}>
      <div id={`tv_chart_${symbol}`} ref={containerRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
}
