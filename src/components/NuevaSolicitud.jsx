import { useState } from 'react'
import { Sparkles, Save, X } from 'lucide-react'
import { analizarSolicitud } from '../services/ai'
import { supabase } from '../supabase/client'

export default function NuevaSolicitud({ empleados, onClose, onSuccess }) {
  const [texto, setTexto] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    empleado_id: '',
    fecha_inicio: '',
    cantidad_dias: 15,
    reemplazo_id: '',
    tipo: 'GOCE_FISICO',
    meta_datos_ia: {}
  })

  // 🤖 LA MAGIA: Función que llama a Groq
  const handleMagic = async () => {
    if (!texto) return;
    setLoadingIA(true);
    
    const resultado = await analizarSolicitud(texto, empleados);
    
    if (resultado) {
      setFormData({
        ...formData,
        empleado_id: resultado.empleado_id || '',
        fecha_inicio: resultado.fecha_inicio || '',
        cantidad_dias: resultado.cantidad_dias || 15,
        reemplazo_id: resultado.reemplazo_id || '',
        tipo: resultado.tipo || 'GOCE_FISICO',
        meta_datos_ia: { texto_original: texto, motivo: resultado.motivo_detectado }
      });
    } else {
      alert("No pude entender la solicitud. Intenta ser más específico.");
    }
    setLoadingIA(false);
  }

  // Guardar en Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🧹 LIMPIEZA DE DATOS (Sanitización)
    // PostgreSQL odia los strings vacíos "" en campos UUID. Debemos convertirlos a null.
    const datosParaEnviar = {
      ...formData,
      reemplazo_id: formData.reemplazo_id === "" ? null : formData.reemplazo_id
    };
    
    const { error } = await supabase
      .from('movimientos_vacaciones')
      .insert([datosParaEnviar]); // <--- Enviamos la versión limpia

    if (error) {
      alert('Error guardando: ' + error.message);
    } else {
      alert('¡Solicitud Creada con Éxito!');
      onSuccess();
      onClose();
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Header IA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-300" /> Asistente de Solicitudes
            </h2>
            <button onClick={onClose}><X /></button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Escribe naturalmente. Ej: "Maria sale 7 días desde el lunes y Pedro la cubre".
          </p>
        </div>

        <div className="p-6">
          {/* Área de Texto Mágico */}
          <div className="mb-6 relative">
            <textarea
              className="w-full p-4 border-2 border-indigo-100 rounded-lg focus:border-indigo-500 focus:ring-0 text-gray-700 resize-none h-24"
              placeholder="Escribe aquí los detalles del acuerdo verbal..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button
              onClick={handleMagic}
              disabled={loadingIA || !texto}
              className="absolute bottom-3 right-3 bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loadingIA ? 'Analizando...' : <><Sparkles size={14}/> Auto-completar</>}
            </button>
          </div>

          <hr className="mb-6 border-gray-100" />

          {/* Formulario Estándar (Se llena solo) */}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Colaborador</label>
              <select 
                className="w-full p-2 border rounded mt-1 bg-gray-50"
                value={formData.empleado_id}
                onChange={e => setFormData({...formData, empleado_id: e.target.value})}
                required
              >
                <option value="">Seleccione...</option>
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.apellidos}, {e.nombres}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded mt-1"
                value={formData.fecha_inicio}
                onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Días</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded mt-1"
                value={formData.cantidad_dias}
                onChange={e => setFormData({...formData, cantidad_dias: e.target.value})}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Reemplazo (Cobertura)</label>
              <select 
                className="w-full p-2 border rounded mt-1"
                value={formData.reemplazo_id}
                onChange={e => setFormData({...formData, reemplazo_id: e.target.value})}
              >
                <option value="">-- Sin Reemplazo --</option>
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.apellidos}, {e.nombres}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 mt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2">
                <Save size={18} /> Registrar Solicitud
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}