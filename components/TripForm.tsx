
import React, { useState, useEffect, useMemo } from 'react';
import { ReferenceData, Trip } from '../types';
import { geminiService } from '../services/geminiService';

interface TripFormProps {
  refs: ReferenceData;
  trips: Trip[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ refs, trips, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    veiculo: '',
    motorista: '',
    kmSaida: '',
    destino: '',
    seguranca: ''
  });
  const [tip, setTip] = useState<string | null>(null);

  const lastKm = useMemo(() => {
    if (!formData.veiculo) return 0;
    const vehicleTrips = trips.filter(t => t.veiculo === formData.veiculo);
    if (vehicleTrips.length === 0) return 0;
    let max = 0;
    vehicleTrips.forEach(t => {
      if (t.kmSaida > max) max = t.kmSaida;
      if (t.kmRetorno && t.kmRetorno > max) max = t.kmRetorno;
    });
    return max;
  }, [formData.veiculo, trips]);

  const isKmInvalid = useMemo(() => {
    if (!formData.kmSaida) return false;
    return Number(formData.kmSaida) < lastKm;
  }, [formData.kmSaida, lastKm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.veiculo || !formData.motorista || !formData.seguranca || !formData.kmSaida || !formData.destino) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    if (isKmInvalid) {
      alert(`Atenção: O KM de Saída não pode ser menor que o último registro (${lastKm} km).`);
      return;
    }
    onSubmit({
      ...formData,
      kmSaida: Number(formData.kmSaida)
    });
  };

  useEffect(() => {
    if (formData.motorista && formData.destino) {
      const timer = setTimeout(async () => {
        const safetyTip = await geminiService.getQuickSafetyTip(formData.motorista, formData.destino);
        setTip(safetyTip);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.motorista, formData.destino]);

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-rose-500 p-8 text-center">
        <h2 className="text-white text-xl font-black uppercase tracking-tighter italic">
          Registrar Saída
        </h2>
        <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">Controle de Fluxo Operacional</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          {/* 1. VEÍCULO */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">VEÍCULO</label>
            <select
              value={formData.veiculo}
              onChange={e => setFormData({ ...formData, veiculo: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm font-bold text-gray-700 appearance-none"
            >
              <option value="">Selecione o Veículo</option>
              {refs.veiculos.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* 2. MOTORISTA */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">MOTORISTA</label>
            <select
              value={formData.motorista}
              onChange={e => setFormData({ ...formData, motorista: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm font-bold text-gray-700 appearance-none"
            >
              <option value="">Selecione o Motorista</option>
              {refs.motoristas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* 3. KM DE SAIDA */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">KM DE SAIDA</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={formData.kmSaida}
                onChange={e => setFormData({ ...formData, kmSaida: e.target.value })}
                className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:ring-2 outline-none transition-all text-sm font-bold text-gray-700 pr-12 ${isKmInvalid ? 'border-red-300 ring-red-100 focus:ring-red-500' : 'border-gray-100 focus:ring-rose-500'}`}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] font-black uppercase">KM</span>
            </div>
            
            {formData.veiculo && (
              <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">
                  KM anterior: <span>{lastKm} km</span>
                </span>
                {isKmInvalid && (
                  <span className="text-[9px] font-bold text-red-500 uppercase animate-pulse">
                    Valor menor que o KM anterior!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. DESTINO */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">DESTINO</label>
            <input
              type="text"
              placeholder="Ex: Unidade Industrial"
              value={formData.destino}
              onChange={e => setFormData({ ...formData, destino: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm font-bold text-gray-700"
            />
          </div>

          {/* 5. SEGURANÇA */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">SEGURANÇA</label>
            <select
              value={formData.seguranca}
              onChange={e => setFormData({ ...formData, seguranca: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm font-bold text-gray-700 appearance-none"
            >
              <option value="">Selecione o Segurança</option>
              {refs.segurancas.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {tip && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-700 text-[11px] font-bold italic leading-relaxed uppercase tracking-tight">{tip}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isKmInvalid}
          className="w-full py-5 bg-rose-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 active:scale-95 flex justify-center items-center"
        >
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : "Confirmar Saída do Veículo"}
        </button>
      </form>
    </div>
  );
};

export default TripForm;
