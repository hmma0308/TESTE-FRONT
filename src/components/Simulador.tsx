import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Scroll } from "./Scroll";
import Grafico from "./Grafico";
import PrecoAcao from "./PrecoAcao";
import { Loader } from "./Loader";
import { useSimulations } from '../hooks/useSimulations';

interface ValoresSimulador {
  inicial: string;
  mensal: string;
  meses: number;
  inflacao: string;
  tipoInvestimento: 'acao' | 'renda-fixa';
  tipoRendaFixa: string;
}

interface ResultadosSimulacao {
  valorFuturoBruto: number;
  totalInvestido: number;
  retornoBruto: number;
  valorAjustadoPelaInflacao: number;
}

interface DadosCrescimentoAcao {
  avgMonthlyGrowth: number;
  success: boolean;
  error?: string;
}

const taxasRetornoRendaFixa: Record<string, number> = {
  cdb: 0.008,
  "tesouro-direto": 0.007,
  lci: 0.0075,
  lca: 0.0075,
  poupanca: 0.005,
};

const FALLBACK_ACAO_MONTHLY_GROWTH = 0.01;

export const Simulador: React.FC = () => {
  const { 
    simulations,
    isLoading: isHookLoading,
    error: hookError,
    fetchSimulations,
    addSimulation 
  } = useSimulations();

  const [valores, setValores] = useState<ValoresSimulador>({
    inicial: "1000,00",
    mensal: "100,00",
    meses: 12,
    inflacao: "5,0",
    tipoInvestimento: "acao",
    tipoRendaFixa: "cdb",
  });

  const [simboloAcaoSelecionado, setSimboloAcaoSelecionado] = useState("AAPL");
  const [precoAtualAcaoParaLog, setPrecoAtualAcaoParaLog] = useState<number | null>(null);
  const [resultados, setResultados] = useState<ResultadosSimulacao | null>(null);
  const [dadosGrafico, setDadosGrafico] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setValores((prev) => ({ ...prev, [id]: value }));
    setResultados(null);
    setDadosGrafico({ labels: [], values: [] });
  };
  
  const stringParaFloat = (valor: string): number => {
    return parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0;
  };

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const obterDadosCrescimentoAcao = async (symbol: string): Promise<DadosCrescimentoAcao> => {
    const API_KEY_TWELVE_DATA = import.meta.env.VITE_TWELVEDATA_API_KEY;
    const interval = "1month";
    const outputsize = 24;

    if (!API_KEY_TWELVE_DATA) {
      console.error("TwelveData API key (VITE_TWELVEDATA_API_KEY) is missing from .env file.");
      return { 
        avgMonthlyGrowth: FALLBACK_ACAO_MONTHLY_GROWTH, 
        success: false, 
        error: "API key configuration error." 
      };
    }

    try {
      const response = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${symbol.trim().toUpperCase()}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY_TWELVE_DATA}`
      );

      const data = response.data;

      if (data?.values?.length > 1) {
        const closes: number[] = data.values
          .map((entry: { close: string }) => parseFloat(entry.close))
          .reverse(); 

        let monthlyGrowths: number[] = [];
        for (let i = 0; i < closes.length - 1; i++) {
          if (closes[i] !== 0) {
            monthlyGrowths.push((closes[i + 1] - closes[i]) / closes[i]);
          }
        }

        if (monthlyGrowths.length === 0) {
          console.warn(`Not enough valid data points for ${symbol} to calculate growth. Using fallback.`);
          return { 
            avgMonthlyGrowth: FALLBACK_ACAO_MONTHLY_GROWTH, 
            success: false, 
            error: `Not enough valid data points for ${symbol} to calculate growth.`
          };
        }

        const averageMonthlyGrowth = monthlyGrowths.reduce((sum, growth) => sum + growth, 0) / monthlyGrowths.length;
        
        if (isNaN(averageMonthlyGrowth) || !isFinite(averageMonthlyGrowth)) {
          console.warn(`Calculated average monthly growth for ${symbol} is NaN or infinite. Using fallback. Monthly growths:`, monthlyGrowths);
          return { 
              avgMonthlyGrowth: FALLBACK_ACAO_MONTHLY_GROWTH, 
              success: false, 
              error: `Invalid growth calculation for ${symbol}.`
          };
        }

        return { 
          avgMonthlyGrowth: averageMonthlyGrowth, 
          success: true 
        };
      }
      
      console.warn(`No sufficient time series data found for ${symbol} from TwelveData. Using fallback. Response status: ${data?.status || 'N/A'}, Code: ${data?.code || 'N/A'}`);
      return { 
        avgMonthlyGrowth: FALLBACK_ACAO_MONTHLY_GROWTH, 
        success: false, 
        error: data?.message || `No time series data found for ${symbol}.`
      };

    } catch (error: any) {
      console.error(`TwelveData API request error for ${symbol}:`, error.response?.data || error.message);
      let errorMessage = "Falha ao buscar dados de crescimento da ação.";
      if(error.response?.data?.message) {
          errorMessage = error.response.data.message;
      } else if (error.message) {
          errorMessage = error.message;
      }
      return { 
        avgMonthlyGrowth: FALLBACK_ACAO_MONTHLY_GROWTH, 
        success: false, 
        error: errorMessage
      };
    }
  };

  const handleCalcularEsalvar = async () => {
    setIsCalculating(true);
    setCalculationError(null);
    setResultados(null);
    setDadosGrafico({ labels: [], values: [] });

    try {
      const { inicial, mensal, meses: numMeses, inflacao, tipoInvestimento, tipoRendaFixa } = valores;
      const investimentoInicial = stringParaFloat(inicial);
      const contribuicaoMensal = stringParaFloat(mensal);
      const inflacaoAnualDecimal = stringParaFloat(inflacao) / 100;
      let taxaMensalEstimada: number;
      let nomeAtivoParaLog = tipoInvestimento === "acao" ? simboloAcaoSelecionado : tipoRendaFixa;

      if (tipoInvestimento === "acao") {
        const dadosCrescimento = await obterDadosCrescimentoAcao(simboloAcaoSelecionado);
        taxaMensalEstimada = dadosCrescimento.avgMonthlyGrowth;
        if (!dadosCrescimento.success) {
          setCalculationError(dadosCrescimento.error || `Falha ao obter taxa para ${simboloAcaoSelecionado}.`);
        }
      } else {
        taxaMensalEstimada = taxasRetornoRendaFixa[tipoRendaFixa] || 0.005;
      }

      let valorAcumulado = investimentoInicial;
      let totalInvestidoCalculado = investimentoInicial;
      const labelsParaGrafico: string[] = ["Mês 0"];
      const valoresParaGrafico: number[] = [parseFloat(valorAcumulado.toFixed(2))];

      for (let i = 1; i <= numMeses; i++) {
        if (i > 1 || investimentoInicial === 0) valorAcumulado += contribuicaoMensal;
        valorAcumulado *= (1 + taxaMensalEstimada);
        labelsParaGrafico.push(`Mês ${i}`);
        valoresParaGrafico.push(parseFloat(valorAcumulado.toFixed(2)));
      }
      totalInvestidoCalculado = investimentoInicial + (contribuicaoMensal * numMeses);

      const valorFuturoBruto = valorAcumulado;
      const retornoBruto = valorFuturoBruto - totalInvestidoCalculado;
      const valorAjustadoPelaInflacao = valorFuturoBruto / Math.pow(1 + inflacaoAnualDecimal, numMeses / 12);

      setResultados({ valorFuturoBruto, totalInvestido: totalInvestidoCalculado, retornoBruto, valorAjustadoPelaInflacao });
      setDadosGrafico({ labels: labelsParaGrafico, values: valoresParaGrafico });

      const simulationPayload = {
        tipo: tipoInvestimento,
        nome: nomeAtivoParaLog,
        valor: tipoInvestimento === "acao" ? precoAtualAcaoParaLog : null,
        invest_inicial: investimentoInicial,
        invest_mensal: contribuicaoMensal,
        meses: Number(numMeses),
        inflacao: inflacaoAnualDecimal,
      };

      await addSimulation(simulationPayload);

    } catch (error: any) {
      console.error("Falha ao calcular ou salvar:", error);
      if(!calculationError) {
         setCalculationError("Ocorreu um erro. Verifique os logs ou tente novamente.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePrecoAcaoSymbolChange = (novoSimbolo: string, precoAtual: number | null) => {
    setSimboloAcaoSelecionado(novoSimbolo);
    setPrecoAtualAcaoParaLog(precoAtual);
  };

  return (
    <section id="simulador" className="simulador">
      <h2 className="titulo-simulador">Simulador de Investimentos</h2>
      
      {(calculationError || hookError) && (
        <div className="mensagem-erro" style={{ color: "red", textAlign: "center", margin: "1rem 0" }}>
            {calculationError || hookError}
        </div>
      )}
      
      <form className="formulario-simulador" onSubmit={(e) => e.preventDefault()}>
        <div className="grupo-formulario">
          <label htmlFor="inicial">Investimento Inicial (R$)</label>
          <input type="text" id="inicial" value={valores.inicial} onChange={handleInputChange} placeholder="Ex: 1.000,00"/>
        </div>
        <div className="grupo-formulario">
          <label htmlFor="mensal">Contribuição Mensal (R$)</label>
          <input type="text" id="mensal" value={valores.mensal} onChange={handleInputChange} placeholder="Ex: 100,00"/>
        </div>
        <div className="grupo-formulario">
          <label htmlFor="meses">Período (Meses)</label>
          <input type="number" id="meses" value={valores.meses} min="1" max="600" onChange={handleInputChange} />
        </div>
        <div className="grupo-formulario">
          <label htmlFor="inflacao">Inflação Anual Estimada (%)</label>
          <input type="text" id="inflacao" value={valores.inflacao} onChange={handleInputChange} placeholder="Ex: 5,0"/>
        </div>
        <div className="grupo-formulario">
          <label htmlFor="tipoInvestimento">Tipo de Investimento</label>
          <select id="tipoInvestimento" value={valores.tipoInvestimento} onChange={handleInputChange}>
            <option value="acao">Ações</option>
            <option value="renda-fixa">Renda Fixa</option>
          </select>
        </div>

        {valores.tipoInvestimento === "acao" && (
          <div className="grupo-formulario">
            <label>Símbolo da Ação (Ex: AAPL, MGLU3.SA)</label>
            <PrecoAcao onSimboloChange={handlePrecoAcaoSymbolChange} />
          </div>
        )}

        {valores.tipoInvestimento === "renda-fixa" && (
          <div className="grupo-formulario">
            <label htmlFor="tipoRendaFixa">Opção de Renda Fixa</label>
            <select id="tipoRendaFixa" value={valores.tipoRendaFixa} onChange={handleInputChange}>
              {Object.keys(taxasRetornoRendaFixa).map((key) => (
                <option key={key} value={key}>{key.toUpperCase().replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>
        )}
      </form>

      <Scroll
        href="#simulador-resultados"
        className={`botao botao-primario ${(isCalculating || isHookLoading) ? "botao-desabilitado" : ""}`}
        style={{ display: "block", width: "fit-content", margin: "2rem auto", textAlign: "center" }}
        onClick={!(isCalculating || isHookLoading) ? handleCalcularEsalvar : undefined}
      >
        {(isCalculating || isHookLoading) ? <Loader /> : "Calcular e Salvar Resultados"}
      </Scroll>

      {resultados && (
        <div id="simulador-resultados" className="resultados">
          <div className="cartao-resultado">
            <div className="valor-resultado">{formatarMoeda(resultados.totalInvestido)}</div>
            <div className="rotulo-resultado">Total Investido</div>
          </div>
          <div className="cartao-resultado">
            <div className="valor-resultado">{formatarMoeda(resultados.retornoBruto)}</div>
            <div className="rotulo-resultado">Retornos Brutos</div>
          </div>
          <div className="cartao-resultado">
            <div className="valor-resultado">{formatarMoeda(resultados.valorFuturoBruto)}</div>
            <div className="rotulo-resultado">Valor Futuro Bruto</div>
          </div>
          <div className="cartao-resultado">
            <div className="valor-resultado">{formatarMoeda(resultados.valorAjustadoPelaInflacao)}</div>
            <div className="rotulo-resultado">Valor Futuro (Ajustado p/ Inflação)</div>
          </div>
        </div>
      )}

      {dadosGrafico.values.length > 0 && (
        <div className="grafico" style={{marginTop: "2rem"}}>
          <Grafico dados={dadosGrafico} />
        </div>
      )}

      <div className="saved-simulations" style={{marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #eee"}}>
        <h3 style={{textAlign: "center"}}>Simulações Salvas</h3>
        {isHookLoading && simulations.length === 0 && <p style={{textAlign: "center"}}>Carregando histórico...</p>}
        {simulations.length > 0 ? (
          <ul style={{listStyle: "none", padding: 0}}>
            {simulations.map(sim => (
              <li key={sim.id} style={{background: "#f9f9f9", border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "5px"}}>
                <strong>{sim.nome.toUpperCase()}</strong> - Investimento Inicial: {formatarMoeda(sim.invest_inicial)} - 
                Salvo em: {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
              </li>
            ))}
          </ul>
        ) : (
          !isHookLoading && <p style={{textAlign: "center"}}>Nenhuma simulação salva encontrada.</p>
        )}
      </div>

    </section>
  );
};