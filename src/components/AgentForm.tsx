'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed Card imports
import { Loader2 } from 'lucide-react'; // Use lucide loader icon

interface AgentFormProps {
  onSubmit: (data: { instruction: string }) => Promise<void>; // Corrected data structure to instruction
  isLoading: boolean;
}

const AgentForm: React.FC<AgentFormProps> = ({ onSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) return; // Prevent sending empty messages
    await onSubmit({ instruction: inputValue }); // Pass instruction instead of input
    setInputValue(''); // Clear input after submit
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 bg-background/70 rounded-md border">
      {/* Removed Card, CardHeader, CardContent, CardFooter */}
      {/* Removed Label and div.space-y-2 for simpler chat input */}
      <Input
        id="agentInput"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        className="flex-grow focus-visible:ring-primary" // Use primary color for focus ring, flex-grow to fill space
        disabled={isLoading}
        required // Keep input required
      />
      <Button
        type="submit"
        className="bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 focus-visible:ring-ring flex-shrink-0" // Use accent for button, flex-shrink-0 to prevent shrinking
        disabled={isLoading || !inputValue.trim()} // Disable if loading or input is empty/whitespace
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" /> // Only show loader icon in button
        ) : (
          'Enviar' // Simpler button text
        )}
      </Button>
    </form>
  );
};

export default AgentForm;
