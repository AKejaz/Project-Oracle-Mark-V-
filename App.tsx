import React, { useState, useEffect } from 'react';
import { CyberLayout } from './components/CyberLayout';
import { StockChart } from './components/StockChart';
import { SignalDisplay } from './components/SignalDisplay';
import { IntelTerminal } from './components/IntelTerminal';
import { StrategySim } from './components/StrategySim';
import { GlobalIntel } from './components/GlobalIntel';
import { SignalTerminal } from './components/SignalTerminal'; // Import new component
import { generateCalibratedData } from './services/marketData';
import { analyzeWithOracle, fetchTickerContext, fetchGlobalIntel } from './services/geminiService';
import { AnalyzedData, MarketSignal, MarketRegion, NewsItem, TickerContext } from './types';

enum Tab {
  SURVEILLANCE = 'SURVEILLANCE',
  SIGNALS = 'SIGNALS', // New Tab
  STRATEGY = 'STRATEGY',
  INTEL = 'INTEL'
}

const App: React.FC = () => {
  const [ticker, setTicker] = useState('NVDA');
  const [region, setRegion] = useState<MarketRegion>(MarketRegion.US);
  const [data, setData] = useState<AnalyzedData[]>([]);
  const [context, setContext] = useState<TickerContext | null>(null);
  const [signal, setSignal] = useState<MarketSignal | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [news, setNews] = useState<NewsItem[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SURVEILLANCE);

  useEffect(() => {
    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const initializeDashboard = async () => {
    await refreshAllData(ticker);
  };

  const refreshAllData = async (targetTicker: string) => {
    setLoadingData(true);
    setSignal(null);
    setSummary('');
    
    try {
      // 1. Fetch Deep Context (Current Price + 30 Day History Anchor)
      const tickerCtx = await fetchTickerContext(targetTicker);
      setContext(tickerCtx);

      // 2. Generate Chart anchored to REAL History (Brownian Bridge)
      // This ensures if the stock went up 20% in real life, the chart shows that.
      const volatility = targetTicker.includes('BTC') ? 0.05 : 0.025;
      const marketData = generateCalibratedData(tickerCtx.price, tickerCtx.price30DaysAgo, volatility);
      setData(marketData);

      // 3. Fetch News
      fetchGlobalIntel(targetTicker).then(setNews);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const runOracleAnalysis = async () => {
    if (data.length === 0) return;
    setAnalyzing(true);
    setActiveTab(Tab.SIGNALS); // Auto-switch to Signals tab when analyzing
    
    try {
      const result = await analyzeWithOracle(ticker, data[data.length - 1]);
      setSignal(result.signal);
      setSummary(result.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTickerSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      refreshAllData(ticker);
    }
  };

  const toggleRegion = () => {
    const newRegion = region === MarketRegion.US ? MarketRegion.PAKISTAN : MarketRegion.US;
    setRegion(newRegion);
    const newTicker = newRegion === MarketRegion.US ? 'NVDA' : 'SYS.PA';
    setTicker(newTicker);
    refreshAllData(newTicker);
  };

  return (
    <CyberLayout>
      {/* Sidebar */}
      <aside className="w-80 bg-[#050505] border-r border-[#111] flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-[#111]">
          <h2 className="text-[#00FF41] text-xs font-bold tracking-widest mb-4">SURVEILLANCE TARGET</h2>
          
          <div className="flex gap-2 mb-4">
             <button onClick={toggleRegion} className={`flex-1 py-1 text-[10px] border transition-all ${region === MarketRegion.US ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'text-[#666] border-[#333]'}`}>NASDAQ/NYSE</button>
             <button onClick={toggleRegion} className={`flex-1 py-1 text-[10px] border transition-all ${region === MarketRegion.PAKISTAN ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'text-[#666] border-[#333]'}`}>PSX (PAKISTAN)</button>
          </div>

          <div className="relative group">
            <input 
              type="text" 
              value={ticker} 
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleTickerSubmit}
              className="w-full bg-[#111] border border-[#333] text-[#00FF41] p-3 pl-10 font-mono focus:outline-none focus:border-[#00FF41] transition-all"
            />
            <span className="absolute left-3 top-3.5 text-[#666]">$</span>
          </div>
        </div>

        <div className="p-6 flex-1 space-y-6">
           {/* Enhanced Context Display */}
           {context && (
             <div className="bg-[#111] p-4 border-l-2 border-[#00FF41] space-y-3">
               <div>
                  <h3 className="text-gray-400 text-[10px] font-bold mb-1">ASSET CLASS</h3>
                  <div className="text-white text-xs font-bold truncate tracking-wider">{context.companyName}</div>
               </div>
               
               <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-gray-400 text-[10px] font-bold">SECTOR</h3>
                    <div className="text-[#00FF41] text-xs">{context.sector}</div>
                 </div>
                 <div className="text-right">
                    <h3 className="text-gray-400 text-[10px] font-bold">MKT CAP</h3>
                    <div className="text-blue-400 text-xs">{context.marketCap}</div>
                 </div>
               </div>

               <div className="h-[1px] bg-[#333] w-full"></div>

               <div className="flex justify-between items-center">
                 <span className="text-2xl font-mono text-[#00FF41]">${context.price.toFixed(2)}</span>
                 <span className={`text-xs px-2 py-1 rounded bg-black border ${context.changePercent >= 0 ? 'text-[#00FF41] border-[#00FF41]' : 'text-[#FF003C] border-[#FF003C]'}`}>
                   {context.changePercent > 0 ? '+' : ''}{context.changePercent.toFixed(2)}%
                 </span>
               </div>
             </div>
           )}

           <div className="space-y-2">
            <h3 className="text-[#666] text-[10px] font-bold">DATA ENGINE STATUS</h3>
            <div className="flex justify-between text-xs text-gray-400">
               <span>LAYER 1 (GEMINI SEARCH)</span>
               <span className="text-[#00FF41] animate-pulse">LOCKED</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
               <span>LAYER 2 (BROWNIAN BRIDGE)</span>
               <span className="text-[#00FF41]">ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Tabs */}
        <div className="flex border-b border-[#111] bg-[#050505] overflow-x-auto">
          <button 
            onClick={() => setActiveTab(Tab.SURVEILLANCE)}
            className={`px-6 py-3 text-xs font-bold transition-colors border-r border-[#111] whitespace-nowrap ${activeTab === Tab.SURVEILLANCE ? 'text-[#00FF41] bg-[#111]' : 'text-[#666] hover:text-gray-400'}`}
          >
            LIVE SURVEILLANCE
          </button>
          <button 
            onClick={() => setActiveTab(Tab.SIGNALS)}
            className={`px-6 py-3 text-xs font-bold transition-colors border-r border-[#111] whitespace-nowrap ${activeTab === Tab.SIGNALS ? 'text-[#00FF41] bg-[#111]' : 'text-[#666] hover:text-gray-400'}`}
          >
            TRADE SIGNALS
          </button>
          <button 
             onClick={() => setActiveTab(Tab.STRATEGY)}
             className={`px-6 py-3 text-xs font-bold transition-colors border-r border-[#111] whitespace-nowrap ${activeTab === Tab.STRATEGY ? 'text-[#00FF41] bg-[#111]' : 'text-[#666] hover:text-gray-400'}`}
          >
            STRATEGY SIMULATION
          </button>
          <button 
             onClick={() => setActiveTab(Tab.INTEL)}
             className={`px-6 py-3 text-xs font-bold transition-colors border-r border-[#111] whitespace-nowrap ${activeTab === Tab.INTEL ? 'text-[#00FF41] bg-[#111]' : 'text-[#666] hover:text-gray-400'}`}
          >
            GLOBAL INTEL
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {loadingData && (
             <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm flex-col gap-4">
               <div className="w-16 h-1 bg-[#111] overflow-hidden">
                 <div className="h-full bg-[#00FF41] animate-progress"></div>
               </div>
               <div className="text-[#00FF41] font-mono text-xs animate-pulse tracking-widest">DECRYPTING MARKET DATA...</div>
             </div>
          )}

          {activeTab === Tab.SURVEILLANCE && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="h-96">
                   <StockChart data={data} ticker={ticker} />
                </div>
                <div className="flex-1 min-h-[200px]">
                   <IntelTerminal summary={summary} ticker={ticker} />
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                 <SignalDisplay signal={signal} loading={analyzing} onAnalyze={runOracleAnalysis} />
              </div>
            </div>
          )}

          {activeTab === Tab.SIGNALS && (
             <div className="h-full">
               <SignalTerminal signal={signal} data={data} loading={analyzing} onAnalyze={runOracleAnalysis} />
             </div>
          )}

          {activeTab === Tab.STRATEGY && (
            <div className="p-6 h-full overflow-y-auto">
              <StrategySim data={data} />
            </div>
          )}

          {activeTab === Tab.INTEL && (
             <div className="p-6 h-full overflow-y-auto">
               <GlobalIntel news={news} loading={loadingData} ticker={ticker} />
             </div>
          )}
        </div>
      </div>
    </CyberLayout>
  );
};

export default App;
