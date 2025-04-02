import { useState, useRef, useEffect } from 'react';
import { Mic, Square, PlayCircle, StopCircle, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef(window.speechSynthesis);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch and play welcome message on component mount
    const getWelcomeMessage = async () => {
      try {
        const response = await fetch('/api/voice/welcome'); // Assumed endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const welcomeMessage = await response.text();
        setAnswer(welcomeMessage);
        const audioBlob = await (await fetch('/api/voice/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: welcomeMessage }),
        })).blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } catch (error) {
        console.error('Error fetching or playing welcome message:', error);
        toast({
          title: 'Error',
          description: 'Failed to play welcome message.',
          variant: 'destructive',
        });
      }
    };
    getWelcomeMessage();

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          handleVoiceInput(transcript);
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Error',
          description: 'Failed to recognize speech. Please try again.',
          variant: 'destructive',
        });
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synthesis.current) {
        synthesis.current.cancel();
      }
    };
  }, []);

  const handleVoiceInput = async (transcript: string) => {
    setLastQuery(transcript);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: transcript }),
      });

      const data = await response.json();
      setAnswer(data.response);

      // Convert response to speech
      const audioResponse = await fetch('/api/voice/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: data.response }),
      });

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onloadedmetadata = () => {
          audioRef.current?.play();
          setIsPlaying(true);
        };
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setAnswer("I apologize, but I encountered an error. Please try again or use text input instead.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastQuery(userQuestion);

    try {
      const textResponse = await apiRequest<{ response: string }>('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userQuestion.trim() }),
      });

      setAnswer(textResponse.response);

      const response = await fetch('/api/voice/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textResponse.response }),
      });

      if (!response.ok) throw new Error('Failed to get voice response');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onloadedmetadata = () => {
          audioRef.current?.play();
          setIsPlaying(true);
        };

        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }

      setUserQuestion('');
    } catch (error) {
      console.error('Error getting voice response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a voice response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const toggleListening = () => {
    if (!recognition.current) {
      toast({
        title: 'Error',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognition.current.stop();
    } else {
      recognition.current.start();
    }
    setIsListening(!isListening);
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playAgain = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Voice Assistant</CardTitle>
        <CardDescription>Speak with NauMah, your pregnancy AI companion</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <audio ref={audioRef} className="hidden" />

        <div className="flex flex-col items-center justify-center mb-6 flex-grow">
          <Button
            variant="outline"
            size="icon"
            className={`h-24 w-24 rounded-full ${isListening ? 'bg-red-100 text-red-500 border-red-300' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing || isPlaying}
          >
            {isListening ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            {isListening ? 'Tap to stop listening' : 'Tap to start conversation'}
          </p>
        </div>

        {lastQuery && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">You said:</h3>
            <p className="text-sm p-2 bg-muted rounded-md">{lastQuery}</p>
          </div>
        )}

        {answer && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium">NauMah's response:</h3>
              <div className="flex space-x-1">
                {isPlaying ? (
                  <Button variant="ghost" size="icon" onClick={stopPlaying} className="h-6 w-6">
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={playAgain} className="h-6 w-6" disabled={!audioRef.current?.src}>
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm p-2 bg-primary/10 rounded-md">{answer}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Processing your request...</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your question..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            disabled={isProcessing || isListening}
          />
          <Button
            type="submit"
            onClick={handleAskQuestion}
            disabled={isProcessing || isListening || !userQuestion.trim()}
          >
            Ask
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}