import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../services/api';
import styles from './Dashboard.module.css';
import { PortfolioOverview } from './PortfolioOverview';
import { Loader } from './Loader';

interface BackendSimulation {
  id: number;
  userId: string;
  tipo: 'acao' | 'renda-fixa';
  nome: string;
  valor?: number | null;
  invest_inicial: number;
  invest_mensal: number;
  meses: number;
  inflacao: number;
  createdAt: string;
}

const formatCurrency = (value: number) => 
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const UserDashboard: React.FC = () => {
  const { user } = useAuth(); 
  const [activeTab, setActiveTab] = useState<'historico' | 'investimentos'>('historico');
  const [simulations, setSimulations] = useState<BackendSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<BackendSimulation[]>('/get-Simulations');
      const sortedSimulations = response.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSimulations(sortedSimulations);
    } catch (err: any) {
      console.error("Erro ao buscar histórico de simulações:", err);
      setError(err.response?.data?.message || "Não foi possível carregar o histórico.");
      setSimulations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]); 

  useEffect(() => {
    if (user && activeTab === 'historico') {
      fetchSimulations();
    }
  }, [user, activeTab, fetchSimulations]);

  const handleDeleteSimulation = async (simulationId: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete('/delete-Simulation', { data: { simulationId } });
      await fetchSimulations();
    } catch (err: any) {
      console.error("Erro ao deletar simulação:", err);
      setError(err.response?.data?.message || "Falha ao deletar simulação.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) {
    return <p>Por favor, realize o login para acessar seu painel.</p>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardTitle}>Seu Painel, {user.name}</h2>
      <nav className={styles.dashboardNav}>
        <button
          className={`${styles.navButton} ${activeTab === 'historico' ? styles.active : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico de Simulações
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'investimentos' ? styles.active : ''}`}
          onClick={() => setActiveTab('investimentos')}
        >
          Meu Portfólio <span className={styles.wipTag}>(Em Breve)</span>
        </button>
      </nav>

      <div className={styles.dashboardContent}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        {activeTab === 'historico' && (
          isLoading ? <Loader /> :
          <div className={styles.historySection}>
            <h3>Suas Simulações Salvas</h3>
            {simulations.length > 0 ? (
              <ul className={styles.simulationList}>
                {simulations.map((sim) => (
                  <SimulationCard 
                    key={sim.id} 
                    simulation={sim} 
                    onDelete={handleDeleteSimulation}
                  />
                ))}
              </ul>
            ) : (
              <p className={styles.emptyMessage}>Você ainda não tem simulações salvas.</p>
            )}
          </div>
        )}

        {activeTab === 'investimentos' && (
          <div className={styles.investmentsSection}>
            <PortfolioOverview />
            <p style={{textAlign: 'center', marginTop: '1rem', color: 'var(--cor-cinza)'}}>
              <i>A funcionalidade de "Meu Portfólio" para acompanhar seus investimentos reais (ou simulados de forma persistente) está em desenvolvimento.</i>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SimulationCard: React.FC<{ simulation: BackendSimulation, onDelete: (id: number) => void }> = ({ simulation, onDelete }) => {
  const { id, tipo, nome, valor, invest_inicial, invest_mensal, meses, inflacao, createdAt } = simulation;
  return (
    <li className={styles.simulationCard}>
      <div className={styles.simulationInfo}>
        <strong className={styles.simulationTitle}>
          {tipo === 'acao' ? `Ação: ${nome}` : `Renda Fixa: ${nome}`}
          {tipo === 'acao' && typeof valor === 'number' ? ` (Preço Log: ${formatCurrency(valor)})` : ''}
        </strong>
        <span>Data: {new Date(createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <span>Invest. Inicial: {formatCurrency(invest_inicial)}</span>
        <span>Invest. Mensal: {formatCurrency(invest_mensal)}</span>
        <span>Período: {meses} meses</span>
        <span>Inflação Anual Usada: {(inflacao * 100).toFixed(1)}%</span>
      </div>
      <button 
        onClick={() => onDelete(id)}
        className={styles.deleteButton}
        aria-label={`Excluir simulação ${nome}`}
      >
        Excluir
      </button>
    </li>
  );
};