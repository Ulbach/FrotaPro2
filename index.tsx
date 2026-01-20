
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
    const r = await fetch(`${SCRIPT_URL}?action=getRefs`);
    return await r.json();
  },
  async getTrips(): Promise<Trip[]> {
    const r = await fetch(`${SCRIPT_URL}?action=getTrips`);
    return await r.json();
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
        contents: `Gere uma dica curta de segurança para o motorista ${driver} indo para ${dest}.`
      });
      return res.text;
    } catch { return null; }
  }
};

// --- COMPONENTES ---

const TripForm = ({ refs, trips, onSave, onBack }: any) => {
  const [f, setF] = useState({ veiculo: '', motorista: '', kmSaida: '', destino: '', seguranca: '' });
  const [loading, setLoading] = useState(false);

  const lastKm = useMemo(() => {
    const vTrips = trips.filter((t: any) => t.veiculo === f.veiculo);
    return Math.max(0, ...vTrips.map((t: any) => t.kmRetorno || t.kmSaida || 0));
  }, [f.veiculo, trips]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-rose-500 p-6 rounded-[32px] text-white text-center shadow-lg">
        <h2 className="font-black italic text-xl uppercase italic">Registrar Saída</h2>
      </div>
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
        <select value={f.veiculo} onChange={e => setF({...f, veiculo: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm">
          <option value="">Veículo</option>
          {refs.veiculos.map((v:string) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={f.motorista} onChange={e => setF({...f, motorista: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm">
          <option value="">Motorista</option>
          {refs.motoristas.map((m:string) => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="relative">
          <input type="number" placeholder="KM de Saída" value={f.kmSaida} onChange={e => setF({...f, kmSaida: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" />
          <span className="absolute right-4 top-4 text-[10px] font-black text-gray-300">KM</span>
        </div>
        {f.veiculo && <p className="text-[10px] font-bold text-rose-400 px-2 uppercase">Último KM: {lastKm}</p>}
        <input type="text" placeholder="Destino" value={f.destino} onChange={e => setF({...f, destino: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" />
        <select value={f.seguranca} onChange={e => setF({...f, seguranca: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm">
          <option value="">Segurança</option>
          {refs.segurancas.map((s:string) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button 
          disabled={loading}
          onClick={async () => {
            if(!f.veiculo || !f.kmSaida) return alert("Preencha os campos!");
            setLoading(true);
            await onSave(f);
            setLoading(false);
          }}
          className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
        >
          {loading ? "Gravando..." : "Confirmar Saída"}
        </button>
      </div>
    </div>
  );
};

const ActiveTrips = ({ trips, onFinish }: any) => {
  const active = trips.filter((t: any) => t.status === 'Em Viagem');
  const [selected, setSelected] = useState<string|null>(null);
  const [km, setKm] = useState('');

  if(active.length === 0) return <div className="text-center p-20 text-gray-300 font-black uppercase tracking-widest italic">Pátio Limpo</div>;

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Em Rota ({active.length})</h2>
      {active.map((t: any) => (
        <div key={t.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black italic text-lg text-gray-800">{t.veiculo}</h3>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase italic">Ativo</span>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-4">{t.motorista} • {t.destino}</p>
          {selected === t.id ? (
            <div className="space-y-3 pt-2">
              <input type="number" placeholder="KM de Chegada" value={km} onChange={e => setKm(e.target.value)} className="w-full p-4 bg-emerald-50 rounded-2xl border-none font-bold text-sm" />
              <div className="flex space-x-2">
                <button onClick={() => onFinish(t.id, Number(km))} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Confirmar</button>
                <button onClick={() => setSelected(null)} className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black">X</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setSelected(t.id)} className="w-full py-4 border border-emerald-500 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Registrar Entrada</button>
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
    setLoading(true);
    try {
      const [t, r] = await Promise.all([sheetsService.getTrips(), sheetsService.getRefs()]);
      setTrips(t); setRefs(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="h-screen flex flex-col items-center justify-center font-black text-gray-300 uppercase tracking-[0.5em] animate-pulse italic">Frota Pro II<br/><span className="text-[8px] mt-4">Sincronizando...</span></div>;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F8F9FB] flex flex-col shadow-2xl">
      {view === 'DASH' ? (
        <div className="p-8 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
          <header className="py-12 text-center">
            <h1 className="text-6xl font-black italic tracking-tighter text-gray-900 leading-none">FROTA<br/><span className="text-rose-500 underline decoration-4 underline-offset-8">PRO II</span></h1>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mt-8 italic">Controle Operacional</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('OUT')} className="aspect-square bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 active:scale-95 transition-all">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nova Saída</span>
            </button>
            <button onClick={() => setView('IN')} className="aspect-square bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 active:scale-95 transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entrada</span>
            </button>
          </div>

          <button onClick={() => setView('HISTORY')} className="w-full p-8 bg-white rounded-[40px] border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Histórico de Viagens</span>
            </div>
            <svg className="w-4 h-4 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
          </button>
          <footer className="text-center pt-8"><span className="text-[9px] font-black text-gray-200 uppercase tracking-[0.6em] italic">BY ULBACH</span></footer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <nav className="p-6 flex items-center space-x-4 bg-white border-b border-gray-50 sticky top-0 z-50">
            <button onClick={() => setView('DASH')} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800 italic">{view === 'OUT' ? 'Nova Saída' : view === 'IN' ? 'Veículos Ativos' : 'Histórico'}</h2>
          </nav>
          <div className="flex-1 p-6 overflow-y-auto hide-scrollbar">
            {view === 'OUT' && <TripForm refs={refs} trips={trips} onSave={async (d:any)=>{ await sheetsService.saveTrip(d); await load(); setView('DASH'); }} />}
            {view === 'IN' && <ActiveTrips trips={trips} onFinish={async (id:string, km:number)=>{ await sheetsService.finishTrip(id, km, {}); await load(); setView('DASH'); }} />}
            {view === 'HISTORY' && (
              <div className="space-y-4 animate-in fade-in">
                {trips.filter(t=>t.status==='Concluído').reverse().map(t=>(
                  <div key={t.id} className="bg-white p-6 rounded-[32px] border border-gray-50 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-black italic text-gray-800 text-sm uppercase">{t.veiculo}</p>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{t.motorista} • {t.kmRodado}km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-rose-500">{new Date(t.dataRetorno!).toLocaleDateString()}</p>
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
