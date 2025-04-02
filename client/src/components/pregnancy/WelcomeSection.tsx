import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { WEEKS_OPTIONS, MONTHS_OPTIONS, TRIMESTER_OPTIONS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const WelcomeSection = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stageType, setStageType] = useState("week");
  const [stageValue, setStageValue] = useState("1");

  const updatePregnancyStageMutation = useMutation({
    mutationFn: async (data: { stageType: string; stageValue: string }) => {
      return await apiRequest("/api/pregnancy/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Pregnancy stage updated",
        description: "Your pregnancy information has been updated successfully.",
        variant: "default",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update pregnancy stage: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleStartTracking = () => {
    updatePregnancyStageMutation.mutate({ stageType, stageValue });
  };

  // Dynamic options based on selected stage type
  const getOptions = () => {
    switch (stageType) {
      case "week":
        return WEEKS_OPTIONS;
      case "month":
        return MONTHS_OPTIONS;
      case "trimester":
        return TRIMESTER_OPTIONS;
      default:
        return WEEKS_OPTIONS;
    }
  };

  return (
    <div className="mb-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-8 custom-shadow">
        <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-primary mb-4">Welcome to NauMah</h2>
        <p className="text-lg mb-6">Your Personalized AI Pregnancy Companion! I'm here to support and guide you through every step of your pregnancy journey.</p>
        
        <div className="bg-neutral-light rounded-lg p-5 mb-6">
          <h3 className="font-montserrat font-medium text-xl mb-3">Let's get started!</h3>
          <p className="mb-4">Tell me your current week, month, or trimester of pregnancy so I can provide personalized insights and recommendations.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <select 
                id="pregnancy-stage-type" 
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                value={stageType}
                onChange={(e) => setStageType(e.target.value)}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="trimester">Trimester</option>
              </select>
            </div>
            <div className="flex-grow">
              <select 
                id="pregnancy-stage-value" 
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                value={stageValue}
                onChange={(e) => setStageValue(e.target.value)}
              >
                {getOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button 
              id="start-tracking" 
              className="bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-montserrat font-medium transition duration-300"
              onClick={handleStartTracking}
              disabled={updatePregnancyStageMutation.isPending}
            >
              {updatePregnancyStageMutation.isPending ? "Updating..." : "Start Tracking"}
            </button>
          </div>
          <p className="text-sm text-neutral-dark mt-3">Or, enter your approximate conception date</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
