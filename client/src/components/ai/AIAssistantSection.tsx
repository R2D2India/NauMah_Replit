import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatAgent } from "./ChatAgent";
import { VoiceAgent } from "./VoiceAgent";

export function AIAssistantSection() {
  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Your AI Pregnancy Companion</h2>
        <p className="text-muted-foreground">
          Get expert guidance and answers to your pregnancy questions through chat or voice
        </p>
      </div>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
          <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
          <TabsTrigger value="voice">Voice Assistant</TabsTrigger>
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