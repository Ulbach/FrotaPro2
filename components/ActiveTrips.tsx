
import React, { useState, useEffect } from 'react';
import { Trip, ReferenceData } from '../types';

interface ActiveTripsProps {
  trips: Trip[];
  refs: ReferenceData;
  onFinish: (id: string, kmRetorno: number, updatedTripData?: Partial<Trip>) => void;
  isLoading: boolean;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ trips, refs, onFinish, isLoading }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kmRetorno, setKmRetorno] = useState('');
  
  // Estados para permitir alteração do registro antes de finalizar
  const [editMotorista, setEditMotorista] = useState('');
  const [editSeguranca, setEditSeguranca] = useState('');

  const activeOnes = trips.filter(t => t.status === 'Em Viagem');
  const selectedTrip = activeOnes.find(t => t.id === selectedId);

  useEffect(() => {
    if (selectedTrip) {
      setEditMotorista(selectedTrip.motorista);
      setEditSeguranca(selectedTrip.seguranca);
    }
  }, [selectedTrip]);

  const isKmInvalid = selectedTrip && kmRetorno !== '' && Number(kmRetorno) < selectedTrip.kmSaida;

  const handleFinish = (id: string) => {
    const val = Number(kmRetorno);
    if (selectedTrip && val < selectedTrip.kmSaida) {
      return; // A validação visual já bloqueia o botão
    }
    if (!kmRetorno) {
      alert("Por favor, informe o KM Atual.");
      return;
    }
    
    onFinish(id, val, {
      motorista: editMotorista,
      seguranca: editSeguranca
    });
    
    setSelectedId(null);
    setKmRetorno('');
  };

  if (activeOnes.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-gray-100">
        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Pátio Completo</h3>
        <p className="text-[10px] text-gray-300 mt-2 font-bold uppercase tracking-widest">Nenhum veículo em rota no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
          VEÍCULOS EM ROTA ({activeOnes.length})
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {activeOnes.map(trip => (
          <div key={trip.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">{trip.veiculo}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{trip.motorista}</p>
              </div>
              <div className="bg-emerald-50 px-3 py-1 rounded-full">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ATIVO</span>
              </div>
            </div>

            {selectedId === trip.id ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  {/* Edição de Motorista */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">ALTERAR MOTORISTA</label>
                    <select
                      value={editMotorista}
                      onChange={e => setEditMotorista(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                      {refs.motoristas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Edição de Segurança */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">ALTERAR SEGURANÇA</label>
                    <select
                      value={editSeguranca}
                      onChange={e => setEditSeguranca(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                      {refs.segurancas.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* KM ATUAL (RETORNO) */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">KM ATUAL (RETORNO)</label>
                    <div className="relative">
                      <input
                        autoFocus
                        type="number"
                        placeholder="Digite o KM atual"
                        className={`w-full px-5 py-4 bg-emerald-50 border rounded-2xl outline-none focus:ring-2 text-sm font-bold text-gray-700 ${isKmInvalid ? 'border-red-500 ring-2 ring-red-100 focus:ring-red-600' : 'border-emerald-100 focus:ring-emerald-500'}`}
                        value={kmRetorno}
                        onChange={e => setKmRetorno(e.target.value)}
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400 uppercase">KM</span>
                    </div>
                    
                    <div className="mt-2 flex flex-col space-y-1 px-1">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">KM DE SAÍDA: {trip.kmSaida}</span>
                      {isKmInvalid && (
                        <div className="bg-red-600 p-2 rounded-lg mt-2 animate-pulse">
                          <span className="text-[10px] font-black text-white uppercase block text-center">
                            O KM ATUAL NÃO PODE SER MENOR QUE O KM DE SAÍDA!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleFinish(trip.id)}
                    disabled={isLoading || isKmInvalid}
                    className="flex-1 py-5 bg-emerald-500 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.1em] hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100 disabled:opacity-30"
                  >
                    {isLoading ? "Processando..." : "Confirmar Chegada"}
                  </button>
                  <button
                    onClick={() => { setSelectedId(null); setKmRetorno(''); }}
                    className="px-6 py-5 bg-gray-100 text-gray-400 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    X
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino</p>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-tight truncate">{trip.destino}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">KM Saída</p>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">{trip.kmSaida} km</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(trip.id)}
                  className="w-full py-4 bg-white border border-emerald-100 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-50 transition-all active:scale-95"
                >
                  Registrar Entrada
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveTrips;
