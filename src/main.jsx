import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import UserRecords from './UserRecords.jsx'
import NewRequest from './NewRequest.jsx' 
import AdminDashboard from './AdminDashboard.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminUserRecords from './AdminUserRecords.jsx'
import AdminAddPersonal from './AdminAddPersonal.jsx'
import AdminEditPersonal from './AdminEditPersonal.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        
        {/* RUTAS DE USUARIO */}
        <Route path="/registros/:codigo" element={<UserRecords />} />
        <Route path="/nuevo-registro/:codigo" element={<NewRequest />} />
        {/* CAMBIO AQUÍ: Ahora usamos :nroRegistro en lugar de :idRegistro */}
        <Route path="/editar-registro/:codigo/:nroRegistro" element={<NewRequest />} />
        
        {/* RUTAS DE ADMIN */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminDashboard />} />
        <Route path="/admin/registros/:codigo" element={<AdminUserRecords />} />
        <Route path="/admin/nuevo-personal" element={<AdminAddPersonal />} />
        <Route path="/admin/editar-personal/:codigo" element={<AdminEditPersonal />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)