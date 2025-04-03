import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatAgent() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi, I'm NauMah, your AI companion through this beautiful journey of 9 months. How can I help you today?",
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Store the input value to handle reference within async operations
    const currentInput = inputValue.trim();
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Setup timeout and abort controller for the request
    // Setup request timeout
    const controller = new AbortController();
    let timeoutId: number | null = null;
    
    // Always use setTimeout for compatibility 
    timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      console.log("Sending chat request:", currentInput);
      const response = await apiRequest<{response: string}>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: currentInput
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      console.log("Chat response received:", response);

      // Clear timeout if we used the fallback method
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response || !response.response) {
        throw new Error("Empty or invalid response from server");
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'An error occurred. Please try again.';
      let status = 500;
      
      if (error instanceof Response) {
        status = error.status;
        const data = await error.json();
        errorMessage = data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: status === 503 ? 'Service Unavailable' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Card className="w-full h-[600px] flex flex-col bg-background rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transform-gpu hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="shrink-0">
        <CardTitle className="text-primary">Chat with NauMah</CardTitle>
        <CardDescription className="mt-1.5 text-foreground/80">Hi, I'm NauMah. Your AI companion for this beautiful 9 month journey. How can I assist you today?</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[calc(600px-10rem)] px-6">
          <div className="space-y-4 pr-4 py-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.02] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted/90 shadow-md'
                  }`}
                >
                  <div className="text-sm text-current whitespace-pre-line">
                    {message.content.replace(/\n{3,}/g, '\n\n').split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-2 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {message.role === 'assistant' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.content.includes('?') && 
                        message.content
                          .split('?')
                          .slice(1)
                          .map((suggestion, i) => 
                            suggestion.trim() && (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs border-primary/20 text-primary hover:bg-primary/5 hover:text-primary/90 px-3 py-1 h-auto"
                                onClick={() => {
                                  setInputValue(suggestion.trim() + '?');
                                  handleSendMessage();
                                }}
                              >
                                {suggestion.trim() + '?'}
                              </Button>
                            )
                          )
                      }
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}