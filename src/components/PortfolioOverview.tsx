import styles from './Portfolio.module.css';

export const PortfolioOverview = () => {
  const mockPortfolio = {
    totalValue: 12500.75,
    stocks: [
      { symbol: 'AAPL', shares: 10, avgPrice: 150.25 },
      { symbol: 'MSFT', shares: 5, avgPrice: 250.50 }
    ]
  };

  return (
    <div className={styles.portfolioContainer}>
      <div className={styles.portfolioSummary}>
        <h3>Valor Total do Portfólio</h3>
        <p className={styles.portfolioValue}>
          ${mockPortfolio.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className={styles.assetsList}>
        <h4>Seus Ativos</h4>
        <table className={styles.assetsTable}>
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Quantidade</th>
              <th>Preço Médio</th>
              <th>Valor Investido</th>
            </tr>
          </thead>
          <tbody>
            {mockPortfolio.stocks.map((stock) => (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>
                <td>{stock.shares}</td>
                <td>${stock.avgPrice.toFixed(2)}</td>
                <td>${(stock.shares * stock.avgPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};