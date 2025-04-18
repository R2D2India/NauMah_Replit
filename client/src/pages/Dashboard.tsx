
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PregnancyProgress from "@/components/pregnancy/PregnancyProgress";
import BabyDevelopment from "@/components/pregnancy/BabyDevelopment";
import TabbedContent from "@/components/pregnancy/TabbedContent";
import AdditionalFeatures from "@/components/pregnancy/AdditionalFeatures";
import MoodTracker from "@/components/pregnancy/MoodTracker";
import { WEEKS_OPTIONS, MONTHS_OPTIONS, TRIMESTER_OPTIONS } from "@/lib/constants";

const Dashboard = () => {
  const [, setLocation] = useLocation();
  const [stageType, setStageType] = useState("week");
  const [stageValue, setStageValue] = useState("");

  // Define pregnancy data type
  interface PregnancyData {
    currentWeek: number;
    dueDate?: string;
    startDate?: string;
    [key: string]: any;
  }
  
  // Fetch pregnancy data
  const { data: pregnancyData, isLoading, isError, refetch } = useQuery<PregnancyData>({
    queryKey: ["/api/pregnancy"],
  });

  // Update pregnancy stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async (data: { stageType: string; stageValue: string }) => {
      return await fetch("/api/pregnancy/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json());
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Redirect to home if no pregnancy data is found
  useEffect(() => {
    if (isError) {
      setLocation("/");
    }
  }, [isError, setLocation]);

  const handleSubmit = () => {
    if (stageValue) {
      updateStageMutation.mutate({ stageType, stageValue });
    }
  };

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
    <div id="pregnancy-ai-toolkit-section">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary font-montserrat">Pregnancy AI Tool Kit</h1>
        <p className="text-neutral-dark mt-2">Track your pregnancy journey and baby's development</p>
      </div>
      
      {/* Pregnancy Stage Selector */}
      <div className="bg-white rounded-xl p-6 mb-8 custom-shadow">
        <h2 className="text-xl font-montserrat font-bold text-primary mb-4">Update Pregnancy Stage</h2>
        <div className="flex gap-4 flex-wrap">
          <Select value={stageType} onValueChange={setStageType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="trimester">Trimester</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageValue} onValueChange={setStageValue}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {stageType === "week" && WEEKS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {stageType === "month" && MONTHS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {stageType === "trimester" && TRIMESTER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSubmit}
            disabled={!stageValue || updateStageMutation.isPending}
          >
            {updateStageMutation.isPending ? "Updating..." : "Update Stage"}
          </Button>
        </div>
      </div>

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
