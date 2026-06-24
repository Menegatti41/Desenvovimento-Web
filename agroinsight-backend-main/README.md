# AgroInsight — Backend

API de **Inteligência Geoespacial para Safras**. Transforma coordenadas geográficas e dados
climáticos em insights agronômicos: ciclo fenológico, alertas de risco, calendário agrícola
e análise de produtividade.

Stack: **Node.js (ES Modules) + Express + Sequelize + SQLite + JWT + Vitest**, com
integração climática **Open-Meteo** (derivada de satélite) e inteligência via **LLM (Google Gemini)**.

## Requisitos

- Node.js >= 18 (usa `fetch` nativo)
- npm

## Instalação

```bash
npm install
cp .env.example .env      # ajuste o JWT_SECRET
npm run db:migrate        # cria as tabelas
npm run db:seed           # popula dados de exemplo (opcional)
npm start                 # sobe a API em http://localhost:3000
```

Usuários de exemplo (senha `123456`): `admin@agroinsight.com` (admin),
`joao@fazenda.com` e `maria@fazenda.com` (produtor).

## Scripts

| Script             | Descrição                                  |
|--------------------|--------------------------------------------|
| `npm start`        | Sobe o servidor                            |
| `npm run dev`      | Sobe com `--watch`                         |
| `npm run db:migrate` | Aplica migrations pendentes              |
| `npm run db:seed`  | Aplica seeders pendentes                   |
| `npm run db:reset` | Migrate + seed                             |
| `npm test`         | Roda os testes (Vitest)                    |

## Modelo de dados

```
User (produtor/admin)
  └─ hasMany ─> Talhao (área com latitude/longitude)
                  └─ hasMany ─> Safra (cultura, semeadura, produtividade)
```

## Autenticação e perfis (RBAC)

Login retorna um **access token JWT** enviado em `Authorization: Bearer <token>`.

| Perfil    | Acesso                                                            |
|-----------|-------------------------------------------------------------------|
| `admin`   | Gerencia tudo (todos os talhões/safras/usuários)                  |
| `produtor`| Gerencia apenas os **próprios** talhões e safras; lê insights     |


## 🌍 Ambiente de Produção

A API está publicada e acessível publicamente através da URL base:
**`https://agroinsight-backend-main.fly.dev`**


## Endpoints

### Auth
| Método | Rota             | Descrição                       |
|--------|------------------|---------------------------------|
| POST   | `/auth/register` | Cadastro (`role`: admin/produtor) |
| POST   | `/auth/login`    | Login → access token            |
| GET    | `/auth/me`       | Dados do usuário autenticado    |

### Talhões  _(requer token)_
| Método | Rota                    | Descrição                          |
|--------|-------------------------|------------------------------------|
| GET    | `/talhoes`              | Lista (escopo por dono)            |
| POST   | `/talhoes`              | Cria talhão                        |
| GET    | `/talhoes/:id`          | Detalhe (inclui safras e dono)     |
| PUT    | `/talhoes/:id`          | Atualiza                           |
| DELETE | `/talhoes/:id`          | Remove                             |
| GET    | `/talhoes/:id/safras`   | Lista safras do talhão (1→N)       |
| POST   | `/talhoes/:id/safras`   | Cria safra no talhão (1→N)         |
| GET    | `/talhoes/:id/clima`    | **Monitoramento climático** (Open-Meteo) |

### Safras e Insights  _(requer token)_
| Método | Rota                       | Descrição                                   |
|--------|----------------------------|---------------------------------------------|
| GET    | `/safras/:id`              | Detalhe (inclui talhão)                     |
| PUT    | `/safras/:id`              | Atualiza (registra colheita/produtividade)  |
| DELETE | `/safras/:id`              | Remove                                      |
| GET    | `/safras/:id/fenologia`    | **Ciclo fenológico** (graus-dia)            |
| GET    | `/safras/:id/alertas`      | **Alertas de risco** (geada/calor/hídrico)  |
| GET    | `/safras/:id/calendario`   | **Calendário agrícola** sugerido            |
| GET    | `/safras/:id/performance`  | **Análise de performance** (estimado x real)|
| GET    | `/safras/:id/recomendacao` | **Recomendação por LLM (Gemini)** + marcador|

### Mapa da produção  _(requer token)_
| Método | Rota             | Descrição                                          |
|--------|------------------|----------------------------------------------------|
| GET    | `/insights/mapa` | Marcadores geolocalizados + **GeoJSON** p/ o mapa  |

## Inteligência (LLM) e Mapa da Produção

### Mapa (`GET /insights/mapa`)
Pensado para o front desenhar **círculos coloridos** sobre o mapa. Cada talhão vira um
marcador com cor por nível de risco e **raio em metros equivalente à área**:

| Nível       | Cor       | Significado                          |
|-------------|-----------|--------------------------------------|
| `critico`   | `#e23b3b` 🔴 | Há alerta de risco **alto**       |
| `atencao`   | `#f5a623` 🟡 | Pior alerta é **médio**           |
| `ok`        | `#2ecc71` 🟢 | Sem riscos relevantes             |
| `sem_safra` | `#9aa0a6` ⚪ | Talhão sem safra ativa            |

A resposta traz `marcadores` (lista) **e** um `geojson` (`FeatureCollection` de `Point`s)
que bibliotecas como Leaflet/Mapbox consomem direto — cada feature tem `cor`, `raioMetros`,
`nivel` e `resumo` nas `properties`.

### Recomendação (`GET /safras/:id/recomendacao`)
Reúne clima + umidade do solo + fenologia + alertas, monta um contexto agronômico e pede
ao **Gemini** orientações práticas (o que fazer agora). Retorna `{ resumo, nivelRisco, acoes[] }`
mais o `marcador` da safra e o `contexto` usado.

> **Sem `GEMINI_API_KEY`**, o sistema usa automaticamente um **fallback por regras**
> (`fonte: "regras"`) — tudo continua funcionando, sem LLM. Com a chave, `fonte: "gemini"`.

#### Configurar o Gemini (opcional)
1. Gere uma chave gratuita em https://aistudio.google.com/app/apikey
2. No `.env`: `GEMINI_API_KEY=suachave` (e opcionalmente `GEMINI_MODEL=gemini-2.0-flash`)
3. No Docker: `GEMINI_API_KEY=suachave docker compose up`

## Exemplos (curl)

```bash
# 1) Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@fazenda.com","password":"123456"}' | node -p "JSON.parse(require('fs').readFileSync(0)).accessToken")

# 2) Criar talhão
curl -X POST http://localhost:3000/talhoes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nome":"Talhão Norte","latitude":-12.5453,"longitude":-55.7211,"areaHectares":120.5}'

# 3) Criar safra no talhão 1
curl -X POST http://localhost:3000/talhoes/1/safras \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"cultura":"Soja","variedade":"BRS 7980","dataSemeadura":"2025-10-15","produtividadeEstimada":62}'

# 4) Insights
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/talhoes/1/clima
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/safras/1/fenologia
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/safras/1/alertas
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/safras/1/calendario
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/safras/1/performance

# 5) Inteligência + mapa
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/safras/1/recomendacao
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/insights/mapa
```

## Arquitetura

- `src/config/` — conexão Sequelize/SQLite (`PRAGMA foreign_keys = ON`)
- `src/models/` — User, Talhao, Safra + associações
- `src/migrations/` + `src/seeders/` — schema versionado (runner em `src/db/`)
- `src/services/` — camadas de I/O: **climate** (Open-Meteo) e **llm** (Gemini);
  serviços **puros** de domínio: `phenology`, `alerts`, `calendar`, `performance`, `advisory`
  (marcadores do mapa, montagem do prompt e fallback por regras)
- `src/middlewares/` — `requireAuth`, `requireRole`/`requirePermission` (RBAC), erros
- `src/controllers/` + `src/routes/` — endpoints REST
- `tests/` — unitários (serviços/middlewares) + integração (supertest)

> A integração climática real usa a [Open-Meteo](https://open-meteo.com) (gratuita, sem API key).
> Os serviços de domínio recebem os dados já normalizados e por isso são testáveis offline.
