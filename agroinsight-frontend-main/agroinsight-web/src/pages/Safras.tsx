import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { type Talhao, type Safra } from '../types/agro';
import { Wheat, Plus, Loader2, Calendar } from 'lucide-react';

export default function Safras() {
  const [safras, setSafras] = useState<Safra[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [culturas, setCulturas] = useState<string[]>([]); // Armazena as culturas vindas do Back-end
  const [loadingTalhoes, setLoadingTalhoes] = useState(true);
  const [loadingSafras, setLoadingSafras] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');

  // Estados do Formulário de Safra
  const [talhaoSelecionadoId, setTalhaoSelecionadoId] = useState('');
  const [cultura, setCultura] = useState('');
  const [variedade, setVariedade] = useState('');
  const [dataSemeadura, setDataSemeadura] = useState('');
  const [status, setStatus] = useState<'planejada' | 'em_andamento' | 'colhida'>('em_andamento');

  // 1. Carrega os talhões e a lista de culturas do back-end ao abrir a tela
  useEffect(() => {
    async function inicializarDados() {
      try {
        setLoadingTalhoes(true);
        setErro('');
        
        // Chamada em paralelo para otimizar o carregamento
        const [resTalhoes, resCulturas] = await Promise.all([
          api.get('/talhoes'),
          api.get('/safras/culturas-suportadas')
        ]);

        setTalhoes(resTalhoes.data);
        if (resTalhoes.data.length > 0) {
          setTalhaoSelecionadoId(resTalhoes.data[0].id.toString());
        }

        // Armazena as culturas do back-end e define a primeira como padrão
        setCulturas(resCulturas.data);
        if (resCulturas.data.length > 0) {
          setCultura(resCulturas.data[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
        setErro('Erro ao carregar as informações do servidor.');
        
        // Fallback de segurança para o usuário não ficar sem opções caso a rota falhe
        const fallback = ['Soja', 'Milho', 'Trigo'];
        setCulturas(fallback);
        setCultura(fallback[0]);
      } finally {
        setLoadingTalhoes(false);
      }
    }
    inicializarDados();
  }, []);

  // 2. Carrega as safras SEMPRE que o talhão selecionado mudar
  async function carregarSafrasDoTalhao(id: string) {
    if (!id) return;
    try {
      setLoadingSafras(true);
      setErro('');
      const response = await api.get(`/talhoes/${id}/safras`);
      setSafras(response.data);
    } catch (err) {
      setSafras([]); // Se der 404 ou não houver safras, zera a lista amigavelmente
    } finally {
      setLoadingSafras(false);
    }
  }

  useEffect(() => {
    if (talhaoSelecionadoId) {
      carregarSafrasDoTalhao(talhaoSelecionadoId);
    }
  }, [talhaoSelecionadoId]);

  async function handleAlterarStatusSafra(safraId: number, novoStatus: 'planejada' | 'em_andamento' | 'colhida') {
    try {
      setSubmitting(true);
      let payload: any = { status: novoStatus };

      if (novoStatus === 'colhida') {
        const valorReal = prompt("Colheita iniciada! Digite a produtividade REAL alcançada (em sc/ha):", "72");
        if (valorReal === null) return; // Se cancelou, interrompe
        payload.produtividadeReal = Number(valorReal) || 0;
      }

      await api.put(`/safras/${safraId}`, payload);
      
      if (talhaoSelecionadoId) {
        carregarSafrasDoTalhao(talhaoSelecionadoId);
      }
    } catch (err) {
      console.error('Erro ao atualizar status da safra:', err);
      setErro('Não foi possível atualizar o estado desta safra.');
    } finally {
      setSubmitting(false);
    }
  }

  // 3. Cria uma nova safra atrelada ao talhão correto
  async function handleCriarSafra(e: React.FormEvent) {
    e.preventDefault();
    if (!talhaoSelecionadoId) return setErro('Selecione um talhão primeiro.');
    
    setErro('');
    setSubmitting(true);

    const dataFormatada = new Date(dataSemeadura + 'T12:00:00Z');

    try {
      const novaSafra = {
        talhaoId: Number(talhaoSelecionadoId),
        cultura,
        variedade,
        dataSemeadura: dataFormatada,
        status: status
      };

      await api.post('/safras', novaSafra);

      setVariedade('');
      setDataSemeadura('');
      carregarSafrasDoTalhao(talhaoSelecionadoId);
    } catch (err: any) {
      console.log('Erro na tentativa 1, tentando rota alternativa...', err.response?.data);
      
      try {
        const novaSafraAlternativa = {
          cultura,
          variedade,
          dataSemeadura: dataFormatada,
          status: status
        };
        
        await api.post(`/talhoes/${talhaoSelecionadoId}/safras`, novaSafraAlternativa);
        
        setVariedade('');
        setDataSemeadura('');
        carregarSafrasDoTalhao(talhaoSelecionadoId);
      } catch (errorInner: any) {
        console.error('Erro detalhado do servidor:', errorInner.response?.data);
        const mensagemErro = errorInner.response?.data?.message || 
                             errorInner.response?.data?.error ||
                             'Erro 400: Dados incompatíveis com o servidor.';
        setErro(`Erro ao registar a safra: ${mensagemErro}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function obterNomeTalhao(id: number) {
    const t = talhoes.find(item => item.id === id);
    return t ? t.nome : `Talhão #${id}`;
  }

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Acompanhamento de Safras</h1>
        <p className="text-gray-500 mt-1">Selecione um talhão para gerir e visualizar os seus ciclos de plantação.</p>
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
            Nova Safra
          </h2>
          
          <form onSubmit={handleCriarSafra} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Selecionar Talhão</label>
              <select 
                value={talhaoSelecionadoId}
                onChange={e => setTalhaoSelecionadoId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-green-600"
              >
                {loadingTalhoes ? (
                  <option>A carregar talhões...</option>
                ) : (
                  talhoes.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.areaHectares} ha)</option>
                  ))
                )}
                {!loadingTalhoes && talhoes.length === 0 && <option value="">Nenhum talhão cadastrado</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cultura</label>
              
              {/* SELECT DINÂMICO CONECTADO COM O BACK-END */}
              <select 
                value={cultura}
                onChange={e => setCultura(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-green-600"
              >
                {culturas.length === 0 ? (
                  <option>Carregando culturas...</option>
                ) : (
                  culturas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Variedade / Híbrido</label>
              <input 
                type="text" 
                required
                value={variedade}
                onChange={e => setVariedade(e.target.value)}
                placeholder="Ex: M8372 IPRO ou Pioneer" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data de Semeadura</label>
              <input 
                type="date" 
                required
                value={dataSemeadura}
                onChange={e => setDataSemeadura(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado da Safra</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-green-600"
              >
                <option value="planejada">Planeada (Planejada)</option>
                <option value="em_andamento">Ativa (Em Andamento)</option>
                <option value="colhida">Colhida</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Produtividade Est. (sc/ha)</label>
              <input 
                type="number" 
                name="produtividadeEstimada"
                placeholder="Ex: 75"
                defaultValue="70"
                className="border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-green-700"
              />
            </div>

            <button 
              type="submit"
              disabled={submitting || talhoes.length === 0}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-medium p-2.5 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registar Safra'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DAS SAFRAS DO TALHÃO SELECIONADO */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Ciclos em: <span className="text-green-700">{loadingTalhoes ? '...' : obterNomeTalhao(Number(talhaoSelecionadoId))}</span>
            </h2>
          </div>

          {loadingSafras ? (
            <div className="p-12 flex justify-center items-center text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-green-700" />
              <span>A carregar ciclos de cultivo...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {safras.map((safra) => (
                <div key={safra.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-yellow-50 text-yellow-700 rounded-xl mt-1">
                      <Wheat className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 text-lg">{safra.cultura} - {safra.variedade}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          (safra.status as string) === 'em_andamento' || (safra.status as string) === 'ativo' ? 'bg-green-100 text-green-800' : 
                          (safra.status as string) === 'planejada' || (safra.status as string) === 'planejado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(safra.status as string) === 'em_andamento' || (safra.status as string) === 'ativo' ? 'Em Andamento' : 
                          (safra.status as string) === 'planejada' || (safra.status as string) === 'planejado' ? 'Planeada' : 'Colhida'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Plantado em: {new Date(safra.dataSemeadura).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(safra.status as string) === 'planejada' && (
                      <button
                        onClick={() => handleAlterarStatusSafra(safra.id, 'em_andamento')}
                        className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        Iniciar Plantio
                      </button>
                    )}
                    
                    {(safra.status as string) === 'em_andamento' && (
                      <button
                        onClick={() => handleAlterarStatusSafra(safra.id, 'colhida')}
                        className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                      >
                        Marcar como Colhida 🚜
                      </button>
                    )}

                    {(safra.status as string) === 'colhida' && (
                      <span className="text-xs font-medium text-gray-400 italic">Ciclo Finalizado</span>
                    )}
                  </div>
                </div>
              ))}

              {safras.length === 0 && !loadingSafras && (
                <div className="p-12 text-center text-gray-500">
                  Nenhuma safra registada para este talhão ainda.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}