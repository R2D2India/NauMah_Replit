import { useState, useRef } from 'react';
import { Mic, Square, PlayCircle, StopCircle, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Handle manual text input
  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setLastQuery(userQuestion);
    
    try {
      // First get the text version for display
      const textResponse = await apiRequest<{ response: string }>('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userQuestion.trim() }),
      });
      
      setAnswer(textResponse.response);
      
      // Fetch audio response using the same apiRequest pattern, but handle the blob response directly
      const response = await fetch('/api/voice/speech', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userQuestion.trim() }),
      });
      
      if (!response.ok) throw new Error('Failed to get voice response');
      
      // Create audio blob and URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set audio source and play
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

  // Start recording audio
  const startRecording = () => {
    setIsRecording(true);
    // Placeholder for recording functionality
    // Would need to use the Web Audio API and MediaRecorder
    toast({
      title: 'Recording',
      description: 'Voice recording feature will be implemented in a future update.',
    });
    
    // Simulate recording for demo purposes
    setTimeout(() => {
      stopRecording();
    }, 3000);
  };

  // Stop recording audio
  const stopRecording = () => {
    setIsRecording(false);
    // Placeholder for stopping recording and processing audio
    toast({
      title: 'Processing',
      description: 'Processing your voice input...',
    });
    
    // Simulate processing for demo purposes
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setLastQuery("What nutritional supplements should I take during pregnancy?");
      setAnswer("During pregnancy, it's recommended to take a prenatal vitamin with folic acid, iron, calcium, vitamin D, and DHA. Folic acid is crucial for preventing neural tube defects, especially in the first trimester. Always consult with your healthcare provider before starting any supplements, as they can recommend the right formulation based on your specific needs and health history.");
      // Create a demo audio response
      if (audioRef.current) {
        audioRef.current.src = "https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3"; // Demo sound
        audioRef.current.onloadedmetadata = () => {
          audioRef.current?.play();
          setIsPlaying(true);
        };
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }, 2000);
  };

  // Stop playing the audio
  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Play the audio again
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
        <CardDescription>Speak with NauMah or type your questions</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <audio ref={audioRef} className="hidden" />
        
        <div className="flex flex-col items-center justify-center mb-6 flex-grow">
          <Button
            variant="outline"
            size="icon"
            className={`h-24 w-24 rounded-full ${isRecording ? 'bg-red-100 text-red-500 border-red-300' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isPlaying}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </p>
        </div>
        
        {lastQuery && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Your question:</h3>
            <p className="text-sm p-2 bg-muted rounded-md">{lastQuery}</p>
          </div>
        )}
        
        {answer && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium">NauMah's answer:</h3>
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
            <span className="ml-2 text-sm">Processing your question...</span>
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
            disabled={isProcessing || isRecording}
          />
          <Button
            type="submit"
            onClick={handleAskQuestion}
            disabled={isProcessing || isRecording || !userQuestion.trim()}
          >
            Ask
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}