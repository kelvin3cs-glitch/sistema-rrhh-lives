import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  isWithinInterval, parseISO, addDays 
} from 'date-fns'
import { es } from 'date-fns/locale'

export default function CalendarioVacaciones() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Cargar movimientos
  useEffect(() => {
    async function fetchMovimientos() {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('movimientos_vacaciones')
        .select(`
          id, fecha_inicio, fecha_fin, cantidad_dias, tipo,
          empleados!empleado_id (nombres, apellidos) 
        `) 
        // 👆 OJO AQUÍ: Agregamos "!empleado_id" para decirle a Supabase 
        // explícitamente qué relación usar y evitar el error de ambigüedad.
        
        .neq('estado', 'CANCELADO')
      
      if (error) {
        console.error("Error cargando calendario:", error)
      } else {
        console.log("📅 Eventos cargados:", data)
        setMovimientos(data)
      }
      
      setLoading(false)
    }

    fetchMovimientos()
  }, [currentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between bg-gray-50 border-b">
        <h2 className="text-xl font-bold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-gray-200 rounded-md">Hoy</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-200 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* DÍAS SEMANA */}
      <div className="grid grid-cols-7 bg-gray-100 border-b">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* GRILLA */}
      <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())
          
          const eventosDelDia = movimientos.filter(mov => {
            if (!mov.fecha_inicio) return false;

            const inicio = parseISO(mov.fecha_inicio)
            // Calculamos fin: fecha_fin o (inicio + dias - 1)
            const diasDuracion = mov.cantidad_dias > 0 ? mov.cantidad_dias - 1 : 0;
            const fin = mov.fecha_fin 
              ? parseISO(mov.fecha_fin) 
              : addDays(inicio, diasDuracion);

            return isWithinInterval(day, { start: inicio, end: fin })
          })

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[100px] bg-white p-2 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}
            >
              <div className={`text-right text-sm font-medium mb-1 ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                <span className={isToday ? 'bg-blue-100 px-2 py-0.5 rounded-full' : ''}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {eventosDelDia.map((evento) => (
                  <div 
                    key={evento.id} 
                    className={`text-[10px] px-1.5 py-1 rounded border-l-2 truncate font-medium flex items-center gap-1 cursor-help
                      ${evento.tipo === 'VENTA_DE_DIAS' 
                        ? 'bg-green-100 text-green-700 border-green-500' 
                        : 'bg-indigo-100 text-indigo-700 border-indigo-500'}`}
                    title={`${evento.empleados?.nombres} ${evento.empleados?.apellidos} (${evento.cantidad_dias} días)`}
                  >
                    <User size={10} />
                    {/* Nota: Ahora accedemos a "empleados" correctamente gracias al fix en el select */}
                    {evento.empleados?.apellidos || 'Desconocido'}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}