import WelcomeSection from "@/components/pregnancy/WelcomeSection";
import { AIAssistantSection } from "@/components/ai/AIAssistantSection";
import { WaitlistSection } from "@/components/marketing/WaitlistSection";
import { ComingSoonSections } from "@/components/marketing/ComingSoonSections";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WelcomeSection />
      <div className="container mx-auto px-4 py-12">
        <AIAssistantSection />
        <WaitlistSection />
        <ComingSoonSections />
      </div>
    </div>
  );
}