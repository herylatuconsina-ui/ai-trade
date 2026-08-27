import React, { useState } from 'react';
import TVChart from './components/TVChart';
import './App.css';

const DEFAULT_SYMBOL = 'KOTAJK';

function App(){
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [wsMessages, setWsMessages] = useState([]);

  return (
    <div className="app">
      <header>
        <h2>AI Trade - TradingView Frontend (Prototype)</h2>
        <div>
          <label>Symbol: </label>
          <input value={symbol} onChange={e => setSymbol(e.target.value)} />
        </div>
      </header>
      <main>
        <div className="chart">
          <TVChart symbol={symbol} onSignal={msg => setWsMessages(m => [msg, ...m].slice(0,50))} />
        </div>
        <aside>
          <h3>Signals</h3>
          <ul>
            {wsMessages.map((m, i) => (
              <li key={i}><b>{m.symbol}</b> - {m.result && m.result.reason} - {new Date().toLocaleString()}</li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

export default App;
