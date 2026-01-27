import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import UserRecords from './UserRecords.jsx'
import NewRequest from './NewRequest.jsx'       // <--- IMPORTAR
import AdminLogin from './AdminLogin.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/registros/:codigo" element={<UserRecords />} />
        <Route path="/nuevo-registro/:codigo" element={<NewRequest />} /> {/* <--- NUEVA RUTA */}
        
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)