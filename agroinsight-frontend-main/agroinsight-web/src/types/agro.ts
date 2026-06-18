// src/types/agro.ts

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'produtor';
}

export interface Talhao {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  userId: number;
}

export interface Safra {
  id: number;
  cultura: string;
  variedade: string;
  dataSemeadura: string;
  produtividadeEstimada: number | null;
  produtividadeReal: number | null;
  status: 'planejado' | 'ativo' | 'colhido';
  dataColheitaReal: string | null;
  talhaoId: number;
}