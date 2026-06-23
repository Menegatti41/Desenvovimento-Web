import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Map as MapIcon, Wheat, Droplets, Thermometer, CloudRain, ShieldCheck } from 'lucide-react';
import { type Talhao } from '../types/agro'; 

  // Definição da estrutura dos dados reais de performance
  interface PerformanceSafra {
  id: number;
  cultura: string;
  variedade: string;
  talhaoNome: string;
  estimado: number;
  real: number;
  variacao: number;
}

// Interface para tipar os dados que vêm do Back-end
interface DashboardData {
  totalTalhoes: number;
  safrasAtivas: number;
  clima: string;
}

export default function VisaoGeral() {

  const navigate = useNavigate();
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState('');
  // Estados para Análise de Performance Agronómica Real
  const [performanceSafra, setPerformanceSafra] = useState<any>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [safrasColhidas, setSafrasColhidas] = useState<any[]>([]);
  const [safraSelecionadaId, setSafraSelecionadaId] = useState<string>('');
  // Estados para o Monitor Climático Real 100% Dinâmico
  const [listaTalhoesClima, setListaTalhoesClima] = useState<any[]>([]);
  const [talhaoSelecionadoClimaId, setTalhaoSelecionadoClimaId] = useState<string>('');
  const [dadosClima, setDadosClima] = useState<{ temperatura: number; umidade: number; precipitacao: number; localizacao: string } | null>(null);
  const [loadingClima, setLoadingClima] = useState(true);

  // Vai buscar os dados ao back-end assim que a tela abre
useEffect(() => {
  async function carregarDados() {
    try {
      // Usando o Promise.all para buscar as duas rotas em paralelo
      const [resTalhoes, resSummary] = await Promise.all([
        api.get('/talhoes'),
        api.get('/dashboard') 
      ]);

      // Salva os dados nos respectivos estados do React
      setTalhoes(resTalhoes.data);
      setDashboardSummary(resSummary.data); // Certifique-se de que adicionou este estado no topo!
      
    } catch (err) {
      console.error(err);
      setErro('Não foi possível carregar os dados da fazenda.');
    } finally {
      setLoading(false);
    }
  }
  carregarDados();
}, []);

  // Passo 1: Carrega a lista inicial de talhões para alimentar o seletor
  useEffect(() => {
    async function carregarTalhoesParaOClima() {
      try {
        const resTalhoes = await api.get('/talhoes');
        const talhoes = resTalhoes.data || [];
        setListaTalhoesClima(talhoes);
        
        if (talhoes.length > 0) {
          setTalhaoSelecionadoClimaId(talhoes[0].id.toString());
        } else {
          setLoadingClima(false);
        }
      } catch (err) {
        console.error("Erro ao listar talhões para o bloco climático:", err);
        setLoadingClima(false);
      }
    }
    carregarTalhoesParaOClima();
  }, []);

  // Passo 2: Busca a telemetria em tempo real toda vez que o talhão mudou usando a rota oficial do backend
  useEffect(() => {
    async function carregarTelemetriaDoTalhao() {
      if (!talhaoSelecionadoClimaId) return;
      try {
        setLoadingClima(true);
        const talhaoAtual = listaTalhoesClima.find(t => t.id.toString() === talhaoSelecionadoClimaId);

        if (talhaoAtual) {
          // Note que passamos o ID do talhão e o endpoint /clima com a permissão correta
          const resClimaOficial = await api.get(`/talhoes/${talhaoSelecionadoClimaId}/clima`);
          
          if (resClimaOficial.data) {
            setDadosClima({
              // Mapeia os campos exatos que a tua função 'getClimaByTalhao' retorna no JSON
              temperatura: resClimaOficial.data.temperatura || resClimaOficial.data.temperaturaAtual || 0,
              umidade: resClimaOficial.data.umidade || resClimaOficial.data.umidadeSolo || 0,
              precipitacao: resClimaOficial.data.precipitacao || resClimaOficial.data.precipitacaoAcumulada || 0,
              localizacao: talhaoAtual.localizacao || talhaoAtual.nome
            });
          } else {
            setDadosClima({ temperatura: 0, umidade: 0, precipitacao: 0, localizacao: talhaoAtual.nome });
          }
        }
      } catch (err) {
        console.error("Erro ao consumir a rota oficial de clima do backend:", err);
        const talhaoAtual = listaTalhoesClima.find(t => t.id.toString() === talhaoSelecionadoClimaId);
        setDadosClima({ temperatura: 0, umidade: 0, precipitacao: 0, localizacao: talhaoAtual?.nome || 'Desconhecido' });
      } finally {
        setLoadingClima(false);
      }
    }
    carregarTelemetriaDoTalhao();
  }, [talhaoSelecionadoClimaId, listaTalhoesClima]);

  // Passo 1: Varre todos os talhões para encontrar TODAS as safras colhidas
  useEffect(() => {
    async function carregarTodasAsSafrasColhidas() {
      try {
        setLoadingPerformance(true);
        const resTalhoes = await api.get('/talhoes');
        const listaTalhoes = resTalhoes.data || [];
        
        let todasColhidas: any[] = [];

        for (const talhao of listaTalhoes) {
          try {
            const resSafras = await api.get(`/talhoes/${talhao.id}/safras`);
            const safrasDoTalhao = resSafras.data || [];
            
            // Filtra apenas as colhidas e acopla o nome do talhão para o seletor
            const colhidas = safrasDoTalhao
              .filter((s: any) => s.status === 'colhida')
              .map((s: any) => ({ ...s, talhaoNome: talhao.nome }));
              
            todasColhidas = [...todasColhidas, ...colhidas];
          } catch (e) {
            console.log(`Sem safras para talhão ${talhao.id}`);
          }
        }

        setSafrasColhidas(todasColhidas);

        // Seleciona automaticamente a primeira da lista se houver alguma
        if (todasColhidas.length > 0) {
          setSafraSelecionadaId(todasColhidas[0].id.toString());
        } else {
          setLoadingPerformance(false);
        }
      } catch (err) {
        console.error("Erro ao listar safras colhidas:", err);
        setLoadingPerformance(false);
      }
    }
    carregarTodasAsSafrasColhidas();
  }, []);

  // Passo 2: Sempre que o utilizador mudar a safra no seletor, chama a sua rota oficial de performance
  useEffect(() => {
    async function buscarDadosDaRotaOficial() {
      if (!safraSelecionadaId) return;
      try {
        setLoadingPerformance(true);
        const safraInfo = safrasColhidas.find(s => s.id.toString() === safraSelecionadaId);
        
        if (safraInfo) {
          const resPerformance = await api.get(`/safras/${safraSelecionadaId}/performance`);
          
          setPerformanceSafra({
            ...safraInfo,
            estimado: resPerformance.data.produtividadeEstimada || safraInfo.produtividadeEstimada || 70,
            real: resPerformance.data.produtividadeReal || safraInfo.produtividadeReal || 0,
            variacao: resPerformance.data.variacao || 0
          });
        }
      } catch (err) {
        console.error("Erro ao chamar rota oficial de performance:", err);
      } finally {
        setLoadingPerformance(false);
      }
    }
    buscarDadosDaRotaOficial();
  }, [safraSelecionadaId, safrasColhidas]);

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
        
        {/* Card 1: Total de Talhões (Mantém o seu lógica inteligente ou usa a do summary) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <MapIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Talhões</p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : (dashboardSummary?.totalTalhoes ?? talhoes.length)}
            </p>
          </div>
        </div>

        {/* Card 2: Safras Ativas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
            <Wheat className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Safras Ativas</p>
            <p className="text-2xl font-bold text-gray-800">
              {/* MUDANÇA: Troca o "3" fixo por dado dinâmico */}
              {loading ? '...' : (dashboardSummary?.safrasAtivas ?? 0)}
            </p>
          </div>
        </div>

        {/* Card 3: Clima Atual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Clima Atual</p>
            <p className="text-xl font-bold text-gray-800">
              {/* MUDANÇA: Troca o "Bom" fixo por dado dinâmico */}
              {loading ? '...' : (dashboardSummary?.clima ?? 'Bom')}
            </p>
          </div>
        </div>
        
      </div>

      {/* SEÇÃO: MONITORAMENTO CLIMÁTICO COM SELETOR DE TALHÃO (README) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CloudRain className="w-6 h-6 text-blue-600" />
              Monitoramento Climático em Tempo Real
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Indicadores microclimáticos baseados nos sensores do talhão selecionado.</p>
          </div>
          
          {/* SELETOR DINÂMICO DE TALHÕES PARA O CLIMA */}
          {listaTalhoesClima.length > 0 && (
            <div className="flex flex-col bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-100 min-w-[160px]">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Filtrar por Área:</span>
              <select
                value={talhaoSelecionadoClimaId}
                onChange={e => setTalhaoSelecionadoClimaId(e.target.value)}
                className="border-none bg-transparent text-xs font-bold text-blue-800 focus:outline-none cursor-pointer mt-0.5"
              >
                {listaTalhoesClima.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loadingClima ? (
          <div className="p-6 text-center text-sm text-gray-400">Sincronizando estação meteorológica...</div>
        ) : !dadosClima || (dadosClima.temperatura === 0 && dadosClima.umidade === 0) ? (
          <div className="border border-dashed border-gray-200 p-8 rounded-xl text-center text-sm text-gray-400">
            ⚠️ Nenhuma leitura meteorológica ativa foi registada no banco de dados SQLite para o talhão <span className="font-bold text-gray-600">"{dadosClima?.localizacao}"</span>. Aguardando transmissão de telemetria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* CARD 1: TEMPERATURA */}
            <div className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-orange-50/60 to-amber-50/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Temperatura do Ar</span>
                <div className="text-3xl font-black text-amber-800">{dadosClima.temperatura}°C</div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">Sensores ativos</span>
              </div>
              <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100">
                <Thermometer className="w-6 h-6 fill-orange-50" />
              </div>
            </div>

            {/* CARD 2: HUMIDADE */}
            <div className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50/60 to-cyan-50/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Humidade do Solo</span>
                <div className="text-3xl font-black text-blue-800">{dadosClima.umidade}%</div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">Capacidade de campo</span>
              </div>
              <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-blue-100">
                <Droplets className="w-6 h-6 fill-blue-50" />
              </div>
            </div>

            {/* CARD 3: PRECIPITAÇÃO */}
            <div className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Precipitação</span>
                <div className="text-3xl font-black text-indigo-800">
                  {dadosClima.precipitacao} <span className="text-sm font-normal">mm</span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">Histórico 24h</span>
              </div>
              <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
                <CloudRain className="w-6 h-6 fill-indigo-50" />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* SEÇÃO: ANÁLISE DE PERFORMANCE REAL COM SELETOR (README + ROTA OFICIAL) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Análise de Performance Agronómica Real</h2>
            <p className="text-xs text-gray-400 mt-0.5">Selecione e compare a produtividade planeada contra o resultado real extraído via API.</p>
          </div>

          {/* SELETOR DINÂMICO DE SAFRAS HISTÓRICAS */}
          {safrasColhidas.length > 0 && (
            <div className="flex flex-col bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Analisar Ciclo:</span>
              <select
                value={safraSelecionadaId}
                onChange={e => setSafraSelecionadaId(e.target.value)}
                className="border-none bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer mt-0.5"
              >
                {safrasColhidas.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.cultura} ({s.variedade}) - {s.talhaoNome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loadingPerformance ? (
          <div className="p-8 text-center text-sm text-gray-400">Consultando base de dados via API...</div>
        ) : !performanceSafra ? (
          <div className="border border-dashed border-gray-200 p-8 rounded-xl text-center text-sm text-gray-400">
            Nenhum registro de colheita finalizado no banco de dados para alimentar a rota <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">/:id/performance</code>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Resultado da Safra Selecionada */}
            <div className="md:col-span-2 border border-gray-100 bg-gray-50/50 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{performanceSafra.cultura}</h3>
                  <span className="text-xs font-semibold text-gray-400">Variedade / Híbrido: {performanceSafra.variedade}</span>
                </div>
                <span className="text-xs font-black bg-green-100 text-green-800 px-3 py-1 rounded-full uppercase">
                  {performanceSafra.talhaoNome}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Produtividade Planeada</span>
                  <span className="text-2xl font-black text-blue-600 mt-1 block">
                    {performanceSafra.estimado} <span className="text-sm font-normal text-gray-500">sc/ha</span>
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Resultado Real Obtido</span>
                  <span className="text-2xl font-black text-green-700 mt-1 block">
                    {performanceSafra.real} <span className="text-sm font-normal text-gray-500">sc/ha</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Cálculo Dinâmico do Desempenho */}
            {(() => {
              const diferenca = performanceSafra.real - performanceSafra.estimado;
              const porcentagemVariacao = performanceSafra.estimado > 0 
                ? Number(((diferenca / performanceSafra.estimado) * 100).toFixed(1)) 
                : 0;
              const ehPositivo = diferenca >= 0;

              return (
                <div className={`border p-6 rounded-xl flex flex-col justify-between text-white ${
                  ehPositivo ? 'bg-gradient-to-br from-green-700 to-emerald-800 border-green-600' : 'bg-gradient-to-br from-amber-600 to-red-700 border-red-600'
                }`}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">Variação de Produtividade</span>
                    <div className="text-4xl font-black mt-1">
                      {ehPositivo ? `+${porcentagemVariacao}%` : `${porcentagemVariacao}%`}
                    </div>
                    <p className="text-xs opacity-90 mt-3 leading-relaxed">
                      {ehPositivo 
                        ? 'Excelente resultado! A execução técnica superou a estimativa matemática inicial do planejamento.' 
                        : 'A colheita real ficou abaixo da meta estimada devido a fatores limitantes do ciclo climático.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 tracking-wider block pt-4">
                    ENDPOINT CONSULTADO: SAFA #{performanceSafra.id}
                  </span>
                </div>
              );
            })()}

          </div>
        )}
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
                <button
                  onClick={() => navigate(`/insights?talhaoId=${talhao.id}`)}
                  className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Ver Detalhes <span className="text-base">→</span>
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