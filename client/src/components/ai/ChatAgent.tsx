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

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: userMessage.content
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
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
    <Card className="w-full h-[600px] flex flex-col rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transform-gpu hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="shrink-0">
        <CardTitle>Chat with NauMah</CardTitle>
        <CardDescription>Hi, I'm NauMah. You AI companion for this beautiful 9 month journey. How can I assist you today? Ask questions about your pregnancy, health concerns, or baby development</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(600px-10rem)]">
          <div className="space-y-4 pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.02] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-lg'
                      : 'bg-gradient-to-r from-muted/50 to-muted-foreground/5 shadow-md backdrop-blur-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  {message.role === 'assistant' && (
                    <div className="mt-3 space-y-2">
                      {message.content.split('?').slice(1).map((suggestion, i) => 
                        suggestion.trim() && (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary-dark"
                            onClick={() => {
                              setInputValue(suggestion.trim() + '?');
                              handleSendMessage();
                            }}
                          >
                            {suggestion.trim() + '?'}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
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