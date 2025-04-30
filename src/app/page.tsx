// Habilitar el modo cliente de Next.js para usar Hooks de React y características del navegador.
'use client';

// Importaciones de React y Hooks
import React, { useState, useCallback, useEffect, useRef } from 'react';

// Importaciones de componentes locales y servicios
import AgentForm from '@/components/AgentForm';
import { sendDataToN8N, extractN8NResponseText } from '@/services/n8nService';

// Importación de tipos (TypeScript)
import type { N8NInputData, N8NSuccessResponse, N8NErrorResponse } from '@/services/n8nService';

// Importación de Hooks personalizados
import { useToast } from '@/hooks/use-toast';

// Importación de iconos de lucide-react
import { Box, AlertCircle, User } from 'lucide-react';

// Importación de la librería uuid para generar IDs únicos
// NOTA: Necesitas instalar esta librería: npm install uuid @types/uuid
import { v4 as uuidv4 } from 'uuid';

// Definición del tipo para los mensajes del chat, incluyendo un ID único.
interface ChatMessage {
  id: string; // Identificador único para el mensaje
  type: 'user' | 'agent';
  message: string;
}

// Componente principal de la página de inicio
export default function Home() {
  // --- Estados del Componente ---
  const [isLoading, setIsLoading] = useState<boolean>(false); // Indica si se está esperando una respuesta de N8N
  const [error, setError] = useState<string | null>(null); // Almacena cualquier mensaje de error
  // Historial del chat: array de objetos ChatMessage
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // Inicializa como array vacío con el tipo ChatMessage
  // ID de sesión: mantiene la conversación para el agente N8N
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Referencia para desplazar la vista automáticamente al final del chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hook para mostrar notificaciones (toasts)
  const { toast } = useToast();

  // --- Efectos Secundarios (Hooks useEffect) ---

  // Efecto 1: Generar o asegurar un ID de Sesión al montar el componente.
  // Este efecto se ejecuta una vez al cargar la página y se asegura de que tengamos un sessionId.
  useEffect(() => {
    if (!sessionId) {
      // Generar un ID único simple basado en el tiempo y un número aleatorio.
      const uniqueId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log('SESSION: New Session ID Generated:', uniqueId); // Log para depuración
      setSessionId(uniqueId);
    } else {
      console.log('SESSION: Existing Session ID Found:', sessionId); // Log si ya existe un ID
    }
    // Depende de sessionId. Aunque se setea una vez aquí, incluirlo sigue las reglas de los hooks.
  }, [sessionId]);

  // Efecto 2: Añadir el mensaje inicial del agente una vez que se ha establecido el sessionId
  // y el historial del chat está vacío.
  useEffect(() => {
    // Solo añadir el mensaje inicial si tenemos un ID de sesión y el chat está vacío.
    if (sessionId && chatHistory.length === 0) {
        console.log('SESSION: Adding initial agent message for session:', sessionId); // Log
        setChatHistory([{ // Añadir un nuevo mensaje de tipo 'agent' al historial
          id: uuidv4(), // **MEJORA 1: Añadir ID único**
          type: 'agent',
          message: '¡Hola! ¿En qué puedo ayudarte hoy? Escribe tu consulta a continuación.'
        }]);
    }
    // Depende de sessionId y chatHistory.length para asegurar que se ejecuta
    // solo cuando el ID está listo y el chat está inicialmente vacío.
  }, [sessionId, chatHistory.length]); // **MEJORA 2: Ajustar dependencias**

  // Efecto 3: Desplazar la vista al final del chat cada vez que el historial o el estado de carga/error cambia.
  useEffect(() => {
    // Usa el ref para hacer scroll. 'smooth' proporciona una animación suave.
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading, error]); // Depende del historial, estado de carga y error para desplazarse cuando cambian.

  // Obtener la URL del webhook desde las variables de entorno.
  // Asegúrate de que NEXT_PUBLIC_N8N_WEBHOOK_URL esté configurada en tu archivo .env.local
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  // --- Manejador del Formulario ---n
  // Usamos useCallback para memorizar esta función y evitar recrearla innecesariamente.
  const handleFormSubmit = useCallback(async (data: { instruction: string }) => {
    // 1. Validar configuración del Webhook
    if (!webhookUrl) {
        console.error("N8N Webhook URL is not configured. Set NEXT_PUBLIC_N8N_WEBHOOK_URL.");
        toast({
            title: "Error de Configuración",
            description: "La URL del webhook no está configurada. Contacta al administrador.",
            variant: "destructive",
        });
        setError("Error de configuración: URL del webhook no encontrada.");
        return; // Detiene la ejecución si la URL no está configurada
    }

    // 2. Validar ID de Sesión
    if (!sessionId) {
        // Este caso es poco probable si Effect 1 funciona, pero es una verificación de seguridad.
        console.error("SESSION ERROR: Attempted to submit but Session ID is null.");
        toast({
          title: "Error de Sesión",
          description: "No se pudo obtener un ID de sesión. Por favor, refresca la página.",
          variant: "destructive",
        });
        setError("Error de sesión: ID no disponible.");
        return; // Detiene la ejecución si no hay sessionId
    }

    // 3. Prevenir envíos múltiples mientras carga
    if (isLoading) {
        console.warn("SUBMIT: Attempted to submit while already loading.");
        return; // Ignora el envío si ya se está procesando uno
    }

    // 4. Iniciar proceso de envío
    setIsLoading(true); // Activa el estado de carga
    setError(null); // Limpia cualquier error anterior

    // 5. Añadir el mensaje del usuario al historial del chat inmediatamente
    setChatHistory(prevHistory => [...prevHistory, { // Crea un nuevo array con el historial previo y el nuevo mensaje
      id: uuidv4(), // **MEJORA 1: Añadir ID único**
      type: 'user',
      message: data.instruction
    }]);
    console.log(`SUBMIT: Sending instruction for Session ID: ${sessionId}`); // Log

    // 6. Preparar los datos para enviar al webhook, incluyendo el session ID.
    const dataToSend: N8NInputData = {
        instruction: data.instruction,
        sessionId: sessionId, // Incluir el ID de sesión para que N8N mantenga el contexto
    };

    // 7. Enviar los datos al servicio N8N y esperar la respuesta.
    const result = await sendDataToN8N(webhookUrl, dataToSend);

    // 8. Finalizar estado de carga después de recibir la respuesta (éxito o error).
    setIsLoading(false);

    // 9. Procesar el resultado de la llamada al webhook
    if ('error' in result) { // Si la respuesta indica un error (tipo N8NErrorResponse)
      const errorResult = result as N8NErrorResponse;
      console.error('N8N Error:', errorResult); // Log detallado del error

      // Construir un mensaje de error amigable para el usuario
      let userErrorMessage = "Hubo un problema al contactar al agente.";
      // Detectar errores comunes de red o configuración
      if (errorResult.message.includes('Failed to send data') || errorResult.message.includes('Failed to fetch')) {
          userErrorMessage = "No se pudo conectar con el servicio. Verifica tu conexión o la URL del webhook.";
      } else if (errorResult.message) {
          userErrorMessage = `Error del servicio: ${errorResult.message}`;
      }
      // Añadir detalles si están disponibles (evitar mostrar objetos complejos directamente)
      if (errorResult.details && typeof errorResult.details === 'string' && errorResult.details !== errorResult.message) {
          userErrorMessage += ` Detalles: ${errorResult.details}`;
      } else if (errorResult.details && typeof errorResult.details === 'object') {
           // Si es un objeto, loguearlo en consola para el desarrollador.
           userErrorMessage += ` (Más detalles en consola)`;
           console.error('N8N Error Details:', errorResult.details);
      } else if (typeof errorResult.details === 'string') {
           userErrorMessage += ` Detalles: ${errorResult.details}`;
      }

      // Establecer el mensaje de error para mostrar en la UI
      setError(userErrorMessage);

      // Mostrar notificación de error
      toast({
        title: "Error interactuando con N8N",
        description: userErrorMessage, // Mostrar el mensaje amigable
        variant: "destructive",
      });
    } else { // Si la respuesta es exitosa (tipo N8NSuccessResponse)
      const successResult = result as N8NSuccessResponse;
      console.log('N8N Success Response Received (raw):', successResult); // Log de la respuesta cruda

      // Intentar extraer texto relevante de la respuesta de N8N
      const extractedText = extractN8NResponseText(successResult);
      console.log('N8N Extracted Text:', extractedText); // Log del texto extraído

      if (extractedText) {
         // Si se extrajo texto, añadirlo como un mensaje del agente al historial.
        setChatHistory(prevHistory => [...prevHistory, { // Añadir un nuevo mensaje de tipo 'agent'
          id: uuidv4(), // **MEJORA 1: Añadir ID único**
          type: 'agent',
          message: extractedText
        }]);
      } else {
         // Si no se extrajo texto (ej. respuesta vacía o formato inesperado).
         console.warn('N8N response received, but no displayable text extracted.', successResult);
         // Opcionalmente, mostrar una notificación informativa.
          toast({
              title: "Respuesta Recibida",
              description: "No se encontró texto para mostrar en la respuesta.",
              variant: "default",
          });
      }
    }

  }, [webhookUrl, toast, sessionId]); // **MEJORA 3: Eliminar 'isLoading' de dependencias**
  // Las dependencias ahora son webhookUrl, toast y sessionId.

  // --- Renderizado (JSX) ---
  return (
    // Contenedor principal de la página con estilos de diseño y centrado
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 md:p-12 lg:p-16 bg-gradient-to-br from-secondary via-background to-primary/10">
      {/* Contenedor de ancho limitado y altura ajustada */}
      <div className="w-full max-w-3xl space-y-4 flex flex-col h-[calc(100vh-4rem)]"> {/* Ajuste de altura */}

        {/* Sección del encabezado */}
        <div className="text-center space-y-2 flex-shrink-0 pt-4"> {/* Padding superior */}
           <Box className="mx-auto h-12 w-12 text-primary" /> {/* Icono principal */}
           <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
             Code epico {/* Título */}
           </h1>
           <p className="text-muted-foreground">
             IA epic {/* Subtítulo */}
           </p>
        </div>

        {/* Área de visualización del historial del chat */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background/50 rounded-md border scroll-smooth"> {/* Área de scroll con fondo semitransparente */}
          {/* Mapear y mostrar cada mensaje en el historial */}
          {chatHistory.map((msg) => (
            // Contenedor del mensaje: alineación basada en si es usuario o agente
            <div key={msg.id} className={`flex items-start space-x-3 ${msg.type === 'user' ? 'justify-end' : ''}`}> {/* **MEJORA 1: Usar msg.id como key** */}
              {/* Icono del agente (si el mensaje es del agente) */}
              {msg.type === 'agent' && (
                 <div className="flex-shrink-0 pt-1">
                   <Box className="h-6 w-6 text-primary" /> {/* Icono para mensajes del agente */}
                 </div>
              )}
              {/* Burbuja del mensaje */}
              <div className={`p-3 rounded-xl max-w-[80%] shadow-sm ${msg.type === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card text-card-foreground rounded-bl-sm'}`}> {/* Estilos condicionales para burbujas de usuario/agente */}
                {/* Texto del mensaje: respeta saltos de línea y ajusta palabras largas */}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
              {/* Icono del usuario (si el mensaje es del usuario) */}
              {msg.type === 'user' && (
                 <div className="flex-shrink-0 pt-1">
                    <User className="h-6 w-6 text-muted-foreground" /> {/* Icono para mensajes del usuario */}
                 </div>
              )}
            </div>
          ))}
           {/* Indicador de carga mientras se espera respuesta */}
           {isLoading && (
             <div className="flex items-start space-x-3 animate-fade-in"> {/* Animación de aparición */}
                 <div className="flex-shrink-0 pt-1">
                   <Box className="h-6 w-6 text-primary animate-pulse" /> {/* Icono con animación de pulso */}
                 </div>
                 <div className="p-3 rounded-lg bg-card text-card-foreground max-w-[80%] shadow-sm"> {/* Estilo similar a la burbuja del agente */}
                    {/* Animación de puntos suspensivos para indicar escritura */}
                    <p className="text-sm">
                      Escribiendo<span className="animate-[pulse_1s_ease-in-out_infinite]">.</span><span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
                    </p>
                 </div>
             </div>
           )}
           {/* Área para mostrar mensajes de error */}
            {error && !isLoading && ( // Mostrar error solo si hay un error y no se está cargando
                 <div className="flex items-center justify-center space-x-2 p-2 bg-destructive/10 text-destructive rounded-md border border-destructive/30 animate-fade-in"> {/* Estilos para resaltar el error */}
                    <AlertCircle className="h-5 w-5 flex-shrink-0" /> {/* Icono de alerta */}
                    <p className="text-sm text-center">{error}</p>
                 </div>
            )}
            {/* Elemento invisible para facilitar el desplazamiento automático al final */}
            <div ref={chatEndRef} />
        </div>

        {/* Sección del formulario de entrada en la parte inferior */}
        <div className="flex-shrink-0 pb-4"> {/* Padding inferior */}
           {/* Componente del formulario, pasa el manejador y el estado de carga */}
           <AgentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
           {/* Advertencia si la URL del webhook no está configurada */}
           {!webhookUrl && (
              <p className="text-xs text-destructive text-center mt-2">
                Advertencia: La URL del webhook de N8N no está configurada. La aplicación no funcionará correctamente.
              </p>
            )}
        </div>

      </div>
    </main>
  );
}
