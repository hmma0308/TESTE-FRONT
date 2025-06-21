import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

type DadosAcao = {
  simbolo: string;
  precoAtual: number;
  ultimaAtualizacao: number;
};

const CHAVE_API_FINNHUB = import.meta.env.VITE_FINNHUB_API_KEY || "cvrrec9r01qnpem98r4gcvrrec9r01qnpem98r50";
interface PrecoAcaoProps {
  onSimboloChange: (simbolo: string, precoAtual: number | null) => void;
  initialSimbolo?: string;
}

const PrecoAcao: React.FC<PrecoAcaoProps> = ({
  onSimboloChange,
  initialSimbolo = "AAPL"
}) => {
  const [currentSimbolo, setCurrentSimbolo] = useState(initialSimbolo);
  const [dadosAcao, setDadosAcao] = useState<DadosAcao | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputSimbolo, setInputSimbolo] = useState(initialSimbolo);

  const buscarPrecoAcao = useCallback(async (symbolToFetch: string) => {
    const trimmedSymbol = symbolToFetch.trim().toUpperCase();
    if (!trimmedSymbol || trimmedSymbol.length > 10) {
      onSimboloChange(trimmedSymbol, null);
      setDadosAcao(null);
      return;
    }

    setIsLoading(true);
    try {
      const resposta = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${trimmedSymbol}&token=${CHAVE_API_FINNHUB}`
      );

      if (resposta.data.c && resposta.data.c !== 0) {
        const newDadosAcao = {
          simbolo: trimmedSymbol,
          precoAtual: resposta.data.c,
          ultimaAtualizacao: resposta.data.t * 1000,
        };
        setDadosAcao(newDadosAcao);
        onSimboloChange(newDadosAcao.simbolo, newDadosAcao.precoAtual);
      } else {
        setDadosAcao(null);
        onSimboloChange(trimmedSymbol, null);
        console.warn(`Nenhum dado de preço encontrado para ${trimmedSymbol}`);
      }
    } catch (erro) {
      console.error(`Erro ao buscar dados da ação (${trimmedSymbol}):`, erro);
      setDadosAcao(null);
      onSimboloChange(trimmedSymbol, null);
    } finally {
      setIsLoading(false);
    }
  }, [onSimboloChange]);

  useEffect(() => {
    if (currentSimbolo) {
        buscarPrecoAcao(currentSimbolo);
    }
  }, [currentSimbolo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputSimbolo.trim().toUpperCase() !== currentSimbolo) {
         setCurrentSimbolo(inputSimbolo.trim().toUpperCase());
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [inputSimbolo, currentSimbolo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSimbolo(e.target.value);
  };
  
  const handleButtonClick = () => {
    const symbolToSearch = inputSimbolo.trim().toUpperCase();
    setCurrentSimbolo(symbolToSearch);
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: 'center' }}>
        <input
          type="text"
          value={inputSimbolo}
          onChange={handleInputChange}
          placeholder="Símbolo (ex: AAPL)"
          style={{ padding: "8px", flex: 1, borderRadius: "4px", border: "1px solid #ccc" }}
          aria-label="Símbolo da Ação"
        />
        <button
          onClick={handleButtonClick}
          disabled={isLoading || inputSimbolo.trim().length === 0 || inputSimbolo.trim().length > 10}
          style={{
            padding: "8px 12px",
            backgroundColor: isLoading ? "#ccc" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "Busc..." : "Buscar"}
        </button>
      </div>

      {!isLoading && dadosAcao && (
        <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
          <div>
            <strong>{dadosAcao.simbolo}</strong>: R$
            {dadosAcao.precoAtual.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div style={{ fontSize: "0.8em", color: "#6b7280" }}>
            Última atualização:{" "}
            {new Date(dadosAcao.ultimaAtualizacao).toLocaleString("pt-BR")}
          </div>
        </div>
      )}
       {!isLoading && !dadosAcao && inputSimbolo.trim() && currentSimbolo === inputSimbolo.trim().toUpperCase() && (
         <div style={{ marginTop: "10px", fontSize: "0.9em", color: "#ef4444" }}>
            Nenhum dado encontrado para {inputSimbolo.trim().toUpperCase()} ou símbolo inválido.
        </div>
      )}
    </div>
  );
};

export default PrecoAcao;