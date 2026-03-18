import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import UserRecords from './pages/UserRecords.jsx'
import NewRequest from './pages/NewRequest.jsx'
import NewRecord from './pages/NewRecord.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminDashboardHome from './pages/AdminDashboardHome.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminUserRecords from './pages/AdminUserRecords.jsx'
import AdminAddPersonal from './pages/AdminAddPersonal.jsx'
import AdminEditPersonal from './pages/AdminEditPersonal.jsx'
import AdminBitacora from './pages/AdminBitacora.jsx'
import AdminAdministradores from './pages/AdminAdministradores.jsx'
import AdminConfiguracion from './pages/AdminConfiguracion.jsx'
import UserLayout from './components/UserLayout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />

        {/* Employee routes with bottom nav */}
        <Route element={<UserLayout />}>
          <Route path="/registros/:codigo" element={<UserRecords />} />
          <Route path="/nuevo-registro/:codigo" element={<NewRequest />} />
          <Route path="/editar-registro/:codigo/:nroRegistro" element={<NewRequest />} />
          {/* New Module Routes */}
          <Route path="/crear-registro/:codigo" element={<NewRecord />} />
          <Route path="/editar-nuevo-registro/:codigo/:nroRegistro" element={<NewRecord />} />
        </Route>

        {/* Admin routes with sidebar */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
          <Route path="/admin-panel" element={<AdminDashboard />} />
          <Route path="/admin/registros/:codigo" element={<AdminUserRecords />} />
          <Route path="/admin/nuevo-personal" element={<AdminAddPersonal />} />
          <Route path="/admin/editar-personal/:codigo" element={<AdminEditPersonal />} />
          <Route path="/admin/bitacora" element={<AdminBitacora />} />
          <Route path="/admin/administradores" element={<AdminAdministradores />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
