import { Simulador } from "./components/Simulador";
import { useAuth } from './auth/AuthContext';
import { UserDashboard } from "./components/UserDashboard";
import "./index.css";
import "./App.css";

function App() {
  const { user, logout } = useAuth();
  if (!user) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Erro: Usuário não autenticado. Redirecionando...</div>;
  }

  return (
    <>
      <header>
        <nav className="conteiner">
          <div className="logo">
            <a href="/">Simula<span>Invest</span></a>
          </div>
          <div className="user-actions">
            <span>Olá, {user.name}!</span>
            <button onClick={logout} className="botao botao-secundario">
              Sair
            </button>
          </div>
        </nav>
      </header>
      <main className="conteiner" style={{ paddingTop: '80px', paddingBottom: '2rem' }}>
        <h1 className="titulo-destaque" style={{textAlign: 'center', marginBottom: '2rem'}}>
          Bem-vindo(a) ao SimulaInvest, {user.name}!
        </h1>
        <Simulador />
        <UserDashboard />
      </main>
    </>
  );
}

export default App;