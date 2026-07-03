import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // O nosso "carteiro"
import { Sprout } from 'lucide-react'; // Ícone

export default function Login() {
  // Estados do Login Normal
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Recuperação de Senha
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // 1. função de login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); 
    setErro('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('@AgroInsight:token', response.data.accessToken);
      navigate('/');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Falha ao iniciar sessão. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Função Solicitar Recuperação de Senha
  async function handleRecuperacaoSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, digite o seu e-mail no campo abaixo.' });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ tipo: '', texto: '' });
      
      // Chama a rota nova do seu Back-end
      await api.post('/auth/forgot-password', { email });

      setMensagem({ 
        tipo: 'sucesso', 
        texto: 'Se o e-mail existir em nossa base, as instruções de recuperação foram enviadas!' 
      });
    } catch (err: any) {
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Ocorreu um erro ao processar a solicitação. Tente novamente.' 
      });
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // RENDERIZAÇÃO: RECUPERAR SENHA (Ativado quando clica no botão)
  // =========================================================================
  if (modoRecuperacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-green-50 text-green-700 rounded-xl mx-auto">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recuperar palavra-passe</h2>
            <p className="text-sm text-gray-500">Introduza o e-mail da sua conta para receber as instruções.</p>
          </div>

          {/* Mensagens de Sucesso ou Erro na recuperação */}
          {mensagem.texto && (
            <div className={`p-3 text-sm rounded-lg text-center font-medium ${
              mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleRecuperacaoSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">E-mail</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="ex: joao@fazenda.com" 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" 
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-medium p-3 rounded-lg text-sm transition-colors"
            >
              {loading ? 'A enviar...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          {/* Botão de Voltar */}
          <div className="text-center pt-4 border-t border-gray-100 mt-4">
            <button 
              type="button"
              onClick={() => { setModoRecuperacao(false); setMensagem({ tipo: '', texto: '' }); setErro(''); }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar para Iniciar Sessão
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO: LOGIN NORMAL
  // =========================================================================
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

          {/* O NOVO BOTÃO DE ESQUECI A SENHA ESTÁ AQUI */}
          <div className="flex justify-end pt-1">
            <button 
              type="button"
              onClick={() => { setModoRecuperacao(true); setErro(''); setMensagem({ tipo: '', texto: '' }); }}
              className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors"
            >
              Esqueceu a palavra-passe?
            </button>
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

      </div>
    </div>
  );
}