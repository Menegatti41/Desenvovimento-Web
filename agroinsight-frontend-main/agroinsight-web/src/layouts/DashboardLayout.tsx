import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LayoutDashboard, Map as MapIcon, LogOut, Wheat, Brain, CalendarIcon } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Para sabermos em que página estamos e pintar o menu

  function handleLogout() {
    localStorage.removeItem('@AgroInsight:token');
    navigate('/login');
  }

  // Função simples para saber se o menu está ativo
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-green-900 text-white flex flex-col justify-between shadow-xl z-10">
        <div className="p-6">
          <div className="flex items-center space-x-3 text-2xl font-bold tracking-wide mb-10">
            <Sprout className="text-green-400 w-8 h-8" />
            <span>AgroInsight</span>
          </div>
          
          <nav className="space-y-3">
            <Link 
              to="/" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/') ? 'bg-green-800 text-white font-semibold' : 'text-green-200 hover:bg-green-800/50 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Visão Geral</span>
            </Link>
            
            <Link 
              to="/talhoes" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/talhoes') ? 'bg-green-800 text-white font-semibold' : 'text-green-200 hover:bg-green-800/50 hover:text-white'
              }`}
            >
              <MapIcon className="w-5 h-5" />
              <span>Meus Talhões</span>
            </Link>

            <Link 
              to="/safras" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/safras') ? 'bg-green-800 text-white font-semibold' : 'text-green-200 hover:bg-green-800/50 hover:text-white'
              }`}
            >
              <Wheat className="w-5 h-5" />
              <span>Safras / Culturas</span>
            </Link>

            <Link 
              to="/insights" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/insights') ? 'bg-green-800 text-white font-semibold' : 'text-green-200 hover:bg-green-800/50 hover:text-white'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>Insights e IA</span>
            </Link>

            <Link 
              to="/calendario" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/calendario') ? 'bg-green-800 text-white font-semibold' : 'text-green-200 hover:bg-green-800/50 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>Calendário Agrícola</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-green-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 text-green-300 hover:text-white transition w-full px-4 py-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO (Onde as páginas entram) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet /> 
      </main>
      
    </div>
  );
}