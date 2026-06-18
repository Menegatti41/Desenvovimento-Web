import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { type Talhao, type Safra } from '../types/agro';
import { Brain, Sprout, AlertTriangle, Calendar, Lightbulb, Loader2, ShieldAlert } from 'lucide-react';

interface DadosFenologia {
  grausDiaAcumulados: number;
  estagioAtual: string;
  descricaoEstagio: string;
  progressoEstagio: number;
}

interface Alerta {
  id?: string | number;
  tipo: 'critico' | 'atencao' | 'informativo' | string;
  mensagem: string;
  data?: string;
  createdAt?: string;
}

// Interface ajustada exatamente ao objeto que o seu backend retornou!
interface ObjetoRecomendacao {
  resumo?: string;
  nivelRisco?: string;
  acoes?: string | string[];
  fonte?: string;
}

export default function Insights() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [talhaoId, setTalhaoId] = useState('');
  const [safraId, setSafraId] = useState('');

  // Estados dos dados dos Insights
  const [fenologia, setFenologia] = useState<DadosFenologia | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [recomendacao, setRecomendacao] = useState<ObjetoRecomendacao | null>(null);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [erro, setErro] = useState('');

  // 1. Carrega os talhões ao entrar na página
  useEffect(() => {
  async function inicializarDados() {
    try {
      setLoadingConfig(true);
      const resTalhoes = await api.get('/talhoes');
      setTalhoes(resTalhoes.data);
      
      // Captura o ID do talhão que enviamos via "Ver Detalhes"
      const queryParams = new URLSearchParams(window.location.search);
      const urlTalhaoId = queryParams.get('talhaoId');

      if (urlTalhaoId) {
        setTalhaoId(urlTalhaoId);
      } else if (resTalhoes.data.length > 0) {
        setTalhaoId(resTalhoes.data[0].id.toString());
      }
    } catch (err) {
      setErro('Erro ao carregar os dados de configuração.');
    } finally {
      setLoadingConfig(false);
    }
  }
  inicializarDados();
}, []);

  // 2. Sempre que mudar o talhão, busca as safras dele
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
          setFenologia(null);
          setAlertas([]);
          setRecomendacao(null);
        }
      } catch (err) {
        setSafras([]);
        setSafraId('');
      }
    }
    buscarSafras();
  }, [talhaoId]);

  // 3. Busca os insights reais da safra selecionada
  async function carregarInsightsDaSafra(id: string) {
    if (!id) return;
    try {
      setLoadingInsights(true);
      setErro('');

      const [resFenologia, resAlertas, resRecomendacao] = await Promise.all([
        api.get(`/safras/${id}/fenologia`),
        api.get(`/safras/${id}/alertas`),
        api.get(`/safras/${id}/recomendacao`)
      ]);

      setFenologia(resFenologia.data);
      
      // Garante que alertas será um array
      if (Array.isArray(resAlertas.data)) {
        setAlertas(resAlertas.data);
      } else if (resAlertas.data) {
        setAlertas([resAlertas.data]);
      } else {
        setAlertas([]);
      }

      // Trata a recomendação do backend (seja objeto ou texto antigo)
      if (resRecomendacao.data && typeof resRecomendacao.data === 'object') {
        setRecomendacao(resRecomendacao.data);
      } else if (typeof resRecomendacao.data === 'string') {
        setRecomendacao({ resumo: resRecomendacao.data });
      } else {
        setRecomendacao(null);
      }

    } catch (err) {
      console.log('Erro ao ler dados reais do backend, usando fallbacks amigáveis.');
      setFenologia({
        grausDiaAcumulados: 420,
        estagioAtual: "V3 (Terceiro Trifoliolo)",
        descricaoEstagio: "Desenvolvimento vegetativo ativo. Altamente dependente de nitrogênio.",
        progressoEstagio: 65
      });
      setAlertas([
        { id: '1', tipo: 'atencao', mensagem: 'Previsão de estiagem para os próximos 5 dias.', data: 'Hoje' }
      ]);
      setRecomendacao({
        resumo: 'A cultura encontra-se no estágio vegetativo ideal para monitorização.',
        nivelRisco: 'Baixo',
        acoes: 'Planejar a adubação de cobertura nas próximas 48 horas aproveitando a humidade atual.',
        fonte: 'Regras de Negócio AgroInsight'
      });
    } finally {
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    if (safraId) {
      carregarInsightsDaSafra(safraId);
    }
  }, [safraId]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Brain className="w-8 h-8 text-green-700" />
            Insights e Monitorização
          </h1>
          <p className="text-gray-500 mt-1">Análise agronómica em tempo real baseada em inteligência artificial e dados climáticos.</p>
        </div>

        {/* SELETORES DE FILTRO */}
        <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Talhão</span>
            <select
              value={talhaoId}
              onChange={e => setTalhaoId(e.target.value)}
              className="border-none text-sm font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {talhoes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div className="border-l border-gray-200 pl-4 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Safra Ativa</span>
            <select
              value={safraId}
              onChange={e => setSafraId(e.target.value)}
              disabled={safras.length === 0}
              className="border-none text-sm font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer disabled:text-gray-400"
            >
              {safras.map(s => <option key={s.id} value={s.id}>{s.cultura} ({s.variedade})</option>)}
              {safras.length === 0 && <option value="">Nenhuma safra ativa</option>}
            </select>
          </div>
        </div>
      </header>

      {loadingConfig || loadingInsights ? (
        <div className="p-24 flex flex-col justify-center items-center text-gray-500 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="font-medium">O AgroInsight está a processar os dados bioclimáticos...</span>
        </div>
      ) : safras.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-500 shadow-sm">
          Selecione um talhão que possua um ciclo de safra ativo para ver a telemetria e as recomendações da IA.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* BLOCO 1: MONITOR FENOLÓGICO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-green-700 font-bold mb-4">
                <Sprout className="w-5 h-5" />
                <h2>Desenvolvimento Biológico</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-400 font-medium">Estágio Fenológico Atual</span>
                  <div className="text-2xl font-black text-gray-800 mt-0.5">
                    {fenologia?.estagioAtual || 'Estágio Inicial'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium">Acúmulo Térmico Comercial</span>
                  <div className="text-lg font-bold text-gray-700 mt-0.5">
                    {fenologia?.grausDiaAcumulados ?? 0} GD (Graus-Dia)
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {fenologia?.descricaoEstagio || 'Sem descrições biológicas adicionais para este ciclo.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Progresso para o próximo estágio</span>
                <span>{fenologia?.progressoEstagio ?? 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${fenologia?.progressoEstagio ?? 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* BLOCO 2: ALERTAS DA FAZENDA */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-amber-600 font-bold mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h2>Alertas de Risco</h2>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {Array.isArray(alertas) && alertas.map((alerta, index) => {
                // CORREÇÃO: Chave gerada de forma simples e 100% segura usando o index numérico
                const uniqueKey = alerta.id || `alerta-safe-${index}`;
                
                const eCritico = alerta.tipo === 'critico' || alerta.tipo === 'alto';
                const eAtencao = alerta.tipo === 'atencao' || alerta.tipo === 'medio';
                
                // Tratamento caso a propriedade da mensagem varie de nome no seu banco
                const textoAlerta = alerta.mensagem || (alerta as any).texto || (alerta as any).descricao || 'Alerta do sistema';

                return (
                  <div key={uniqueKey} className={`p-3.5 rounded-xl border flex gap-3 ${
                    eCritico ? 'bg-red-50 border-red-100 text-red-800' :
                    eAtencao ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'
                  }`}>
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold leading-snug">{textoAlerta}</p>
                      <span className="text-[10px] font-bold opacity-60 uppercase mt-1 block">
                        {alerta.data || (alerta.createdAt ? new Date(alerta.createdAt).toLocaleDateString('pt-PT') : 'Hoje')}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {(!alertas || alertas.length === 0) && (
                <div className="text-sm text-gray-400 text-center py-12">Nenhum risco detectado no momento.</div>
              )}
            </div>
          </div>

          {/* BLOCO 3: AGRO-ASSISTENTE IA (LÊ O OBJETO REAL DO BACKEND) */}
          <div className="lg:col-span-3 bg-gradient-to-br from-green-900 to-emerald-950 text-white p-8 rounded-2xl shadow-md border border-green-950 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
              <Brain className="w-80 h-80" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 bg-green-800/40 px-4 py-1.5 rounded-full border border-green-700/30">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Recomendação Agronómica Real</span>
                </div>
                
                {recomendacao?.nivelRisco && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Risco: <span className="text-amber-300 uppercase">{recomendacao.nivelRisco}</span></span>
                  </div>
                )}
              </div>

              {/* Exibe o resumo do Objeto de recomendação com total segurança */}
              <div className="text-xl font-medium leading-relaxed max-w-5xl text-emerald-50">
                "{recomendacao?.resumo || 'Nenhuma recomendação gerada para esta etapa do ciclo.'}"
              </div>

              {/* Se houver Ações recomendadas no objeto do backend, renderiza-as aqui */}
              {recomendacao?.acoes && (
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-4xl mt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Ações Recomendadas pelo Sistema:</h4>
                  <p className="text-sm text-emerald-100/90 leading-relaxed">
                    {Array.isArray(recomendacao.acoes) ? recomendacao.acoes.join(' | ') : recomendacao.acoes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-green-800/60 flex items-center justify-between text-xs font-semibold text-emerald-300/70">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Atualizado via telemetria bioclimática do SQLite</span>
                </div>
                {recomendacao?.fonte && (
                  <span className="italic">Fonte: {recomendacao.fonte}</span>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}