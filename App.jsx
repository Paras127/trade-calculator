// App.jsx - React Frontend
import React, { useState, useEffect } from 'react';

export default function App() {
  const [pair, setPair] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [direction, setDirection] = useState('long');
  const [mtfPhase, setMtfPhase] = useState('');
  const [entryModel, setEntryModel] = useState('');
  const [session, setSession] = useState('');
  const [margin, setMargin] = useState(0);
  const [profit, setProfit] = useState(0);
  const [loss, setLoss] = useState(0);
  const [tradeResults, setTradeResults] = useState({ win: 0, lose: 0 });
  const [trades, setTrades] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Replace with your actual Google Sheet Web App URL
  const SHEET_ID = 'AKfycbwoKMFphu0hkDl7icUqBRYlkc09oN3mz27zpEHYHHu6yp8JFRi-Y_ogE2lerSycRNIazA'; 
  const WEBHOOK_URL = `https://script.google.com/macros/s/ ${SHEET_ID}/exec`;

  const calculate = () => {
    const entry = parseFloat(entryPrice);
    const tpVal = parseFloat(tp);
    const slVal = parseFloat(sl);
    const size = parseFloat(accountSize);
    const lev = parseFloat(leverage);
    const dir = direction;

    if (isNaN(entry) || isNaN(tpVal) || isNaN(slVal) || isNaN(size) || isNaN(lev)) return;

    const marginVal = size / lev;
    let profitVal = dir === 'long' 
      ? (tpVal - entry) * lev * marginVal / entry 
      : (entry - tpVal) * lev * marginVal / entry;

    let lossVal = dir === 'long' 
      ? (entry - slVal) * lev * marginVal / entry 
      : (slVal - entry) * lev * marginVal / entry;

    setMargin(marginVal.toFixed(2));
    setProfit(profitVal.toFixed(2));
    setLoss(lossVal.toFixed(2));
  };

  const recordResult = (type) => {
    setTradeResults(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  const saveTradeToSheet = async () => {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair, accountSize, entryPrice, tp, sl, leverage, 
          direction, mtfPhase, entryModel, session, 
          win: tradeResults.win, lose: tradeResults.lose
        })
      });

      if (response.ok) {
        setShowSaveMsg(true);
        setTimeout(() => setShowSaveMsg(false), 3000);
        fetchTradesFromSheet();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTradesFromSheet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/ ${SHEET_ID}/gviz/tq?tqx=out:csv`);
      const csvData = await response.text();
      setTrades(parseCSV(csvData));
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim() || '';
        return obj;
      }, {});
    });
  };

  const editTrade = (index) => {
    const trade = trades[index];
    setPair(trade.Pair || '');
    setAccountSize(trade['Account Size'] || '');
    setEntryPrice(trade['Entry Price'] || '');
    setTp(trade.TP || '');
    setSl(trade.SL || '');
    setLeverage(trade.Leverage || '1');
    setDirection(trade.Direction || 'long');
    setMtfPhase(trade['MTF Phase'] || '');
    setEntryModel(trade['Entry Model'] || '');
    setSession(trade.Session || '');
    setTradeResults({
      win: parseInt(trade.Win) || 0,
      lose: parseInt(trade.Lose) || 0
    });
    setEditingIndex(index);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-cyan-400 text-center mb-6">Trading Calculator</h1>
        
        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Pair (e.g., BTC/USDT)", value: pair, onChange: setPair },
            { label: "Account Size (USDT)", value: accountSize, onChange: setAccountSize, type: "number" },
            { label: "Entry Price", value: entryPrice, onChange: setEntryPrice, type: "number" },
            { label: "Take Profit (TP)", value: tp, onChange: setTp, type: "number" },
            { label: "Stop Loss (SL)", value: sl, onChange: setSl, type: "number" },
            { label: "Leverage", value: leverage, onChange: setLeverage, type: "number" }
          ].map((field, i) => (
            <div key={i}>
              <label className="block mb-2">{field.label}</label>
              <input
                type={field.type || "text"}
                step={field.type === "number" ? "0.0001" : undefined}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          ))}
          
          <div>
            <label className="block mb-2">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">MTF Phase</label>
            <select
              value={mtfPhase}
              onChange={(e) => setMtfPhase(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="A -> PRO SWING + PRO INTERNAL">A - PRO SWING + PRO INTERNAL</option>
              <option value="B -> PRO SWING + COUNTER INTERNAL">B - PRO SWING + COUNTER INTERNAL</option>
              <option value="C -> COUNTER SWING + PRO INTERNAL">C - COUNTER SWING + PRO INTERNAL</option>
              <option value="D -> COUNTER SWING + COUNTER INTERNAL">D - COUNTER SWING + COUNTER INTERNAL</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Entry Model</label>
            <select
              value={entryModel}
              onChange={(e) => setEntryModel(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="LC-1">LC-1</option>
              <option value="LC-2A">LC-2A</option>
              <option value="LC-2B">LC-2B</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="Asia">Asia</option>
              <option value="London">London</option>
              <option value="New York">New York</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button 
            onClick={calculate}
            className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold py-2 px-4 rounded transition duration-200"
          >
            Calculate
          </button>
          <button 
            onClick={() => recordResult('win')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Win
          </button>
          <button 
            onClick={() => recordResult('lose')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Lose
          </button>
          <button 
            onClick={saveTradeToSheet}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Save Trade
          </button>
          <button 
            onClick={() => {
              fetchTradesFromSheet();
              setShowTrades(true);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            {isLoading ? 'Loading...' : 'Show Trades'}
          </button>
        </div>

        {/* Results Display */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-700 rounded">
              <span className="text-green-400 font-bold">TP Profit: </span>
              <span className="text-green-400">{profit} USDT</span>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <span className="text-red-400 font-bold">SL Loss: </span>
              <span className="text-red-400">{loss} USDT</span>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <span className="font-bold">Used Margin: </span>
              <span>{margin} USDT</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSaveMsg && (
          <div className="mb-4 p-3 bg-green-700 text-green-100 font-bold rounded">
            Trade saved successfully!
          </div>
        )}

        {/* Trades Table */}
        {showTrades && (
          <div className="mt-8 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">All Trades</h2>
            {isLoading ? (
              <div className="text-center py-4">Loading trades...</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-sm">
                    <th className="border border-gray-600 px-4 py-2">Pair</th>
                    <th className="border border-gray-600 px-4 py-2">Account</th>
                    <th className="border border-gray-600 px-4 py-2">Entry</th>
                    <th className="border border-gray-600 px-4 py-2">TP</th>
                    <th className="border border-gray-600 px-4 py-2">SL</th>
                    <th className="border border-gray-600 px-4 py-2">Leverage</th>
                    <th className="border border-gray-600 px-4 py-2">Dir</th>
                    <th className="border border-gray-600 px-4 py-2">MTF</th>
                    <th className="border border-gray-600 px-4 py-2">Model</th>
                    <th className="border border-gray-600 px-4 py-2">Session</th>
                    <th className="border border-gray-600 px-4 py-2">Win</th>
                    <th className="border border-gray-600 px-4 py-2">Lose</th>
                    <th className="border border-gray-600 px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => (
                    <tr key={index} className="bg-gray-800 hover:bg-gray-700 text-sm">
                      <td className="border border-gray-700 px-4 py-2">{trade.Pair}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade['Account Size']}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade['Entry Price']}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.TP}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.SL}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.Leverage}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.Direction}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade['MTF Phase']}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade['Entry Model']}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.Session}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.Win}</td>
                      <td className="border border-gray-700 px-4 py-2">{trade.Lose}</td>
                      <td className="border border-gray-700 px-4 py-2">
                        <button 
                          onClick={() => editTrade(index)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}