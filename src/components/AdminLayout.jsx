import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminSidebar from './AdminSidebar'
import { useEffect } from 'react'

function AdminLayout() {
  const navigate = useNavigate()
  const adminUsuario = sessionStorage.getItem('admin_usuario')

  useEffect(() => {
    if (!adminUsuario) {
      navigate('/admin', { replace: true })
    }
  }, [adminUsuario, navigate])

  return (
    <div className="min-h-screen bg-bg-soft">
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' } }} />
      {adminUsuario ? <AdminSidebar /> : null}
      <main className="md:ml-56 pt-4 pb-6 px-4 md:px-8 max-w-7xl md:mx-auto flex-1 w-full">
        {adminUsuario ? <Outlet /> : null}
      </main>
    </div>
  )
}

export default AdminLayout
