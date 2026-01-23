import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import UserRecords from './UserRecords.jsx'
import AdminLogin from './AdminLogin.jsx'       // <--- Importar
import AdminDashboard from './AdminDashboard.jsx' // <--- Importar
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/registros/:codigo" element={<UserRecords />} />
        
        {/* NUEVAS RUTAS ADMIN */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)