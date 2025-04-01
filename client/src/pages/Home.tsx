import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WelcomeSection from "@/components/pregnancy/WelcomeSection";
import { AIAssistantSection } from "@/components/ai/AIAssistantSection";
import { WaitlistSection } from "@/components/marketing/WaitlistSection";
import ComingSoonSections from "@/components/marketing/ComingSoonSections";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [, setLocation] = useLocation();

  // Check if pregnancy data exists and redirect if needed
  // Both initial check and effect for redirect are combined
  const { data: pregnancyData, isLoading } = useQuery({
    queryKey: ["/api/pregnancy"],
    // No onSuccess handler here to prevent duplication
  });

  // Handle redirection in a single useEffect that always runs
  useEffect(() => {
    if (pregnancyData && typeof pregnancyData === 'object' && 'currentWeek' in pregnancyData) {
      setLocation("/dashboard");
    }
  }, [pregnancyData, setLocation]);

  // Don't show welcome section if redirecting
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-primary flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome section and AI assistant if no pregnancy data
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <WelcomeSection />
        <AIAssistantSection />
      </div>
      <WaitlistSection />
      <ComingSoonSections />
    </div>
  );
};

export default Home;