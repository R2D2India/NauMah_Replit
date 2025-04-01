import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import WelcomeSection from "@/components/pregnancy/WelcomeSection";

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
    if (pregnancyData && pregnancyData.currentWeek) {
      setLocation("/dashboard");
    }
  }, [pregnancyData, setLocation]);

  // Don't show welcome section if redirecting
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-primary">
          <i className="fas fa-spinner fa-spin text-4xl"></i>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome section if no pregnancy data
  return <WelcomeSection />;
};

export default Home;
