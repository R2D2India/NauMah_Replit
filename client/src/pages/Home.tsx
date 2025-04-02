
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WelcomeSection from "@/components/pregnancy/WelcomeSection";
import { AIAssistantSection } from "@/components/ai/AIAssistantSection";
import { WaitlistSection } from "@/components/marketing/WaitlistSection";
import { ComingSoonSections } from "@/components/marketing/ComingSoonSections";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [, setLocation] = useLocation();

  const { data: pregnancyData, isLoading } = useQuery({
    queryKey: ["/api/pregnancy"],
  });

  useEffect(() => {
    if (pregnancyData && typeof pregnancyData === 'object' && 'currentWeek' in pregnancyData) {
      setLocation("/dashboard");
    }
  }, [pregnancyData, setLocation]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-b from-purple-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-primary mb-6">
                Your AI-Powered Pregnancy Journey Companion
              </h1>
              <p className="text-lg mb-8 text-neutral-dark">
                Navigate your pregnancy journey with personalized guidance, expert insights, and supportive tracking tools.
              </p>
              <img 
                src="https://illustrations.popsy.co/purple/pregnant-woman.svg" 
                alt="Pregnant woman illustration"
                className="w-full max-w-md mx-auto md:hidden"
              />
            </div>
            <div className="hidden md:block">
              <img 
                src="https://illustrations.popsy.co/purple/pregnant-woman.svg" 
                alt="Pregnant woman illustration"
                className="w-full max-w-lg mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <WelcomeSection />
        <AIAssistantSection />
        <WaitlistSection />
        <ComingSoonSections />
      </div>
    </div>
  );
};

export default Home;
