import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminSidebar from './AdminSidebar'

function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg-soft">
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' } }} />
      <AdminSidebar />
      <main className="md:ml-56 pt-4 pb-6 px-4 md:px-6 max-w-6xl md:mx-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
