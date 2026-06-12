import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Map as MapIcon, Wheat, Droplets } from 'lucide-react';
import { Talhao } from '../types/agro'; // O ficheiro de tipos que criámos antes

export default function VisaoGeral() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Vai buscar os dados ao back-end assim que a tela abre
  useEffect(() => {
    async function carregarDados() {
      try {
        // Acede à rota de talhões do seu backend
        const response = await api.get('/talhoes');
        setTalhoes(response.data);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar os dados da fazenda.');
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Resumo da Fazenda</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta! Aqui está a visão geral da sua propriedade.</p>
      </header>

      {erro && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {erro}
        </div>
      )}

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <MapIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Talhões</p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : talhoes.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
            <Wheat className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Safras Ativas</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Clima Atual</p>
            <p className="text-xl font-bold text-gray-800">Bom</p>
          </div>
        </div>
      </div>

      {/* LISTA DE TALHÕES VINDOS DO BACKEND */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Meus Talhões</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">A carregar os seus talhões...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {talhoes.map((talhao) => (
              <div key={talhao.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{talhao.nome}</h3>
                  <p className="text-sm text-gray-500">
                    Área: {talhao.areaHectares} hectares
                  </p>
                </div>
                <button className="text-green-600 hover:text-green-800 text-sm font-semibold">
                  Ver Detalhes ➔
                </button>
              </div>
            ))}
            
            {talhoes.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum talhão registado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}