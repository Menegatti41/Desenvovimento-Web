import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sprout } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Pega automaticamente o token que veio na URL da página
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (password !== confirmPassword) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!token) {
      setErro('Token de recuperação ausente ou inválido.');
      return;
    }

    try {
      setLoading(true);
      // Envia o token e a nova senha para o Back-end
      await api.post('/auth/reset-password', { token, newPassword: password });
      
      setSucesso('Sua senha foi alterada com sucesso! Redirecionando para o login...');
      
      // Espera 3 segundos e joga o usuário de volta para a tela de login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao redefinir a senha. Tente novamente.');
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
          <h2 className="text-2xl font-bold text-gray-900">Nova palavra-passe</h2>
          <p className="text-sm text-gray-500">Escolha uma nova senha segura para a sua conta.</p>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg text-center font-medium">
            {sucesso}
          </div>
        )}

        {!sucesso && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nova Senha</label>
              <input 
                type="password" 
                required 
                minLength={6}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600" 
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-medium p-3 rounded-lg text-sm transition-colors"
            >
              {loading ? 'A guardar...' : 'Alterar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}