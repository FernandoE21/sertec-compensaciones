import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import UserSidebar from './BottomNav'
import { useEffect } from 'react'

function UserLayout() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const codigoSesion = sessionStorage.getItem('empleado_codigo')

  useEffect(() => {
    if (!codigoSesion) {
      navigate('/', { replace: true })
      return
    }
    if (codigo && codigoSesion && codigo !== codigoSesion) {
      const partes = location.pathname.split('/')
      if (partes.length >= 3) {
        partes[2] = codigoSesion
        navigate(partes.join('/') + location.search, { replace: true })
      } else {
        navigate(`/registros/${codigoSesion}`, { replace: true })
      }
    }
  }, [codigo, codigoSesion, location.pathname, location.search, navigate])

  const autorizado = Boolean(codigoSesion) && Boolean(codigo) && codigo === codigoSesion
  
  return (
    <div className="min-h-screen bg-bg-soft">
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' } }} />
      {codigoSesion && <UserSidebar codigo={codigoSesion} />}
      <main className="md:ml-56 pt-4 pb-6 px-4 flex-1 md:px-8 max-w-7xl md:mx-auto w-full">
        {autorizado ? <Outlet /> : null}
      </main>
    </div>
  )
}

export default UserLayout
