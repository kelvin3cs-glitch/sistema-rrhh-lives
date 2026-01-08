import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  isWithinInterval, parseISO 
} from 'date-fns'
import { es } from 'date-fns/locale' // Para español

export default function CalendarioVacaciones() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Cargar movimientos del mes (y alrededores)
  useEffect(() => {
    async function fetchMovimientos() {
      setLoading(true)
      
      // Buscamos movimientos que NO sean cancelados
      const { data, error } = await supabase
        .from('movimientos_vacaciones')
        .select(`
          id, fecha_inicio, fecha_fin, cantidad_dias, tipo,
          empleados (nombres, apellidos)
        `)
        .neq('estado', 'CANCELADO') 
        .neq('tipo', 'VENTA_DE_DIAS') // Solo nos importa GOCE_FISICO para el calendario
      
      if (error) console.error(error)
      else setMovimientos(data)
      
      setLoading(false)
    }

    fetchMovimientos()
  }, [currentDate])

  // 2. Cálculos para dibujar la cuadrícula
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Semana empieza Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // Funciones de navegación
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      
      {/* HEADER DEL CALENDARIO */}
      <div className="p-4 flex items-center justify-between bg-gray-50 border-b">
        <h2 className="text-xl font-bold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft size={20}/></button>
          <button onClick={goToToday} className="px-3 py-1 text-sm font-medium hover:bg-gray-200 rounded-md">Hoy</button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* GRILLA DE DÍAS DE LA SEMANA */}
      <div className="grid grid-cols-7 bg-gray-100 border-b">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* CUERPO DEL CALENDARIO */}
      <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
        {calendarDays.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())
          
          // Buscar eventos en este día
          const eventosDelDia = movimientos.filter(mov => {
            if (!mov.fecha_inicio) return false // Seguridad
            // Ajuste simple: Verificamos si el día cae dentro del rango
            // Nota: fecha_fin en BD a veces es null si no se calculó, usamos inicio + dias
            const inicio = parseISO(mov.fecha_inicio)
            // Calculamos fin estimado si no existe
            const fin = mov.fecha_fin ? parseISO(mov.fecha_fin) : new Date(inicio.getTime() + (mov.cantidad_dias * 86400000))
            
            return isWithinInterval(day, { start: inicio, end: fin })
          })

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[100px] bg-white p-2 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}
            >
              {/* Número del día */}
              <div className={`text-right text-sm font-medium mb-1 ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                <span className={isToday ? 'bg-blue-100 px-2 py-0.5 rounded-full' : ''}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Barritas de Eventos */}
              <div className="space-y-1">
                {eventosDelDia.map((evento) => (
                  <div 
                    key={evento.id} 
                    className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-1 rounded border-l-2 border-indigo-500 truncate font-medium flex items-center gap-1"
                    title={`${evento.empleados.nombres} (${evento.cantidad_dias} días)`}
                  >
                    <User size={10} />
                    {evento.empleados.apellidos}
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