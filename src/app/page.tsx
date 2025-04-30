'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import AgentForm from '@/components/AgentForm';
import { sendDataToN8N, extractN8NResponseText } from '@/services/n8nService';
import type { N8NInputData, N8NSuccessResponse, N8NErrorResponse } from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';
import { Box, AlertCircle, User } from 'lucide-react';


export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'agent', message: string}>>([]); // Initialize empty
  const [sessionId, setSessionId] = useState<string | null>(null); // State for session ID
  const chatEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling to the bottom

  const { toast } = useToast();

  // Effect 1: Generate Session ID on mount if it doesn't exist
  useEffect(() => {
    if (!sessionId) {
      const uniqueId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log('Generated Session ID:', uniqueId); // Log session ID generation
      setSessionId(uniqueId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount to generate ID
  }, []); // Empty dependency array ensures this runs only once on initial mount

  // Effect 2: Add initial agent message once sessionId is set and chat is empty
  useEffect(() => {
    // Only add the initial message if we have a session ID and the chat is currently empty
    if (sessionId && chatHistory.length === 0) {
      setChatHistory([{
        type: 'agent',
        message: '¡Hola! ¿En qué puedo ayudarte hoy? Escribe tu consulta a continuación.'
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run only when sessionId changes or chatHistory becomes empty initially
  }, [sessionId]); // Depend only on sessionId

  // Effect 3: Scroll to bottom whenever chat history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading, error]); // Add isLoading and error to dependencies to scroll during loading/error

  // Webhook URL is now fixed or from env, not displayed/editable in UI
  // Ensure NEXT_PUBLIC_N8N_WEBHOOK_URL is set in your .env.local or environment variables
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  const handleFormSubmit = useCallback(async (data: { instruction: string }) => {
    // Ensure webhook URL is configured
    if (!webhookUrl) {
        console.error("N8N Webhook URL is not configured. Set NEXT_PUBLIC_N8N_WEBHOOK_URL.");
        toast({
            title: "Error de Configuración",
            description: "La URL del webhook no está configurada. Contacta al administrador.",
            variant: "destructive",
        });
        setError("Error de configuración: URL del webhook no encontrada.");
        return;
    }

    if (!sessionId) {
        console.error("Session ID not generated yet.");
        toast({
          title: "Error de Sesión",
          description: "No se pudo obtener un ID de sesión. Por favor, refresca la página.",
          variant: "destructive",
        });
        setError("Error de sesión: ID no disponible.");
        return;
    }
    // Prevent sending if already loading
    if (isLoading) return;

    setIsLoading(true);
    setError(null); // Clear previous error on new submission

    // Add user message to chat history
    setChatHistory(prevHistory => [...prevHistory, { type: 'user', message: data.instruction }]);
    console.log('Sending data with Session ID:', sessionId); // Log session ID being sent

    // Prepare data to send, including the session ID
    const dataToSend: N8NInputData = {
        instruction: data.instruction,
        sessionId: sessionId, // Include session ID here
    };

    const result = await sendDataToN8N(webhookUrl, dataToSend);

    setIsLoading(false); // Set loading false *after* receiving response

    if ('error' in result) { // Check if it's an N8NErrorResponse
      const errorResult = result as N8NErrorResponse;
      console.error('N8N Error:', errorResult);
      // Construct a user-friendly error message
      let userErrorMessage = "Hubo un problema al contactar al agente.";
      if (errorResult.message.includes('Failed to send data') || errorResult.message.includes('Failed to fetch')) {
          userErrorMessage = "No se pudo conectar con el servicio. Verifica tu conexión o la URL del webhook.";
      } else if (errorResult.message) {
          userErrorMessage = `Error del servicio: ${errorResult.message}`;
      }
      // Add detailed info if available, but keep it concise for the user
      if (errorResult.details && typeof errorResult.details === 'string' && errorResult.details !== errorResult.message) {
          userErrorMessage += ` Detalles: ${errorResult.details}`;
      } else if (errorResult.details && typeof errorResult.details === 'object') {
           // Avoid showing complex objects directly
           userErrorMessage += ` (Más detalles en consola)`;
           console.error('N8N Error Details:', errorResult.details); // Log details object
      } else if (typeof errorResult.details === 'string') {
           userErrorMessage += ` Detalles: ${errorResult.details}`; // Show string details
      }


      setError(userErrorMessage); // Set the refined error message for display

      toast({
        title: "Error interactuando con N8N",
        description: userErrorMessage, // Show user-friendly message in toast
        variant: "destructive",
      });
    } else {
      const successResult = result as N8NSuccessResponse;
      console.log('N8N Success Response:', successResult);
      const extractedText = extractN8NResponseText(successResult);

      if (extractedText) {
         // Add agent response to chat history
        setChatHistory(prevHistory => [...prevHistory, { type: 'agent', message: extractedText }]);
      } else {
         // Handle cases where the response format is unexpected but not technically an error
         console.warn('N8N response received, but no standard text field (message/output/text) found.', successResult);
         // Check if the response contains the specific unwanted message
         const unwantedMessage = "Parece que has compartido un identificador de sesión.";
         if (JSON.stringify(successResult).includes(unwantedMessage)) {
            console.log("Filtering out session ID message from N8N.");
            // Optionally add a generic "Thinking..." or similar message instead of the raw output
            // setChatHistory(prevHistory => [...prevHistory, { type: 'agent', message: 'Procesando...' }]);
         } else {
             const fallbackMessage = JSON.stringify(successResult, null, 2);
              // Add fallback message to chat history only if it's not the unwanted session message
             setChatHistory(prevHistory => [...prevHistory, { type: 'agent', message: `Respuesta no estándar:\n\`\`\`json\n${fallbackMessage}\n\`\`\`` }]);
             toast({
                 title: "Respuesta Recibida",
                 description: "Formato de respuesta no estándar, mostrando datos crudos.",
                 variant: "default",
             });
         }
      }
    }

  }, [webhookUrl, toast, sessionId, isLoading]); // Added isLoading and sessionId to dependencies

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 md:p-12 lg:p-16 bg-gradient-to-br from-secondary via-background to-primary/10">
      {/* Increased max-width and adjusted vertical height calculation */}
      <div className="w-full max-w-3xl space-y-4 flex flex-col h-[calc(100vh-4rem)]"> {/* Reduced bottom padding effect */}

        <div className="text-center space-y-2 flex-shrink-0 pt-4"> {/* Added padding top */}
           <Box className="mx-auto h-12 w-12 text-primary" /> {/* Changed icon to Box */}
           <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
             Code epico {/* Changed title */}
           </h1>
           <p className="text-muted-foreground">
             IA epic {/* Changed subtitle */}
           </p>
        </div>

        {/* Chat history display area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-background/50 rounded-md border scroll-smooth">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-start space-x-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
              {msg.type === 'agent' && (
                 <div className="flex-shrink-0 pt-1">
                   <Box className="h-6 w-6 text-primary" /> {/* Changed icon to Box for agent messages */}
                 </div>
              )}
              {/* Message Bubble */}
              <div className={`p-3 rounded-xl max-w-[80%] shadow-sm ${msg.type === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card text-card-foreground rounded-bl-sm'}`}>
                {/* Use pre-wrap to respect newlines and break-words for long text */}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
              {msg.type === 'user' && (
                 <div className="flex-shrink-0 pt-1">
                    {/* Using a simple User icon for user messages */}
                    <User className="h-6 w-6 text-muted-foreground" />
                 </div>
              )}
            </div>
          ))}
           {isLoading && (
             <div className="flex items-start space-x-3 animate-fade-in">
                 <div className="flex-shrink-0 pt-1">
                   <Box className="h-6 w-6 text-primary animate-pulse" /> {/* Changed loading icon animation */}
                 </div>
                 <div className="p-3 rounded-lg bg-card text-card-foreground max-w-[80%] shadow-sm"> {/* Matched agent bubble style */}
                    {/* Typing indicator with dots */}
                    <p className="text-sm">
                      Escribiendo<span className="animate-[pulse_1s_ease-in-out_infinite]">.</span><span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
                    </p>
                 </div>
             </div>
           )}
           {/* Error message display within chat history area but styled differently */}
            {error && !isLoading && ( // Only show if not loading
                 <div className="flex items-center justify-center space-x-2 p-2 bg-destructive/10 text-destructive rounded-md border border-destructive/30 animate-fade-in">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm text-center">{error}</p>
                 </div>
            )}
            {/* Invisible element to mark the end for scrolling */}
            <div ref={chatEndRef} />
        </div>


        {/* Input form at the bottom */}
        <div className="flex-shrink-0 pb-4"> {/* Added padding bottom */}
           <AgentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
           {!webhookUrl && ( // Display a warning if the webhook URL is not set
              <p className="text-xs text-destructive text-center mt-2">
                Advertencia: La URL del webhook de N8N no está configurada. La aplicación no funcionará correctamente.
              </p>
            )}
        </div>


      </div>
    </main>
  );
}
