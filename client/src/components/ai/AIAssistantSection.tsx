import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatAgent } from "./ChatAgent";
import { VoiceAgent } from "./VoiceAgent";
import { useTranslation } from "react-i18next";

export function AIAssistantSection() {
  const { t } = useTranslation();
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{t('ai.title')}</h2>
        <p className="text-muted-foreground">
          {t('ai.subtitle')}
        </p>
      </div>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
          <TabsTrigger value="chat">{t('ai.title')}</TabsTrigger>
          <TabsTrigger value="voice">{t('ai.voice')}</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-0">
          <ChatAgent />
        </TabsContent>
        <TabsContent value="voice" className="mt-0">
          <VoiceAgent />
        </TabsContent>
      </Tabs>
    </div>
  );
}