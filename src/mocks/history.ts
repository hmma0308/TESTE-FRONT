export const mockHistory = [
  {
    id: '1',
    userId: 'mock-user-id',
    symbol: 'AAPL',
    amount: 1000,
    months: 12,
    date: '2023-05-15',
    result: 1250.50
  },
  {
    id: '2',
    userId: 'mock-user-id',
    symbol: 'TSLA',
    amount: 2500,
    months: 24,
    date: '2023-06-20',
    result: 3120.75
  }
];
export const saveSimulationMock = (data: any) => {
  console.log('Simulação salva (mock):', data);
  return Promise.resolve({ success: true });
};