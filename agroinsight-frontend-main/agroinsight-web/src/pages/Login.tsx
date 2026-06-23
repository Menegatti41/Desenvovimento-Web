import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // O nosso "carteiro"
import { Sprout } from 'lucide-react'; // Ícone
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); // Evita que a página recarregue
    setErro('');
    setLoading(true);

    try {
      // Faz o pedido ao backend (controllers/authController.js)
      const response = await api.post('/auth/login', { email, password });
      
      // Guarda o Token devolvido pelo backend no navegador
      localStorage.setItem('@AgroInsight:token', response.data.accessToken);
      
      // Redireciona para o Dashboard (rota '/')
      navigate('/');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Falha ao iniciar sessão. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-green-50 text-green-700 rounded-xl mx-auto">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">AgroInsight</h2>
          <p className="text-sm text-gray-500">Introduza as suas credenciais para aceder</p>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">E-mail</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ex: joao@fazenda.com" 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Palavra-passe</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-medium p-3 rounded-lg text-sm transition-colors"
          >
            {loading ? 'A verificar...' : 'Iniciar Sessão'}
          </button>
        </form>
        <div className="text-center pt-4 border-t border-gray-100 text-sm mt-4">
          <span className="text-gray-400">Não possui uma conta? </span>
          <Link to="/cadastro" className="font-semibold text-green-700 hover:text-green-800 transition-colors">
            Cadastre-se aqui
          </Link>
        </div>

        <div className="text-xs text-center text-gray-400 mt-4">
          <p>Para testar: <b>joao@fazenda.com</b> | Senha: <b>123456</b></p>
        </div>
      </div>
    </div>
  );
}