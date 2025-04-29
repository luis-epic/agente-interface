'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from 'lucide-react';

interface WebhookDisplayProps {
  webhookUrl: string;
}

const WebhookDisplay: React.FC<WebhookDisplayProps> = ({ webhookUrl }) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
      .then(() => {
        toast({
          title: "Copiado!",
          description: "Webhook URL copiada al portapapeles.",
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Error",
          description: "No se pudo copiar la URL.",
          variant: "destructive",
        });
      });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Webhook URL</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-2">
        <Input
          type="text"
          value={webhookUrl}
          readOnly
          className="flex-grow bg-muted text-foreground focus-visible:ring-primary"
          aria-label="Webhook URL"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary"
          aria-label="Copiar Webhook URL"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default WebhookDisplay;
