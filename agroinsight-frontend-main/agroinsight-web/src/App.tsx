import React, { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import VisaoGeral from './pages/VisaoGeral';

// O nosso segurança da porta!
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
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas */}
        <Route path="/" element={ <RotaPrivada><DashboardLayout /></RotaPrivada> }>
          {/* A Rota "index" carrega a VisaoGeral dentro do DashboardLayout */}
          <Route index element={<VisaoGeral />} />
        </Route>

        {/* Rota de segurança (Fallback) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}