import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { Building2, MapPin, Calendar, PlusCircle } from 'lucide-react'
import NuevaSolicitud from './NuevaSolicitud' // El Modal de IA
import HistorialPanel from './HistorialPanel' // <--- NUEVO: El Panel de Auditoría

export default function DashboardSaldos() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para controlar los modales/paneles
  const [showModal, setShowModal] = useState(false) 
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null) // <--- NUEVO: Para saber a quién dimos clic

  // Función para cargar datos (se usa al inicio y al guardar una solicitud)
  async function fetchData() {
    const { data, error } = await supabase
      .from('empleados')
      .select(`
        id, nombres, apellidos, cargo, fecha_ingreso,
        empresas (razon_social),
        sedes (nombre),
        saldos_vacacionales (dias_generados, dias_consumidos, dias_vendidos, periodo_anio)
      `)
      .eq('saldos_vacacionales.periodo_anio', 2024)
    
    if (error) {
      console.error('Error cargando data:', error)
    } else {
      setEmpleados(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando Tablero de Control...</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado con Botón de Acción */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Control de Saldos Vacacionales</h1>
            <p className="text-gray-500">Vista consolidada para Gerencia General - Periodo 2024</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <PlusCircle size={20} />
            Nueva Solicitud
          </button>
        </div>

        {/* Tabla Estilo "Excel Moderno" */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-800 uppercase font-bold text-xs">
                <tr>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4 text-center">Ganados</th>
                  <th className="p-4 text-center">Consumidos</th>
                  <th className="p-4 text-center">Vendidos</th>
                  <th className="p-4 text-center bg-blue-50 text-blue-700">Saldo Disp.</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empleados.map((emp) => {
                  const saldoInfo = emp.saldos_vacacionales?.[0] || { dias_generados: 0, dias_consumidos: 0, dias_vendidos: 0 };
                  const saldoDisponible = saldoInfo.dias_generados - saldoInfo.dias_consumidos - saldoInfo.dias_vendidos;
                  
                  return (
                    <tr 
                      key={emp.id} 
                      onClick={() => setEmpleadoSeleccionado(emp)} // <--- CLICK AQUÍ ABRE EL PANEL
                      className="hover:bg-blue-50 transition-colors cursor-pointer group" // <--- CURSOR DE MANO
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {emp.apellidos}, {emp.nombres}
                        </div>
                        <div className="text-xs text-gray-500">{emp.cargo}</div>
                        <div className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                          <Calendar size={12}/> {emp.fecha_ingreso}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Building2 size={14} className="text-gray-400"/> {emp.empresas?.razon_social}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <MapPin size={14} className="text-gray-400"/> {emp.sedes?.nombre}
                        </div>
                      </td>

                      <td className="p-4 text-center font-mono">{saldoInfo.dias_generados}</td>
                      <td className="p-4 text-center font-mono text-orange-600 font-medium">
                        {saldoInfo.dias_consumidos > 0 ? `-${saldoInfo.dias_consumidos}` : '-'}
                      </td>
                      <td className="p-4 text-center font-mono text-green-600 font-medium">
                        {saldoInfo.dias_vendidos > 0 ? `-${saldoInfo.dias_vendidos} ($)` : '-'}
                      </td>

                      <td className="p-4 text-center bg-blue-50">
                        <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                          saldoDisponible > 15 ? 'bg-green-100 text-green-700' :
                          saldoDisponible > 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {saldoDisponible} días
                        </span>
                      </td>

                      <td className="p-4 text-center">
                         {saldoDisponible === 30 ? (
                           <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">Intacto</span>
                         ) : saldoDisponible === 0 ? (
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Agotado</span>
                         ) : (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">En curso</span>
                         )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ZONA DE MODALES --- */}

      {/* 1. Modal de Nueva Solicitud (IA) */}
      {showModal && (
        <NuevaSolicitud 
          empleados={empleados} 
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchData(); // Recargamos para ver el saldo bajar
          }}
        />
      )}

      {/* 2. Panel Lateral de Historial (Auditoría) */}
      {empleadoSeleccionado && (
        <HistorialPanel 
          empleado={empleadoSeleccionado} 
          onClose={() => setEmpleadoSeleccionado(null)} 
        />
      )}

    </div>
  )
}