'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react'; // Use lucide loader icon

interface AgentFormProps {
  onSubmit: (data: { input: string }) => Promise<void>; // Specify the expected data structure
  isLoading: boolean;
}

const AgentForm: React.FC<AgentFormProps> = ({ onSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ input: inputValue });
    // Optionally clear input after submit: setInputValue('');
  };

  return (
    <Card className="w-full shadow-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">Enviar Mensaje al Agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentInput" className="text-foreground/80">Tu Instrucción:</Label>
            <Input
              id="agentInput"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="focus-visible:ring-primary" // Use primary color for focus ring
              disabled={isLoading}
              required // Make input required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 focus-visible:ring-ring" // Use accent for button
            disabled={isLoading || !inputValue.trim()} // Disable if loading or input is empty/whitespace
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar a N8n'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AgentForm;
