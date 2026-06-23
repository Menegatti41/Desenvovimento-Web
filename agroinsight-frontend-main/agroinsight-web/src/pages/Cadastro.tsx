import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Mail, Lock, UserPlus, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Cadastro() {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados de controle da interface
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
  e.preventDefault();
  setErro('');
  
  if (senha !== confirmarSenha) {
    return setErro('As senhas digitadas não coincidem.');
  }

  if (senha.length < 6) {
    return setErro('A senha deve conter pelo menos 6 caracteres.');
  }

  try {
    setLoading(true);
    
    // MUDANÇA AQUI: Ajustado o endpoint para '/auth/register'
    // e mapeado 'name' e 'password' exatamente como o Back-end espera
    await api.post('/auth/register', {
      name: nome,        // Envia o estado 'nome' dentro da chave 'name'
      email: email,      // Envia o e-mail
      password: senha    // Envia o estado 'senha' dentro da chave 'password'
    });

    setSucesso(true);
    
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');

    setTimeout(() => {
      navigate('/login');
    }, 3000);

  } catch (err: any) {
    console.error('Erro ao cadastrar usuário:', err);
    const mensagemErro = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Não foi possível realizar o cadastro. Tente novamente.';
    setErro(mensagemErro);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      
      {/* Botão para voltar ao login de forma simples */}
      <div className="w-full max-w-md mb-4 flex justify-start">
        <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Login
        </Link>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Cabeçalho do Card */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-50 rounded-xl flex justify-center items-center text-green-700 mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Criar Nova Conta</h2>
          <p className="text-sm text-gray-400 mt-1">Cadastre-se para começar a gerir as suas safras e talhões.</p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm font-medium border border-red-100">
            {erro}
          </div>
        )}

        {/* Alerta de Sucesso */}
        {sucesso && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100 flex items-start gap-2 animate-pulse">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Conta criada com sucesso!</p>
              <p className="text-xs text-green-600 mt-0.5">A redirecionar para a página de acesso...</p>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleCadastro} className="space-y-4">
          
          {/* Campo Nome */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nome Completo</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text"
                required
                disabled={loading || sucesso}
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email"
                required
                disabled={loading || sucesso}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="joao@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password"
                required
                disabled={loading || sucesso}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Campo Confirmar Senha */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Confirmar Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password"
                required
                disabled={loading || sucesso}
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading || sucesso}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 mt-2 cursor-pointer shadow-sm shadow-green-700/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Concluir Cadastro'}
          </button>
        </form>

        {/* Link para quem já tem conta */}
        <div className="text-center pt-2 border-t border-gray-100 text-sm">
          <span className="text-gray-400">Já possui uma conta? </span>
          <Link to="/login" className="font-semibold text-green-700 hover:text-green-800 transition-colors">
            Aceder aqui
          </Link>
        </div>

      </div>
    </div>
  );
}