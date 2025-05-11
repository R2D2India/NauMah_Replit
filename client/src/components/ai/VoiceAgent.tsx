import { useState, useEffect } from 'react';
import { Mic, Square, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export function VoiceAgent() {
  // Initialize from localStorage, defaulting to 'english' if not set
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>(
    () => (localStorage.getItem('voicePreference') as 'english' | 'hindi') || 'english'
  );
  const [showWidget, setShowWidget] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Save voice language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('voicePreference', selectedLanguage);
  }, [selectedLanguage]);

  // Cleanup function to remove any existing widgets when component unmounts
  useEffect(() => {
    return () => {
      // Remove any existing convai widgets
      const existingWidgets = document.querySelectorAll('elevenlabs-convai');
      existingWidgets.forEach(widget => {
        widget.remove();
      });
    };
  }, []);

  // Function to toggle the widget visibility and load the appropriate one
  const toggleWidget = () => {
    // If showing, hide the widget
    if (showWidget) {
      setShowWidget(false);
      
      // Remove any existing convai widgets
      const existingWidgets = document.querySelectorAll('elevenlabs-convai');
      existingWidgets.forEach(widget => {
        widget.remove();
      });
      
      return;
    }

    // If hidden, show the widget with the selected language
    setShowWidget(true);
    
    // Remove any existing convai widgets first
    const existingWidgets = document.querySelectorAll('elevenlabs-convai');
    existingWidgets.forEach(widget => {
      widget.remove();
    });
    
    // Create the appropriate widget based on language selection
    const widgetContainer = document.getElementById('widget-container');
    if (widgetContainer) {
      const elevenLabsWidget = document.createElement('elevenlabs-convai');
      
      // Set the agent ID based on selected language
      if (selectedLanguage === 'english') {
        elevenLabsWidget.setAttribute('agent-id', 'g4VXRgf3tV81BwdDZXKF');
      } else {
        elevenLabsWidget.setAttribute('agent-id', 'KThHYsE9G6hhRAMxDfeF');
      }
      
      widgetContainer.appendChild(elevenLabsWidget);
      
      // Create and add the script if it doesn't exist
      if (!document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://elevenlabs.io/convai-widget/index.js';
        script.async = true;
        script.type = 'text/javascript';
        document.body.appendChild(script);
      }
      
      // Show toast notification
      toast({
        title: `${selectedLanguage === 'english' ? 'English' : 'Hindi'} Voice Assistant Activated`,
        description: `You can now speak in ${selectedLanguage === 'english' ? 'English' : 'Hindi'} with the voice assistant.`,
        variant: 'default',
      });
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col bg-background rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transform-gpu hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">{t('ai.voice')}</CardTitle>
        <CardDescription className="max-w-md mx-auto">{t('ai.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center relative">
        <div className="mb-6 w-full max-w-xs">
          <RadioGroup 
            value={selectedLanguage} 
            onValueChange={(value) => setSelectedLanguage(value as 'english' | 'hindi')}
            className="flex justify-center gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="english" id="english" />
              <Label htmlFor="english" className="cursor-pointer">{t('language.en')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hindi" id="hindi" />
              <Label htmlFor="hindi" className="cursor-pointer">{t('language.hi')}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className={`h-48 w-48 rounded-full transition-all duration-300 shadow-[0_10px_20px_rgba(0,_0,_0,_0.2)] ${
              showWidget 
                ? 'bg-red-100 text-red-500 border-red-300 animate-pulse shadow-lg'
                : 'bg-primary text-primary-foreground hover:scale-105 shadow-md'
            }`}
            onClick={toggleWidget}
          >
            {showWidget ? (
              <Square className="h-16 w-16 text-red-500" />
            ) : (
              <>
                <Mic className="h-16 w-16 text-primary-foreground" />
                <Globe className="h-6 w-6 text-primary-foreground absolute top-12 right-12" />
              </>
            )}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground animate-fade-in">
            {showWidget ? 'Click to stop' : `Tap to start ${selectedLanguage} conversation`}
          </p>
        </div>

        {/* Container for Eleven Labs widget */}
        <div id="widget-container" className="w-full h-32 flex justify-center"></div>
      </CardContent>
    </Card>
  );
}