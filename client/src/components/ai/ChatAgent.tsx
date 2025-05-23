import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatAgent() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  const getWelcomeMessage = () => {
    return language === 'hi' ? 
      "नमस्ते! मैं नौमा हूँ, आपका गर्भावस्था साथी। आज मैं आपकी कैसे मदद कर सकता हूँ?" : 
      "Welcome! I'm NauMah, your pregnancy companion. How can I help you today?";
  };

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: getWelcomeMessage(),
    timestamp: new Date()
  }]);
  
  // Update welcome message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date()
      }]);
    }
  }, [language]);
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
      // Make API request with more robust error handling
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: currentInput
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Handle HTTP errors explicitly
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If the response cannot be parsed as JSON
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      if (!data || !data.response) {
        throw new Error("Empty or invalid response from server");
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add a fallback message
      const errorMessage: Message = {
        role: 'assistant',
        content: language === 'hi' 
          ? "मुझे खेद है, मुझे अभी सर्वर से कनेक्ट करने में परेशानी हो रही है। कृपया एक क्षण बाद फिर से प्रयास करें।"
          : "I'm sorry, I'm having trouble connecting to the server right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Show error toast
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to the server',
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
        <CardTitle className="text-primary">{t('chat.title')}</CardTitle>
        <CardDescription className="mt-1.5 text-foreground/80">{t('chat.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[calc(600px-10rem)] px-6">
          <div className="space-y-4 pr-4 py-4 pt-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.01] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted/90 shadow-md'
                  }`}
                >
                  <div className="text-sm text-current overflow-hidden break-words">
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
                <div className="max-w-[75%] rounded-lg px-4 py-2 bg-muted">
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
            placeholder={t('chat.input_placeholder')}
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