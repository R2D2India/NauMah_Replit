
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PregnancyProgress from "@/components/pregnancy/PregnancyProgress";
import BabyDevelopment from "@/components/pregnancy/BabyDevelopment";
import AdditionalFeatures from "@/components/pregnancy/AdditionalFeatures";
import { WEEKS_OPTIONS, MONTHS_OPTIONS, TRIMESTER_OPTIONS } from "@/lib/constants";
import { apiRequest, queryClient, appEvents, APP_EVENTS } from "@/lib/queryClient";

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
      const response = await fetch("/api/pregnancy/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to update pregnancy stage");
      }
      
      return await response.json();
    },
    onSuccess: (updatedData) => {
      // Invalidate pregnancy data across the app to ensure all components refresh
      queryClient.invalidateQueries({ queryKey: ["/api/pregnancy"] });
      
      // Also refetch locally to update the UI immediately
      refetch();
      
      // Broadcast the pregnancy stage update event to other components
      appEvents.publish(APP_EVENTS.PREGNANCY_STAGE_UPDATED, updatedData);
      
      // Show success toast
      toast({
        title: "Pregnancy stage updated",
        description: `Your pregnancy information has been updated successfully.`,
        variant: "default"
      });
      
      console.log("Pregnancy stage updated and cache invalidated:", updatedData);
    },
    onError: (error) => {
      console.error("Failed to update pregnancy stage:", error);
    }
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
    <div id="baby-and-me-section" className="pt-4">
      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-2">Baby & Me</h1>
        <p className="text-neutral-dark max-w-2xl mx-auto">Track your pregnancy journey and follow your baby's development week by week</p>
      </div>
      
      {/* Pregnancy Stage Selector */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-md border-l-4 border-primary">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-2xl font-montserrat font-bold text-primary mb-4 flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-3">
              <i className="fas fa-calendar-alt text-primary"></i>
            </span>
            Update Pregnancy Stage
          </h2>
          {updateStageMutation.isSuccess && (
            <span className="text-sm text-green-600 flex items-center mb-4 bg-green-50 py-1 px-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Updated successfully
            </span>
          )}
        </div>
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex-grow min-w-[180px] max-w-xs">
            <Select value={stageType} onValueChange={setStageType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="trimester">Trimester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-grow min-w-[180px] max-w-xs">
            <Select value={stageValue} onValueChange={setStageValue}>
              <SelectTrigger className="w-full">
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
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!stageValue || updateStageMutation.isPending}
            className="px-6"
          >
            {updateStageMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : "Update Stage"}
          </Button>
        </div>
      </div>

      {/* Pregnancy Progress */}
      <PregnancyProgress currentWeek={currentWeek} />

      {/* Baby Development */}
      <BabyDevelopment currentWeek={currentWeek} />
      
      {/* Additional Features */}
      <AdditionalFeatures currentWeek={currentWeek} />
    </div>
  );
};

export default Dashboard;
