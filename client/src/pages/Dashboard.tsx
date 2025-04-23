
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PregnancyProgress from "@/components/pregnancy/PregnancyProgress";
import BabyDevelopment from "@/components/pregnancy/BabyDevelopment";
import TabbedContent from "@/components/pregnancy/TabbedContent";
import AdditionalFeatures from "@/components/pregnancy/AdditionalFeatures";
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
    <div id="baby-and-me-section" className="pt-2">
      {/* Pregnancy Stage Selector */}
      <div className="bg-white rounded-xl p-6 mb-8 custom-shadow border-l-4 border-primary">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-xl font-montserrat font-bold text-primary mb-4">
            Update Pregnancy Stage
          </h2>
          {updateStageMutation.isSuccess && (
            <span className="text-sm text-green-600 flex items-center mb-4">
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

      {/* Tabbed Content Section */}
      <TabbedContent currentWeek={currentWeek} />
      
      {/* Additional Features */}
      <AdditionalFeatures currentWeek={currentWeek} />
    </div>
  );
};

export default Dashboard;
