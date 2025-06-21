import { useState, useEffect } from "react";
import axios from "axios";

type DadosAcaoTabela = {
  ticker: string;
  precoAbertura: number;
  precoFechamento: number;
  variacaoDia: number;
  precoMedio: number;
};

const TabelaAcoes = () => {
  const [dadosAcoes, setDadosAcoes] = useState<DadosAcaoTabela[]>([]);
  const [carregando, setCarregando] = useState(true);
  const CHAVE_API = "cvrrec9r01qnpem98r4gcvrrec9r01qnpem98r50";

  const ativos = [
    "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "NVDA", "JNJ", "JPM", "SBUX", "INTC", "EBAY", "CSCO", "NFLX", "AMD", "QCOM"
  ];

  const formatarNumero = (valor: number, casasDecimais: number = 2) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    });
  };

  const buscarDadosAcoes = async () => {
    try {
      const dados = await Promise.all(
        ativos.map(async (ticker) => {
          const resposta = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${CHAVE_API}`
          );
          
          if (resposta.data.c) {
            const precoMedio = (resposta.data.o + resposta.data.c) / 2;
            const variacaoDia = ((resposta.data.c - resposta.data.o) / resposta.data.o) * 100;

            return {
              ticker,
              precoAbertura: resposta.data.o,
              precoFechamento: resposta.data.c,
              variacaoDia,
              precoMedio,
            };
          }
          return null;
        })
      );

      setDadosAcoes(dados.filter(Boolean) as DadosAcaoTabela[]);
    } catch (erro) {
      console.error("Erro ao buscar dados das ações:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosAcoes();
  }, []);

  const determinarClasseVariacao = (variacao: number) => {
    if (variacao > 0) {
      return "variacao-positiva";
    } else if (variacao < 0) {
      return "variacao-negativa";
    } else {
      return "variacao-neutra";
    }
  };

  if (carregando) {
    return <div>Carregando dados das ações...</div>;
  }

  return (
    <div style={{ marginTop: "20px" }} className="tabela-acoes">
      <h3 className="titulo-tabela">Tabela de Ações</h3>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Preço de Abertura</th>
            <th>Preço de Fechamento</th>
            <th>Variação do Dia (%)</th>
            <th>Preço Médio</th>
          </tr>
        </thead>
        <tbody>
          {dadosAcoes.map((acao) => (
            <tr key={acao.ticker}>
              <td>{acao.ticker}</td>
              <td>$ {formatarNumero(acao.precoAbertura)}</td>
              <td>$ {formatarNumero(acao.precoFechamento)}</td>
              <td className={determinarClasseVariacao(acao.variacaoDia)}>
                {formatarNumero(acao.variacaoDia)}%
              </td>
              <td>$ {formatarNumero(acao.precoMedio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaAcoes;