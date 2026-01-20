
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

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

enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHECK_OUT = 'CHECK_OUT',
  ACTIVE_TRIPS = 'ACTIVE_TRIPS',
  HISTORY = 'HISTORY'
}

// --- SERVICES ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwE8F061OhUN5lTom2nZ0W_Vm5LX2wAWhPE4rtd6umbaxcIdmjaAzEtlf-wOHVpgDl-4g/exec';

class SheetsService {
  async getReferenceData(): Promise<ReferenceData> {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getRefs`);
      if (!res.ok) throw new Error('Falha ao buscar referências');
      return await res.json();
    } catch (error) {
      console.error("Erro ao carregar referências:", error);
      return { veiculos: [], motoristas: [], segurancas: [] };
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getTrips`);
      if (!res.ok) throw new Error('Falha ao buscar viagens');
      return await res.json();
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      return [];
    }
  }

  async saveTrip(trip: any): Promise<void> {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'saveTrip', ...trip, dataSaida: new Date().toISOString() })
    });
  }

  async finishTrip(id: string, kmRetorno: number, updatedData?: any): Promise<void> {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ 
        action: 'finishTrip', 
        id, 
        kmRetorno, 
        dataRetorno: new Date().toISOString(),
        ...updatedData 
      })
    });
  }
}

const sheetsService = new SheetsService();

class GeminiService {
  private ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });

  async getQuickSafetyTip(driver: string, destination: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma dica de segurança curtíssima para o motorista ${driver} indo para ${destination}.`,
      });
      return response.text || "Dirija com segurança!";
    } catch {
      return "Boa viagem!";
    }
  }
}

const geminiService = new GeminiService();

// --- COMPONENTS ---

const TripForm = ({ refs, trips, onSubmit, isLoading }: any) => {
  const [formData, setFormData] = useState({ veiculo: '', motorista: '', kmSaida: '', destino: '', seguranca: '' });
  const [tip, setTip] = useState<string | null>(null);

  const lastKm = useMemo(() => {
    if (!formData.veiculo) return 0;
    const vTrips = trips.filter((t: any) => t.veiculo === formData.veiculo);
    let max = 0;
    vTrips.forEach((t: any) => {
      if (t.kmSaida > max) max = t.kmSaida;
      if (t.kmRetorno && t.kmRetorno > max) max = t.kmRetorno;
    });
    return max;
  }, [formData.veiculo, trips]);

  useEffect(() => {
    if (formData.motorista && formData.destino) {
      geminiService.getQuickSafetyTip(formData.motorista, formData.destino).then(setTip);
    }
  }, [formData.motorista, formData.destino]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.kmSaida) < lastKm) {
      alert("KM de saída inválido!");
      return;
    }
    onSubmit({ ...formData, kmSaida: Number(formData.kmSaida) });
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-rose-500 p-8 text-center">
        <h2 className="text-white text-xl font-black uppercase tracking-tighter italic">REGISTRAR SAÍDA</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <select value={formData.veiculo} onChange={e => setFormData({ ...formData, veiculo: e.target.value })} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Veículo</option>
            {refs.veiculos.map((v: string) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={formData.motorista} onChange={e => setFormData({ ...formData, motorista: e.target.value })} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Motorista</option>
            {refs.motoristas.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative">
            <input type="number" placeholder="KM de Saída" value={formData.kmSaida} onChange={e => setFormData({ ...formData, kmSaida: e.target.value })} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500" />
            <span className="absolute right-4 top-4 text-[10px] font-black text-gray-300">KM</span>
          </div>
          <input type="text" placeholder="Destino" value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500" />
          <select value={formData.seguranca} onChange={e => setFormData({ ...formData, seguranca: e.target.value })} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Segurança Responsável</option>
            {refs.segurancas.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {tip && <div className="p-4 bg-amber-50 rounded-2xl text-[11px] font-bold text-amber-700 italic border border-amber-100">{tip}</div>}
        <button type="submit" disabled={isLoading} className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
          {isLoading ? "Salvando..." : "Confirmar Saída"}
        </button>
      </form>
    </div>
  );
};

const ActiveTrips = ({ trips, refs, onFinish, isLoading }: any) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kmRetorno, setKmRetorno] = useState('');
  const activeOnes = trips.filter((t: any) => t.status === 'Em Viagem');

  if (activeOnes.length === 0) return <div className="text-center p-20 text-gray-300 font-bold uppercase tracking-widest">Nenhuma viagem ativa</div>;

  return (
    <div className="grid gap-4">
      {activeOnes.map((trip: any) => (
        <div key={trip.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black italic text-lg">{trip.veiculo}</h3>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">EM ROTA</span>
          </div>
          {selectedId === trip.id ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <input type="number" placeholder="KM de Retorno" value={kmRetorno} onChange={e => setKmRetorno(e.target.value)} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex space-x-2">
                <button onClick={() => onFinish(trip.id, Number(kmRetorno))} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Confirmar</button>
                <button onClick={() => setSelectedId(null)} className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black">X</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setSelectedId(trip.id)} className="w-full py-4 border border-emerald-500 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Registrar Entrada</button>
          )}
        </div>
      ))}
    </div>
  );
};

const HistoryView = ({ trips }: any) => {
  const finished = trips.filter((t: any) => t.status === 'Concluído').reverse();
  return (
    <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-50 bg-gray-50/50"><h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Histórico Recente</h2></div>
      <div className="divide-y divide-gray-50">
        {finished.map((t: any) => (
          <div key={t.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div>
              <div className="font-black text-sm text-gray-800">{t.veiculo}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t.motorista} • {t.kmRodado}km rodados</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-rose-500 uppercase">{new Date(t.dataRetorno).toLocaleDateString()}</div>
              <div className="text-[9px] font-bold text-gray-300">{new Date(t.dataRetorno).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [view, setView] = useState(AppView.DASHBOARD);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refs, setRefs] = useState<ReferenceData>({ veiculos: [], motoristas: [], segurancas: [] });
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const [t, r] = await Promise.all([sheetsService.getTrips(), sheetsService.getReferenceData()]);
    setTrips(t); setRefs(r);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-gray-300 uppercase tracking-widest animate-pulse">Carregando...</div>;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F8F9FB] flex flex-col shadow-2xl relative">
      {view === AppView.DASHBOARD ? (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
          <header className="py-12 text-center">
            <h1 className="text-5xl font-black italic tracking-tighter text-gray-900 leading-none">FROTA<br/><span className="text-rose-500">PRO II</span></h1>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-4 italic">Sistema Operacional</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView(AppView.CHECK_OUT)} className="aspect-square bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saída</span>
            </button>
            <button onClick={() => setView(AppView.ACTIVE_TRIPS)} className="aspect-square bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entrada</span>
            </button>
          </div>

          <button onClick={() => setView(AppView.HISTORY)} className="w-full p-6 bg-white rounded-[32px] border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Histórico de Movimentação</span>
            </div>
            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>

          <footer className="text-center pt-12"><span className="text-[9px] font-black text-gray-200 uppercase tracking-[0.5em]">BY ULBACH</span></footer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-500">
          <nav className="p-6 flex items-center space-x-4 bg-white border-b border-gray-50">
            <button onClick={() => setView(AppView.DASHBOARD)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
              {view === AppView.CHECK_OUT ? "Nova Saída" : view === AppView.ACTIVE_TRIPS ? "Viagens Ativas" : "Histórico"}
            </h2>
          </nav>
          <div className="flex-1 p-6 overflow-y-auto">
            {view === AppView.CHECK_OUT && <TripForm refs={refs} trips={trips} onSubmit={async (d:any) => { await sheetsService.saveTrip(d); load(); setView(AppView.DASHBOARD); }} />}
            {view === AppView.ACTIVE_TRIPS && <ActiveTrips trips={trips} onFinish={async (id:string, km:number) => { await sheetsService.finishTrip(id, km); load(); setView(AppView.DASHBOARD); }} />}
            {view === AppView.HISTORY && <HistoryView trips={trips} />}
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
