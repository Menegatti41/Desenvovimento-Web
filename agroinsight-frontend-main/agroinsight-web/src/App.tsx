import React, { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import VisaoGeral from './pages/VisaoGeral';
import Talhoes from './pages/Talhoes';
import Safras from './pages/Safras';
import Insights from './pages/Insights';
import Calendario from './pages/Calendario';

function RotaPrivada({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('@AgroInsight:token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas */}
        <Route path="/" element={ <RotaPrivada><DashboardLayout /></RotaPrivada> }>
          <Route index element={<VisaoGeral />} />
          <Route path="talhoes" element={<Talhoes />} />
          <Route path="safras" element={<Safras />} />
          <Route path="insights" element={<Insights />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>

        {/* Fallback de segurança */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}