import { useState, useCallback } from 'react';
import apiClient from '../services/api';

export interface Simulation {
  id: number;
  userId: number;
  tipo: 'acao' | 'renda-fixa';
  nome: string;
  valor: number | null;
  invest_inicial: number;
  invest_mensal: number;
  meses: number;
  inflacao: number;
  createdAt: string;
  updatedAt: string;
}

export const useSimulations = () => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Simulation[]>('/get-Simulations'); 
      setSimulations(response.data);
    } catch (err: any) {
      console.error("Failed to fetch simulations:", err);
      setError(err.response?.data?.message || "Não foi possível carregar as simulações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSimulation = useCallback(async (simulationPayload: Omit<Simulation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<Simulation>('/log-Simulation', simulationPayload);
      
      setSimulations(prevSimulations => [response.data, ...prevSimulations]);

    } catch (err: any) {
      console.error("Failed to save simulation:", err);
      setError(err.response?.data?.message || "Não foi possível salvar a simulação.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    simulations, 
    isLoading, 
    error, 
    fetchSimulations, 
    addSimulation 
  };
};