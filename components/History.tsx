
import React, { useState } from 'react';
import { Trip } from '../types';

interface HistoryProps {
  trips: Trip[];
}

const History: React.FC<HistoryProps> = ({ trips }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = trips
    .filter(t => t.status === 'Concluído')
    .filter(t => 
      t.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.motorista.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.dataRetorno || '').getTime() - new Date(a.dataRetorno || '').getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Viagens</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar veículo ou motorista..."
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Veículo / Motorista</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Km Rodado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(trip => (
                <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{trip.veiculo}</div>
                    <div className="text-sm text-gray-500">{trip.motorista}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{trip.destino}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-800">
                      S: {new Date(trip.dataSaida).toLocaleDateString()} {new Date(trip.dataSaida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      C: {new Date(trip.dataRetorno!).toLocaleDateString()} {new Date(trip.dataRetorno!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {trip.kmRodado} km
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
