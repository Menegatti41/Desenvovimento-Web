import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { type Talhao } from '../types/agro';
import { MapPin, Plus, Loader2, Trash2 } from 'lucide-react';

export default function Talhoes() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');

  // Estados do Formulário de Criação
  const [nome, setNome] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Função para carregar talhões do backend
  async function carregarTalhoes() {
    try {
      setLoading(true);
      const response = await api.get('/talhoes');
      setTalhoes(response.data);
    } catch (err) {
      setErro('Erro ao carregar a lista de talhões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTalhoes();
  }, []);

  // Função para criar um novo talhão
  async function handleCriarTalhao(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSubmitting(true);

    try {
      const novoTalhao = {
        nome,
        areaHectares: Number(areaHectares),
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0
      };

      // Envia os dados para a rota POST /talhoes do seu backend
      await api.post('/talhoes', novoTalhao);

      // Limpa o formulário
      setNome('');
      setAreaHectares('');
      setLatitude('');
      setLongitude('');

      // Recarrega a lista atualizada
      carregarTalhoes();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar o talhão. Verifique os dados.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Talhões</h1>
        <p className="text-gray-500 mt-1">Registe e monitorize as áreas produtivas da sua fazenda.</p>
      </header>

      {erro && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Novo Talhão
          </h2>
          
          <form onSubmit={handleCriarTalhao} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome do Talhão</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Talhão Norte" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Área (Hectares)</label>
              <input 
                type="number" 
                step="any"
                required
                value={areaHectares}
                onChange={e => setAreaHectares(e.target.value)}
                placeholder="Ex: 45.5" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Latitude (Opcional)</label>
                <input 
                  type="number" 
                  step="any"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  placeholder="-23.54" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Longitude (Opcional)</label>
                <input 
                  type="number" 
                  step="any"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  placeholder="-46.63" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-medium p-2.5 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Talhão'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DOS TALHÕES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Áreas Registadas</h2>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center items-center text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-green-700" />
              <span>A atualizar talhões...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {talhoes.map((talhao) => (
                <div key={talhao.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-50 text-green-700 rounded-xl mt-1">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{talhao.nome}</h3>
                      <p className="text-sm text-gray-500 font-medium">Tamanho: <span className="text-gray-700">{talhao.areaHectares} ha</span></p>
                      {(talhao.latitude || talhao.longitude) && (
                        <p className="text-xs text-gray-400 mt-1">
                          Lat: {talhao.latitude} | Lng: {talhao.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {talhoes.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  Nenhum talhão encontrado para esta propriedade.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}