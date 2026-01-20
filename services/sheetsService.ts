
import { Trip, ReferenceData } from '../types';

// URL oficial do Google Apps Script fornecida pelo usuário
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwE8F061OhUN5lTom2nZ0W_Vm5LX2wAWhPE4rtd6umbaxcIdmjaAzEtlf-wOHVpgDl-4g/exec'; 

class SheetsService {
  private useMock = !SCRIPT_URL;

  async getReferenceData(): Promise<ReferenceData> {
    if (this.useMock) {
      console.warn("URL da Planilha não configurada. Usando dados locais.");
      return {
        veiculos: ['ABC-1234', 'XYZ-5678', 'GOL-0001', 'AMAROK-99'],
        motoristas: ['João Silva', 'Maria Santos', 'Anne Karoline', 'Fabricio Ulbach'],
        segurancas: ['Marcos Vigilante', 'Roberto Guarda']
      };
    }

    try {
      const res = await fetch(`${SCRIPT_URL}?action=getRefs`);
      if (!res.ok) throw new Error('Falha ao buscar referências');
      return await res.json();
    } catch (error) {
      console.error("Erro ao carregar referências:", error);
      throw error;
    }
  }

  async getTrips(): Promise<Trip[]> {
    if (this.useMock) {
      const data = localStorage.getItem('frotas_data_v1');
      return data ? JSON.parse(data) : [];
    }

    try {
      const res = await fetch(`${SCRIPT_URL}?action=getTrips`);
      if (!res.ok) throw new Error('Falha ao buscar viagens');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      return [];
    }
  }

  async saveTrip(trip: Omit<Trip, 'id' | 'dataSaida' | 'status'>): Promise<Trip> {
    const now = new Date().toISOString();
    
    if (this.useMock) {
      const trips = await this.getTrips();
      const newTrip: Trip = { ...trip, id: Date.now().toString(), dataSaida: now, status: 'Em Viagem' };
      trips.push(newTrip);
      localStorage.setItem('frotas_data_v1', JSON.stringify(trips));
      return newTrip;
    } else {
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            action: 'saveTrip', 
            ...trip, 
            dataSaida: now 
          })
        });
        return { ...trip, id: 'temp-' + Date.now(), dataSaida: now, status: 'Em Viagem' };
      } catch (error) {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'saveTrip', 
            ...trip, 
            dataSaida: now 
          })
        });
        return { ...trip, id: 'temp-' + Date.now(), dataSaida: now, status: 'Em Viagem' };
      }
    }
  }

  async finishTrip(id: string, kmRetorno: number, updatedData?: Partial<Trip>): Promise<Trip> {
    const trips = await this.getTrips();
    const trip = trips.find(t => t.id === id);
    if (!trip) throw new Error('Viagem não encontrada');

    const now = new Date().toISOString();

    if (this.useMock) {
      const updatedTrip = {
        ...trip,
        ...updatedData, // Aplica motorista ou segurança se alterados
        kmRetorno,
        kmRodado: kmRetorno - trip.kmSaida,
        dataRetorno: now,
        status: 'Concluído' as const
      };
      const newTrips = trips.map(t => t.id === id ? updatedTrip : t);
      localStorage.setItem('frotas_data_v1', JSON.stringify(newTrips));
      return updatedTrip;
    } else {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'finishTrip', 
          veiculo: trip.veiculo,
          kmRetorno,
          dataRetorno: now,
          ...updatedData // Envia dados alterados para a planilha
        })
      });
      return { ...trip, status: 'Concluído' };
    }
  }
}

export const sheetsService = new SheetsService();
