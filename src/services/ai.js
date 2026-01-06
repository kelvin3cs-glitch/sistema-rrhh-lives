import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Necesario para demos frontend
  baseURL: 'https://api.groq.com/openai/v1'
});

export async function analizarSolicitud(texto, listaEmpleados) {
  // 1. Preparamos una lista simplificada de empleados para que la IA sepa quién es quién
  const contextoEmpleados = listaEmpleados.map(e => 
    `${e.nombres} ${e.apellidos} (ID: ${e.id})`
  ).join('\n');

  const systemPrompt = `
    Eres un asistente de RRHH experto. Tu trabajo es extraer datos estructurados de una solicitud de vacaciones.
    
    Contexto de Empleados disponibles:
    ${contextoEmpleados}

    Hoy es: ${new Date().toLocaleDateString()}

    Reglas:
    1. Identifica al empleado que sale (empleado_id).
    2. Identifica la fecha de inicio (YYYY-MM-DD).
    3. Calcula la cantidad de días.
    4. Identifica si hay un reemplazo mencionado (reemplazo_id).
    5. Determina el tipo: 'GOCE_FISICO' (vacaciones normales) o 'VENTA_DE_DIAS' (si mencionan vender, pagar, cash).
    
    Responde SOLO con un JSON válido con este formato:
    {
      "empleado_id": "uuid...",
      "fecha_inicio": "YYYY-MM-DD",
      "cantidad_dias": 0,
      "reemplazo_id": "uuid... o null",
      "tipo": "GOCE_FISICO",
      "motivo_detectado": "resumen del texto"
    }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: texto }
      ],
      // Reemplaza la línea vieja por esta nueva:
      model: 'llama-3.3-70b-versatile',
      temperature: 0, // 0 = Sé preciso, no creativo
      response_format: { type: "json_object" } // Forzamos a que devuelva JSON
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error IA:", error);
    return null;
  }
}