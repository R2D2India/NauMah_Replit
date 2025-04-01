import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PregnancyProgress from "@/components/pregnancy/PregnancyProgress";
import BabyDevelopment from "@/components/pregnancy/BabyDevelopment";
import TabbedContent from "@/components/pregnancy/TabbedContent";
import AdditionalFeatures from "@/components/pregnancy/AdditionalFeatures";
import MoodTracker from "@/components/pregnancy/MoodTracker";

const Dashboard = () => {
  const [, setLocation] = useLocation();

  // Fetch pregnancy data
  const { data: pregnancyData, isLoading, isError } = useQuery({
    queryKey: ["/api/pregnancy"],
  });

  // Redirect to home if no pregnancy data is found
  useEffect(() => {
    if (isError) {
      setLocation("/");
    }
  }, [isError, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-primary">
          <i className="fas fa-spinner fa-spin text-4xl"></i>
          <p className="mt-2">Loading your pregnancy data...</p>
        </div>
      </div>
    );
  }

  const currentWeek = pregnancyData?.currentWeek || 1;

  return (
    <div id="dashboard-section">
      {/* Pregnancy Progress */}
      <PregnancyProgress currentWeek={currentWeek} />

      {/* Baby Development */}
      <BabyDevelopment currentWeek={currentWeek} />

      {/* Tabbed Content Section */}
      <TabbedContent currentWeek={currentWeek} />
      
      {/* Additional Features */}
      <AdditionalFeatures currentWeek={currentWeek} />
      
      {/* Daily Mood Tracker */}
      <MoodTracker currentWeek={currentWeek} />
    </div>
  );
};

export default Dashboard;
