import { useState, useRef, useEffect } from 'react';
import { Mic, Square, PlayCircle, StopCircle, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Add types for browser's Speech Recognition API which TypeScript doesn't know about
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef(window.speechSynthesis);
  const { toast } = useToast();

  useEffect(() => {
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
        let errorMessage = 'Failed to recognize speech. Please try again.';

        switch(event.error) {
          case 'not-allowed':
            errorMessage = 'Please allow microphone access to use voice recognition.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'no-speech':
            // Don't show a toast for no-speech errors as they're common and expected
            console.log('No speech detected. Try speaking louder or check your microphone.');
            return;
          case 'audio-capture':
            errorMessage = 'No microphone detected. Please check your device settings.';
            break;
        }

        toast({
          title: 'Speech Recognition Error',
          description: errorMessage,
          variant: 'destructive',
        });
      };

      recognition.current.onstart = () => {
        setIsListening(true);
        toast({
          title: 'Listening',
          description: 'I can hear you now. Please start speaking.',
          variant: 'default',
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
      // Use apiRequest for the chat request for consistency with the rest of the app
      const data = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: transcript }),
      });

      setAnswer(data.response);

      // For binary responses like audio, we still need to use fetch directly
      const audioResponse = await fetch('/api/voice/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: data.response }),
      });

      if (!audioResponse.ok) {
        throw new Error(`Audio response error: ${audioResponse.status}`);
      }

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          // Still mark as playing in case of autoplay restrictions
          setIsPlaying(true);
        });
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your request';
      toast({
        title: 'Error',
        description: 'Could not process your request. Please try again.',
        variant: 'destructive',
      });
      setAnswer("I apologize, but I encountered an error. Please try again.");
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

    try {
      if (isListening) {
        recognition.current.stop();
        setIsListening(false);
      } else {
        const greeting = "Hi, I'm NauMah. How can I help you today?";
        setAnswer(greeting);

        // Preload audio for faster initial response
        fetch('/api/voice/speech', {
          priority: 'high',
          cache: 'no-store',
          keepalive: true,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: greeting }),
        })
        .then(response => response.blob())
        .then(audioBlob => {
          const audioUrl = URL.createObjectURL(audioBlob);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setIsPlaying(true);
          }
        })
        .catch(console.error);

        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.maxAlternatives = 1;
        recognition.current.start();
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      setIsListening(false);
      toast({
        title: 'Error',
        description: 'Failed to start voice recognition. Please try again.',
        variant: 'destructive',
      });
    }
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
    <Card className="w-full h-[500px] flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transform-gpu hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">Voice Assistant</CardTitle>
        <CardDescription className="max-w-md mx-auto">Speak with NauMah, your pregnancy AI companion. Just tap the microphone and start talking.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center relative">
        <audio ref={audioRef} className="hidden" onEnded={() => setIsPlaying(false)} />

        <div className="flex flex-col items-center justify-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className={`h-48 w-48 rounded-full transition-all duration-300 shadow-[0_10px_20px_rgba(0,_0,_0,_0.2)] ${
              isListening 
                ? 'bg-red-100 text-red-500 border-red-300 animate-pulse shadow-lg'
                : 'bg-gradient-to-r from-primary/20 to-primary hover:scale-105 shadow-md'
            }`}
            onClick={toggleListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <Square className="h-16 w-16 text-red-500" />
            ) : (
              <Mic className="h-16 w-16 text-primary-foreground" />
            )}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground animate-fade-in">
            {isListening ? 'Listening...' : 'Tap to start conversation'}
          </p>
          
          {isListening && (
            <Button 
              variant="destructive"
              size="lg"
              onClick={() => {
                recognition.current?.stop();
                setIsListening(false);
              }}
              className="mt-4 px-8 py-2 rounded-full shadow-md"
            >
              Stop Conversation
            </Button>
          )}
        </div>

        <div className="flex space-x-2 mt-4 justify-center">
          {isPlaying && (
            <Button variant="ghost" size="icon" onClick={stopPlaying} className="h-8 w-8">
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm">Processing your request...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}