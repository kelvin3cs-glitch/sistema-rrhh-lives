import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { X, Calendar, Clock, FileText, DollarSign, UserCheck } from 'lucide-react'

export default function HistorialPanel({ empleado, onClose }) {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistorial() {
      if (!empleado) return;
      
      const { data, error } = await supabase
        .from('movimientos_vacaciones')
        .select(`
          *,
          reemplazo:reemplazo_id (nombres, apellidos)
        `)
        .eq('empleado_id', empleado.id)
        .order('created_at', { ascending: false }) // Los más recientes primero

      if (error) console.error(error)
      else setMovimientos(data)
      
      setLoading(false)
    }

    fetchHistorial()
  }, [empleado])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay oscuro (clic afuera para cerrar) */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Panel Lateral */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Cabecera del Panel */}
        <div className="p-6 bg-gray-900 text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{empleado.nombres} {empleado.apellidos}</h2>
            <p className="text-gray-400 text-sm mt-1">{empleado.cargo}</p>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Historial */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Historial de Movimientos
          </h3>

          {loading ? (
            <p className="text-center text-gray-500 py-10">Buscando expedientes...</p>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No hay registros aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movimientos.map((mov) => (
                <div key={mov.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                  
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {mov.tipo === 'VENTA_DE_DIAS' ? (
                        <div className="bg-green-100 p-1.5 rounded text-green-700"><DollarSign size={16}/></div>
                      ) : (
                        <div className="bg-blue-100 p-1.5 rounded text-blue-700"><Calendar size={16}/></div>
                      )}
                      <div>
                        <span className="block font-bold text-gray-800 text-sm">
                          {mov.tipo === 'GOCE_FISICO' ? 'Vacaciones' : 'Venta de Días'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Registrado el {new Date(mov.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gray-700 text-lg">
                      -{mov.cantidad_dias} días
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="text-sm text-gray-600 space-y-2 mt-3 pl-9">
                    {/* Fechas */}
                    {mov.fecha_inicio && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400"/>
                        <span>Del <b>{mov.fecha_inicio}</b> al <b>{mov.fecha_fin}</b></span>
                      </div>
                    )}

                    {/* Reemplazo */}
                    {mov.reemplazo && (
                      <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                        <UserCheck size={14}/>
                        <span>Cubre: {mov.reemplazo.apellidos}</span>
                      </div>
                    )}

                    {/* Análisis de IA (Motivo) */}
                    {mov.meta_datos_ia?.motivo && (
                      <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 flex gap-2">
                        <FileText size={14} className="shrink-0 mt-0.5"/>
                        <p>"{mov.meta_datos_ia.motivo}"</p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}