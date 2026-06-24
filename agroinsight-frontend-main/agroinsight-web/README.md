Markdown
# AgroInsight - Frontend

Este é o módulo de interface do usuário (Frontend) do **AgroInsight**, uma plataforma web desenvolvida para auxiliar produtores e engenheiros agrônomos no gerenciamento de propriedades agrícolas, acompanhamento de safras e monitoramento de ciclos fenológicos.

A aplicação consome a [AgroInsight API](http://localhost:3000) para persistência de dados e regras de negócio.

## 🚀 Funcionalidades Principais

* **Painel de Safras (Acompanhamento):** * Filtragem automática de safras por talhão selecionado.
    * Cadastro de novos ciclos de cultivo informando cultura, variedade/híbrido e data de semeadura.
    * Gerenciamento de estados do cultivo (*Planejada*, *Em Andamento* e *Colhida*).
    * Lançamento de dados de produtividade estimada e real (em sacas por hectare - sc/ha).
* **Gestão de Talhões:** Listagem dinâmica com exibição de áreas em hectares (ha).
* **Indicadores em Tempo Real:** Componentes visuais com loaders e feedbacks de erro amigáveis para o usuário.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando as seguintes tecnologias e bibliotecas:

* **[React](https://react.dev/):** Biblioteca para construção da interface baseada em componentes.
* **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática para maior segurança e produtividade no desenvolvimento.
* **[Tailwind CSS](https://tailwindcss.com/):** Framework CSS utilitário para estilização rápida e responsiva.
* **[Axios](https://axios-http.com/):** Cliente HTTP para comunicação com o Backend.
* **[Lucide React](https://lucide.dev/):** Conjunto de ícones limpos e modernos de alta qualidade.

## 📂 Estrutura de Pastas Relevantes

```text
src/
├── components/         # Componentes globais e reutilizáveis (botões, modais, etc.)
├── data/               # Arquivos e constantes estáticas de suporte
├── pages/              # Telas e views principais da aplicação
│   └── Safras.tsx      # Tela de controle e monitoramento de safras
├── services/           # Configurações de API e chamadas HTTP
│   └── api.ts          # Instância do Axios apontando para o Backend
├── types/              # Definições de tipos TypeScript (.d.ts)
│   └── agro.ts         # Interfaces para Talhao, Safra, etc.
├── App.tsx             # Componente raiz com as rotas
└── main.tsx            # Ponto de entrada do React
## 🔧 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

* Node.js (versão 18 ou superior recomendada)
* npm ou yarn

O serviço do Backend (AgroInsight API) também deve estar rodando para que a interface consiga carregar as informações corretamente.

## 📦 Instalação e Configuração

1. Clone o repositório do frontend:
   ```bash
   git clone [https://github.com/seu-usuario/agroinsight-frontend.git](https://github.com/seu-usuario/agroinsight-frontend.git)
   cd agroinsight-frontend
   
Instale as dependências do projeto:

```bash
npm install
Configure as variáveis de ambiente. Crie um arquivo .env na raiz do projeto (ou modifique o existente) e configure o endereço do seu Backend:

Snippet de código
VITE_API_URL=http://localhost:3000
🎛️ Scripts Disponíveis
No diretório do projeto, você pode executar os seguintes comandos:

npm run dev
Roda o aplicativo em modo de desenvolvimento.
Abra http://localhost:5173 (ou a porta indicada no terminal) para visualizá-lo no navegador. A página irá recarregar automaticamente se você fizer alterações no código.

npm run build
Compila a aplicação para produção na pasta dist. O build é otimizado e os arquivos são minificados para garantir a melhor performance.

npm run lint
Executa o linter para analisar o código em busca de problemas de formatação ou boas práticas do TypeScript/React.

🤝 Comunicação com o Back-end
A interface realiza requisições para os seguintes endpoints principais:

GET /talhoes - Lista os talhões cadastrados.

GET /safras/culturas-suportadas - Busca as culturas válidas no sistema.

GET /talhoes/:id/safras - Retorna os ciclos de um talhão específico.

POST /safras - Cadastra uma nova safra.

PUT /safras/:id - Atualiza o status e a produtividade da safra.
