'use client';

import React, { useState, useCallback } from 'react';
import WebhookDisplay from '@/components/WebhookDisplay';
import AgentForm from '@/components/AgentForm';
import ResponseDisplay from '@/components/ResponseDisplay';
import { sendDataToN8N, extractN8NResponseText } from '@/services/n8nService';
import type { N8NInputData, N8NSuccessResponse, N8NErrorResponse } from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react'; // Using Bot icon for title


export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://luis-epico.app.n8n.cloud/webhook-test/input'; // Use environment variable or default

  const handleFormSubmit = useCallback(async (data: N8NInputData) => {
    setIsLoading(true);
    setAgentResponse(null);
    setError(null);

    const result = await sendDataToN8N(webhookUrl, data);

    if ('error' in result) { // Check if it's an N8NErrorResponse
      const errorResult = result as N8NErrorResponse;
      console.error('N8N Error:', errorResult);
      const errorMessage = `${errorResult.message}${errorResult.details ? ` Details: ${typeof errorResult.details === 'string' ? errorResult.details : JSON.stringify(errorResult.details)}` : ''}`;
      setError(errorMessage);
      toast({
        title: "Error interactuando con N8n",
        description: errorResult.message, // Show concise message in toast
        variant: "destructive",
      });
    } else {
      const successResult = result as N8NSuccessResponse;
      console.log('N8N Success Response:', successResult);
      const extractedText = extractN8NResponseText(successResult);

      if (extractedText) {
        setAgentResponse(extractedText);
        toast({
          title: "¡Éxito!",
          description: "Respuesta recibida de N8n.",
          variant: "default", // Use default variant for success
        });
      } else {
         // Handle cases where the response format is unexpected but not technically an error
         console.warn('N8n response received, but no standard text field (message/output/text) found.', successResult);
         setAgentResponse(JSON.stringify(successResult, null, 2)); // Show raw JSON as fallback
         toast({
             title: "Respuesta Recibida",
             description: "Formato de respuesta no estándar, mostrando datos crudos.",
             variant: "default",
         });
      }
    }

    setIsLoading(false);
  }, [webhookUrl, toast]); // Add dependencies

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 md:p-12 lg:p-16 bg-gradient-to-br from-secondary via-background to-primary/10">
      <div className="w-full max-w-2xl space-y-8">

        <div className="text-center space-y-2">
           <Bot className="mx-auto h-12 w-12 text-primary" />
           <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
             N8N Agent Interface
           </h1>
           <p className="text-muted-foreground">
             Interactúa con tu workflow de N8N fácilmente.
           </p>
        </div>


        <WebhookDisplay webhookUrl={webhookUrl} />

        <AgentForm onSubmit={handleFormSubmit} isLoading={isLoading} />

        {/* Conditionally render ResponseDisplay based on loading, error, or response */}
        {(isLoading || error || agentResponse !== null) && (
            <ResponseDisplay response={agentResponse} error={error} isLoading={isLoading} />
        )}

      </div>
    </main>
  );
}
