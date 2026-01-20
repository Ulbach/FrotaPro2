
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÃO ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwE8F061OhUN5lTom2nZ0W_Vm5LX2wAWhPE4rtd6umbaxcIdmjaAzEtlf-wOHVpgDl-4g/exec';

// --- TYPES ---
type Status = 'Em Viagem' | 'Concluído';

interface Trip {
  id: string;
  veiculo: string;
  motorista: string;
  seguranca: string;
  kmSaida: number;
  destino: string;
  dataSaida: string;
  status: Status;
  kmRetorno?: number;
  kmRodado?: number;
  dataRetorno?: string;
}

interface ReferenceData {
  veiculos: string[];
  motoristas: string[];
  segurancas: string[];
}

// --- SERVIÇOS ---
const sheetsService = {
  async getRefs(): Promise<ReferenceData> {
    try {
      const r = await fetch(`${SCRIPT_URL}?action=getRefs`);
      return await r.json();
    } catch {
      return { veiculos: [], motoristas: [], segurancas: [] };
    }
  },
  async getTrips(): Promise<Trip[]> {
    try {
      const r = await fetch(`${SCRIPT_URL}?action=getTrips`);
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  },
  async saveTrip(data: any) {
    return await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'saveTrip', ...data, dataSaida: new Date().toISOString() })
    });
  },
  async finishTrip(id: string, km: number, extras: any) {
    return await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'finishTrip', id, kmRetorno: km, ...extras, dataRetorno: new Date().toISOString() })
    });
  }
};

const geminiService = {
  async getTip(driver: string, dest: string) {
    try {
      const apiKey = (window as any).process?.env?.API_KEY || '';
      if (!apiKey) return null;
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma dica de segurança curta (máximo 12 palavras) para o motorista ${driver} indo para ${dest}. Use português do Brasil.`
      });
      return res.text;
    } catch { return null; }
  }
};

// --- COMPONENTES ---

const TripForm = ({ refs, trips, onSave }: any) => {
  const [f, setF] = useState({ veiculo: '', motorista: '', kmSaida: '', destino: '', seguranca: '' });
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  const lastKm = useMemo(() => {
    const vTrips = trips.filter((t: any) => t.veiculo === f.veiculo);
    return Math.max(0, ...vTrips.map((t: any) => t.kmRetorno || t.kmSaida || 0));
  }, [f.veiculo, trips]);

  useEffect(() => {
    if (f.motorista && f.destino) {
      const t = setTimeout(async () => {
        const d = await geminiService.getTip(f.motorista, f.destino);
        setTip(d);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [f.motorista, f.destino]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-rose-600 p-8 rounded-[40px] text-white text-center shadow-2xl shadow-rose-950/20">
        <h2 className="font-black italic text-2xl uppercase tracking-tighter">Registrar Saída</h2>
        <p className="text-[10px] font-bold text-rose-200 uppercase tracking-[0.3em] mt-1">Check-out de Veículo</p>
      </div>
      
      <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[40px] border border-slate-800 space-y-5 shadow-2xl">
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Veículo</label>
            <select value={f.veiculo} onChange={e => setF({...f, veiculo: e.target.value})} className="w-full p-4 bg-slate-800 rounded-2xl border-none font-bold text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none appearance-none">
                <option value="">Selecione...</option>
                {refs.veiculos.map((v:string) => <option key={v} value={v}>{v}</option>)}
            </select>
        </div>
        
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Motorista</label>
            <select value={f.motorista} onChange={e => setF({...f, motorista: e.target.value})} className="w-full p-4 bg-slate-800 rounded-2xl border-none font-bold text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none appearance-none">
                <option value="">Selecione...</option>
                {refs.motoristas.map((m:string) => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KM Saída</label>
                <input type="number" value={f.kmSaida} onChange={e => setF({...f, kmSaida: e.target.value})} className="w-full p-4 bg-slate-800 rounded-2xl border-none font-bold text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-400/50 uppercase tracking-widest ml-2">Anterior</label>
                <div className="w-full p-4 bg-rose-500/10 rounded-2xl border-none font-black text-sm text-rose-400">{lastKm}</div>
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Destino</label>
            <input type="text" value={f.destino} onChange={e => setF({...f, destino: e.target.value})} className="w-full p-4 bg-slate-800 rounded-2xl border-none font-bold text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Ex: Unidade 2" />
        </div>

        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Segurança Responsável</label>
            <select value={f.seguranca} onChange={e => setF({...f, seguranca: e.target.value})} className="w-full p-4 bg-slate-800 rounded-2xl border-none font-bold text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none appearance-none">
                <option value="">Selecione...</option>
                {refs.segurancas.map((s:string) => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>

        {tip && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] font-bold text-amber-400 italic">
               💡 {tip}
            </div>
        )}

        <button 
          disabled={loading || !f.veiculo || !f.kmSaida}
          onClick={async () => {
            setLoading(true);
            await onSave(f);
            setLoading(false);
          }}
          className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-950/40 active:scale-95 transition-all disabled:opacity-30 mt-4"
        >
          {loading ? "Processando..." : "Confirmar Saída"}
        </button>
      </div>
    </div>
  );
};

const ActiveTrips = ({ trips, onFinish }: any) => {
  const active = trips.filter((t: any) => t.status === 'Em Viagem');
  const [selected, setSelected] = useState<string|null>(null);
  const [km, setKm] = useState('');
  const [loading, setLoading] = useState(false);

  if(active.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Nenhum Veículo em Rota</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center space-x-2 px-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Veículos em Operação ({active.length})</h2>
      </div>
      
      {active.map((t: any) => (
        <div key={t.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-[40px] shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black italic text-xl text-white tracking-tighter uppercase">{t.veiculo}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t.motorista}</p>
            </div>
            <div className="bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">EM ROTA</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
              <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase">Destino</p>
                  <p className="text-xs font-bold text-slate-300 truncate">{t.destino}</p>
              </div>
              <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase">KM Saída</p>
                  <p className="text-xs font-bold text-slate-300">{t.kmSaida} km</p>
              </div>
          </div>

          {selected === t.id ? (
            <div className="space-y-3 pt-2 animate-in slide-in-from-top-4">
              <input type="number" placeholder="KM de Chegada" value={km} onChange={e => setKm(e.target.value)} className="w-full p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl font-black text-sm text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex space-x-2">
                <button 
                    disabled={loading || !km}
                    onClick={async () => {
                        setLoading(true);
                        await onFinish(t.id, Number(km));
                        setLoading(false);
                    }} 
                    className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-950/20"
                >
                    {loading ? "..." : "Confirmar Entrada"}
                </button>
                <button onClick={() => setSelected(null)} className="px-6 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black">X</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setSelected(t.id)} className="w-full py-4 border-2 border-emerald-500/30 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-500/5 transition-all">Registrar Entrada</button>
          )}
        </div>
      ))}
    </div>
  );
};

// --- APP PRINCIPAL ---

const App = () => {
  const [view, setView] = useState('DASH');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refs, setRefs] = useState<ReferenceData>({ veiculos: [], motoristas: [], segurancas: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [t, r] = await Promise.all([sheetsService.getTrips(), sheetsService.getRefs()]);
      setTrips(t); setRefs(r);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
      const init = async () => {
          setLoading(true);
          await load();
          setLoading(false);
      };
      init();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-rose-500/20"></div>
        <p className="font-black text-slate-500 uppercase tracking-[0.5em] text-[10px] animate-pulse italic">Frota Pro II Sincronizando</p>
    </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#020617] flex flex-col shadow-2xl relative overflow-x-hidden selection:bg-rose-500/30">
      {view === 'DASH' ? (
        <div className="flex-1 flex flex-col animate-in fade-in duration-700 overflow-y-auto hide-scrollbar">
          
          {/* HEADER COM IMAGEM */}
          <div className="relative h-80 w-full shrink-0 overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover scale-110 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000"
                alt="Truck header"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center pt-10">
                <div className="bg-rose-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-rose-500/30 mb-4 animate-bounce">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Frota Operacional</span>
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter text-white leading-none">FROTA<br/><span className="text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]">PRO II</span></h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-6 italic opacity-70">Sistema Gestão Logística</p>
            </div>
          </div>

          <div className="px-8 pb-32 space-y-6 -mt-10 relative z-20">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('OUT')} className="aspect-square glass rounded-[48px] flex flex-col items-center justify-center p-6 active:scale-95 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-4 border border-rose-500/20 group-hover:rotate-12 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-rose-400 transition-colors">Saída</span>
              </button>
              
              <button onClick={() => setView('IN')} className="aspect-square glass rounded-[48px] flex flex-col items-center justify-center p-6 active:scale-95 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:-rotate-12 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-400 transition-colors">Entrada</span>
              </button>
            </div>

            <button onClick={() => setView('HISTORY')} className="w-full p-8 glass rounded-[40px] flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
              <div className="flex items-center space-x-5 relative z-10">
                <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center group-hover:text-sky-400 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <div className="text-left">
                    <span className="block text-[11px] font-black uppercase tracking-widest text-slate-300">Histórico Completo</span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Registros de Movimentação</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
            </button>
            
            <footer className="text-center pt-8 opacity-20"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[1em] italic">ULBACH OPERATIONAL</span></footer>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#020617] animate-in slide-in-from-right duration-500 overflow-hidden">
          <nav className="p-8 flex items-center space-x-6 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
            <button onClick={() => setView('DASH')} className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-200 italic">{view === 'OUT' ? 'Saída' : view === 'IN' ? 'Entrada' : 'Histórico'}</h2>
          </nav>
          
          <div className="flex-1 p-8 overflow-y-auto hide-scrollbar">
            {view === 'OUT' && <TripForm refs={refs} trips={trips} onSave={async (d:any)=>{ 
                await sheetsService.saveTrip(d); 
                await load(); 
                setView('DASH'); 
            }} />}
            
            {view === 'IN' && <ActiveTrips trips={trips} onFinish={async (id:string, km:number)=>{ 
                await sheetsService.finishTrip(id, km, {}); 
                await load(); 
                setView('DASH'); 
            }} />}
            
            {view === 'HISTORY' && (
              <div className="space-y-4 animate-in fade-in pb-10">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Histórico Recente</h3>
                    <button onClick={load} className="text-rose-500 font-black text-[9px] uppercase tracking-widest">Atualizar</button>
                </div>
                {trips
                    .filter(t => t.status === 'Concluído')
                    .sort((a, b) => new Date(b.dataRetorno || 0).getTime() - new Date(a.dataRetorno || 0).getTime())
                    .map(t => (
                  <div key={t.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[32px] flex justify-between items-center shadow-lg group hover:border-slate-700 transition-colors">
                    <div className="space-y-1">
                      <p className="font-black italic text-white text-base uppercase tracking-tighter">{t.veiculo}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.motorista} • {t.kmRodado}km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-rose-500 uppercase italic">{new Date(t.dataRetorno!).toLocaleDateString()}</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{new Date(t.dataRetorno!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
