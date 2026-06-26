import { useEffect, useState } from 'react';
import api from '../services/api';
import { type Talhao, type Safra } from '../types/agro';
import { Calendar as CalendarIcon, Loader2, Leaf, ShieldAlert, Tractor } from 'lucide-react';

interface SugestaoManejo {
  evento: string;
  dataSugerida: string;
  descricao: string;
  tipo: 'adubacao' | 'defensivo' | 'colheita';
}

export default function Calendario() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [talhaoId, setTalhaoId] = useState('');
  const [safraId, setSafraId] = useState('');
  
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [erro, setErro] = useState('');

  const [sugestoes, setSugestoes] = useState<SugestaoManejo[]>([]);
  const [mensagemErro, setMensagemErro] = useState('');

  // 1. Carrega os talhões ao entrar na página
  useEffect(() => {
    async function inicializarDados() {
      try {
        setLoadingConfig(true);
        const resTalhoes = await api.get('/talhoes');
        setTalhoes(resTalhoes.data);
        if (resTalhoes.data.length > 0) {
          setTalhaoId(resTalhoes.data[0].id.toString());
        }
      } catch (err) {
        setErro('Erro ao carregar os dados iniciais.');
      } finally {
        setLoadingConfig(false);
      }
    }
    inicializarDados();
  }, []);

  // 2. Busca as safras sempre que mudar o talhão
  useEffect(() => {
    async function buscarSafras() {
      if (!talhaoId) return;
      try {
        const resSafras = await api.get(`/talhoes/${talhaoId}/safras`);
        setSafras(resSafras.data);
        if (resSafras.data.length > 0) {
          setSafraId(resSafras.data[0].id.toString());
        } else {
          setSafraId('');
          setSugestoes([]);
        }
      } catch (err) {
        setSafras([]);
        setSafraId('');
        setSugestoes([]);
      }
    }
    buscarSafras();
  }, [talhaoId]);

  // 3. Busca e calcula sugestões fenológicas da safra selecionada
  async function carregarCalendarioDaSafra(id: string) {
    if (!id) return;
    try {
      setLoadingCalendario(true);
      setErro('');
      setMensagemErro('');
      setSugestoes([]);

      const safraInfo = safras.find(s => s.id.toString() === id);
      if (!safraInfo) return;

      const dataBase = safraInfo.dataSemeadura ? new Date(safraInfo.dataSemeadura) : new Date();
      const ehMilho = (safraInfo.cultura || '').toLowerCase().includes('milho');
      const statusAtual = safraInfo.status || 'ativa';

      // Função auxiliar para calcular datas com base no plantio
      const adicionarDias = (date: Date, dias: number) => {
        const resultado = new Date(date);
        resultado.setDate(resultado.getDate() + dias);
        return resultado.toISOString().split('T')[0];
      };

      // CARREGA APENAS AS SUGESTÕES AGRONÔMICAS AVANÇADAS
      setSugestoes([
        {
          evento: "Adubação de Cobertura Avançada",
          dataSugerida: adicionarDias(dataBase, ehMilho ? 18 : 22),
          descricao: `Aplicação nutricional ideal para o estágio fenológico atual de desenvolvimento do ${safraInfo.cultura} (Variedade: ${safraInfo.variedade || 'Padrão'}).`,
          tipo: 'adubacao'
        },
        {
          evento: "Monitoramento e Defensivo Preventivo",
          dataSugerida: adicionarDias(dataBase, 30),
          descricao: `Janela ideal calibrada para controle integrado e proteção foliar conforme a data inicial do plantio técnico de ${safraInfo.cultura}.`,
          tipo: 'defensivo'
        },
        {
          evento: "Previsão Estrutura de Colheita Mecânica",
          dataSugerida: adicionarDias(dataBase, ehMilho ? 135 : 125),
          descricao: `Previsão matemática de maturação comercial do grão. Status atualizado deste ciclo no banco: ${statusAtual.toUpperCase()}.`,
          tipo: 'colheita'
        }
      ]);

    } catch (err) {
      console.error("Erro geral no carregamento dos dados da safra:", err);
      setMensagemErro('Erro ao processar as informações agronômicas.');
    } finally {
      setLoadingCalendario(false);
    }
  }

  useEffect(() => {
    if (safraId) {
      carregarCalendarioDaSafra(safraId);
    }
  }, [safraId, safras]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-green-700" />
            Sugestões de Manejo
          </h1>
          <p className="text-gray-500 mt-1">Recomendações inteligentes para a cultura atual.</p>
        </div>

        {/* MENUS DE SELEÇÃO UNIFICADOS NO TOPO DIREITO */}
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          {talhoes.length > 0 && (
            <div className="flex flex-col min-w-[140px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">1. Talhão:</span>
              <select
                value={talhaoId}
                onChange={(e) => setTalhaoId(e.target.value)}
                className="bg-transparent font-bold text-gray-700 text-sm focus:outline-none cursor-pointer mt-0.5"
              >
                {talhoes.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          )}

          {safras.length > 0 && (
            <div className="flex flex-col border-l border-gray-100 pl-3 min-w-[180px]">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">2. Ciclo / Safra:</span>
              <select
                value={safraId}
                onChange={(e) => setSafraId(e.target.value)}
                className="bg-transparent font-bold text-green-700 text-sm focus:outline-none cursor-pointer mt-0.5"
              >
                {safras.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.cultura} ({s.variedade}) - {s.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          ⚠️ {erro}
        </div>
      )}

      {loadingConfig || loadingCalendario ? (
        <div className="p-24 flex flex-col justify-center items-center text-gray-500 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="font-medium">Sincronizando sugestões de manejo...</span>
        </div>
      ) : safras.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          Nenhum ciclo de cultivo ativo encontrado neste talhão para gerar sugestões.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-green-700" />
              Sugestões de Manejo Agronômico Inteligente
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Mapeamento fenológico automático gerado com base nos dados do ciclo ativo selecionado acima.</p>
          </div>

          {mensagemErro ? (
            <div className="border border-dashed border-amber-200 p-8 rounded-xl text-center text-sm text-amber-600 bg-amber-50/40">
              ⚠️ {mensagemErro}
            </div>
          ) : sugestoes.length === 0 ? (
            <div className="border border-dashed border-gray-200 p-8 rounded-xl text-center text-sm text-gray-400">
              Nenhuma recomendação calculada para esta safra até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sugestoes.map((sugestao, index) => {
                const cores = {
                  adubacao: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', icone: <Leaf className="w-5 h-5" /> },
                  defensivo: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800', icone: <ShieldAlert className="w-5 h-5" /> },
                  colheita: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', icone: <Tractor className="w-5 h-5" /> }
                }[sugestao.tipo || 'adubacao'] || { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-800', icone: <CalendarIcon className="w-5 h-5" /> };

                const dataFormatada = new Date(sugestao.dataSugerida + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                });

                return (
                  <div key={index} className={`border ${cores.border} ${cores.bg} p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${cores.text} block opacity-75`}>
                          Manejo Recomendado
                        </span>
                        <h3 className="font-black text-gray-800 text-base">{sugestao.evento}</h3>
                      </div>
                      <div className={`p-2.5 bg-white rounded-lg shadow-sm ${cores.text}`}>
                        {cores.icone}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {sugestao.descricao}
                    </p>

                    <div className="bg-white/80 p-2.5 rounded-lg border border-white/20 text-center">
                      <span className="text-xs font-bold text-gray-700">📅 Previsão: {dataFormatada}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}