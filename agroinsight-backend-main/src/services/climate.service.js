// Camada de I/O com a API climática Open-Meteo (gratuita, sem API key).
// Concentra TODAS as chamadas de rede; os demais serviços (fenologia, alertas)
// recebem os dados já normalizados e permanecem puros/testáveis.
//
// Open-Meteo:
//   - forecast: temperatura/umidade atuais + previsão diária (e past_days para histórico recente).
//   - archive:  histórico diário consolidado (usado para acumular GDD desde a semeadura).

const FORECAST_URL = process.env.OPEN_METEO_FORECAST_URL ?? 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = process.env.OPEN_METEO_ARCHIVE_URL ?? 'https://archive-api.open-meteo.com/v1/archive';

// Permite injetar um fetch alternativo em testes; por padrão usa o fetch global (Node 18+).
let fetchImpl = globalThis.fetch;

export function setFetchImpl(fn) {
  fetchImpl = fn;
}

function buildUrl(base, params) {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function getJson(url) {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo respondeu ${res.status}`);
  }
  return res.json();
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

// A umidade do solo vem na série horária; pegamos o valor da hora atual
// (casando por prefixo YYYY-MM-DDTHH). Retorna null se indisponível.
function extractCurrentSoilMoisture(hourly, currentTime) {
  if (!hourly?.time || !hourly?.soil_moisture_0_to_1cm) return null;
  const prefix = (currentTime ?? '').slice(0, 13);
  const idx = hourly.time.findIndex((t) => String(t).slice(0, 13) === prefix);
  const value = idx >= 0 ? hourly.soil_moisture_0_to_1cm[idx] : hourly.soil_moisture_0_to_1cm[0];
  return Number.isFinite(value) ? value : null;
}

/**
 * Condições climáticas atuais + previsão diária para uma coordenada.
 * @returns {{atual:object, previsao:Array}}
 */
export async function getCurrentAndForecast(latitude, longitude, dias = 7) {
  const url = buildUrl(FORECAST_URL, {
    latitude,
    longitude,
    current: 'temperature_2m,relative_humidity_2m,precipitation',
    hourly: 'soil_moisture_0_to_1cm',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    forecast_days: dias,
    timezone: 'auto',
  });

  const data = await getJson(url);
  const c = data.current ?? {};
  const d = data.daily ?? {};

  return {
    coordenadas: { latitude, longitude },
    atual: {
      horario: c.time ?? null,
      temperaturaC: c.temperature_2m ?? null,
      umidadeRelativa: c.relative_humidity_2m ?? null,
      precipitacaoMm: c.precipitation ?? null,
      umidadeSoloVol: extractCurrentSoilMoisture(data.hourly, c.time),
    },
    previsao: (d.time ?? []).map((data, i) => ({
      data,
      tmax: d.temperature_2m_max?.[i] ?? null,
      tmin: d.temperature_2m_min?.[i] ?? null,
      precipitacaoMm: d.precipitation_sum?.[i] ?? 0,
    })),
  };
}

/**
 * Série diária de temperatura entre duas datas (para acumular GDD desde a semeadura).
 * Usa o arquivo histórico; se a data final ultrapassar o que o arquivo cobre,
 * a API retorna o que tiver disponível.
 * @returns {Array<{data:string, tmax:number, tmin:number, precipitacaoMm:number}>}
 */
export async function getDailyHistory(latitude, longitude, startDate, endDate = isoToday()) {
  const url = buildUrl(ARCHIVE_URL, {
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  });

  const data = await getJson(url);
  const d = data.daily ?? {};

  return (d.time ?? [])
    .map((data, i) => ({
      data,
      tmax: d.temperature_2m_max?.[i],
      tmin: d.temperature_2m_min?.[i],
      precipitacaoMm: d.precipitation_sum?.[i] ?? 0,
    }))
    .filter((dia) => Number.isFinite(dia.tmax) && Number.isFinite(dia.tmin));
}
