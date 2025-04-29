import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResponseDisplayProps {
  response: string | null;
  error: string | null;
  isLoading: boolean;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, error, isLoading }) => {
  if (isLoading) {
    // Optional: Could show a skeleton loader here instead of nothing
    return null;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6 animate-fade-in">
         <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (response !== null) {
    return (
      <Card className="mt-6 w-full shadow-md animate-fade-in bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
            Respuesta del Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Use pre-wrap to respect newlines and spacing from the response */}
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans bg-background/50 p-4 rounded-md border">
            {response}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // Render nothing if there's no response, no error, and not loading
  return null;
};

export default ResponseDisplay;
