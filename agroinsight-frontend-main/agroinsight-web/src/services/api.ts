import axios from 'axios';

// Cria a ligação para a porta 3000 (onde o seu Node.js está a correr)
const api = axios.create({
  baseURL: 'https://agroinsight-backend-main.fly.dev',
});

// Interceptor: Pega no token guardado no navegador e envia em todas as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@AgroInsight:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;