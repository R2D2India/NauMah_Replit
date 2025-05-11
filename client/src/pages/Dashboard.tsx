import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PregnancyProgress from "@/components/pregnancy/PregnancyProgress";
import BabyDevelopment from "@/components/pregnancy/BabyDevelopment";
import AdditionalFeatures from "@/components/pregnancy/AdditionalFeatures";
import { WEEKS_OPTIONS, MONTHS_OPTIONS, TRIMESTER_OPTIONS } from "@/lib/constants";
import { apiRequest, queryClient, appEvents, APP_EVENTS, STORAGE_KEYS } from "@/lib/queryClient";
import { 
  getLocalPregnancyData, 
  saveLocalPregnancyData, 
  saveUserPregnancyData,
  getLocalBabyDevelopmentData,
  saveLocalBabyDevelopmentData 
} from "@/lib/localDataStore";

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

  // Add state for baby development data from the combined endpoint
  const [combinedBabyDevelopment, setCombinedBabyDevelopment] = useState<any>(null);
  // State to track if we're loading from local storage as a fallback
  const [loadingFromLocal, setLoadingFromLocal] = useState(false);
  // State to track if we should display a production mode message
  const [isProductionMode, setIsProductionMode] = useState(false);
  // Local pregnancy data reference
  const localDataRef = useRef<PregnancyData | null>(null);
  
  // Check if we're in production mode on component mount
  useEffect(() => {
    const host = window.location.host;
    // Check if we're in a deployed Replit environment
    const isProduction = host.includes('.replit.app') || host.includes('.repl.co');
    setIsProductionMode(isProduction);
    
    // If in production, immediately try to load local data
    if (isProduction) {
      const localData = getLocalPregnancyData();
      if (localData) {
        console.log("Production environment detected. Using local storage data:", localData);
        localDataRef.current = localData;
      }
    }
  }, []);

  // Update pregnancy stage mutation using the new combined endpoint
  const updateStageMutation = useMutation({
    mutationFn: async (data: { stageType: string; stageValue: string }) => {
      // Use the new combined endpoint that handles both pregnancy update and baby development
      console.log("🔄 Using combined pregnancy update + development endpoint");
      const response = await fetch("/api/pregnancy/update-with-development", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error("❌ Combined endpoint failed with status:", response.status);
        throw new Error("Failed to update pregnancy stage");
      }
      
      return await response.json();
    },
    onSuccess: (combinedData) => {
      console.log("✅ Dashboard: Combined update success, data received:", combinedData);
      
      // Store the combined development data for immediate use
      if (combinedData.babyDevelopment) {
        setCombinedBabyDevelopment(combinedData.babyDevelopment);
        console.log("✅ Dashboard: Stored baby development data from combined response");
      }
      
      // Use the pregnancy data from the combined response
      const updatedData = combinedData.pregnancyData || combinedData;
      
      // For production resilience, store in localStorage
      if (isProductionMode) {
        // Save pregnancy data to localStorage
        if (updatedData) {
          saveLocalPregnancyData(updatedData);
          console.log("✅ Dashboard: Saved pregnancy data to localStorage for production resilience");
        }
        
        // Save baby development data to localStorage
        if (combinedData.babyDevelopment) {
          const week = updatedData.currentWeek || parseInt(stageValue);
          saveLocalBabyDevelopmentData(week, combinedData.babyDevelopment);
          console.log(`✅ Dashboard: Saved baby development data for week ${week} to localStorage`);
        }
      }
      
      // Force immediate UI update
      queryClient.setQueryData(["/api/pregnancy"], updatedData);
      
      // Force immediate refetch to get fresh data - still needed for other components
      refetch();
      console.log("✅ Dashboard: Triggered refetch of pregnancy data");
      
      // Invalidate pregnancy data across the app to ensure all components refresh
      queryClient.invalidateQueries({ queryKey: ["/api/pregnancy"] });
      // Also invalidate baby development data to refresh it with the new week
      queryClient.invalidateQueries({ queryKey: ["/api/baby-development"] });
      console.log("✅ Dashboard: Invalidated pregnancy and baby development query cache");
      
      // Broadcast the pregnancy stage update event with reliable localStorage mechanism
      appEvents.publish(APP_EVENTS.PREGNANCY_STAGE_UPDATED, updatedData);
      console.log("✅ Dashboard: Published pregnancy_stage_updated event to appEvents system");
      
      // Show success toast
      toast({
        title: "Pregnancy stage updated",
        description: `Your pregnancy information has been updated successfully.`,
        variant: "default"
      });
      
      // URL state update approach - add timestamp to force cache invalidation
      try {
        // Add timestamp to URL without causing navigation
        const url = new URL(window.location.href);
        url.searchParams.set('_t', new Date().getTime().toString());
        window.history.replaceState({}, '', url.toString());
        console.log(`✅ Dashboard: Updated URL timestamp parameter to ${url.searchParams.get('_t')}`);
      } catch (err) {
        console.error('Error updating URL state:', err);
      }
      
      // Force a dispatch of the storage event for cross-tab communication
      try {
        const storageEvent = {
          event: APP_EVENTS.PREGNANCY_STAGE_UPDATED,
          data: updatedData,
          timestamp: new Date().getTime()
        };
        console.log("✅ Dashboard: Manually triggering storage event for immediate cross-tab sync");
        window.dispatchEvent(new StorageEvent('storage', {
          key: STORAGE_KEYS.LAST_PREGNANCY_UPDATE,
          newValue: JSON.stringify(storageEvent)
        }));
      } catch (err) {
        console.error('Error dispatching storage event:', err);
      }
      
      console.log("Pregnancy stage updated and cache invalidation complete:", updatedData);
    },
    onError: (error) => {
      console.error("Failed to update pregnancy stage:", error);
    }
  });

  // For production, use local data if API fails or takes too long
  useEffect(() => {
    if (!pregnancyData && !isLoading && isProductionMode) {
      // If we don't have server data, try to use local data
      const localData = localDataRef.current || getLocalPregnancyData();
      if (localData) {
        console.log("Using local storage data as fallback:", localData);
        setLoadingFromLocal(true);
        // Force a refresh of the pregnancy data
        queryClient.setQueryData(["/api/pregnancy"], localData);
      }
    } else if (pregnancyData && isProductionMode) {
      // We have server data, check if we should use it or keep local data
      const userSpecifiedData = getLocalPregnancyData();
      
      if (userSpecifiedData && userSpecifiedData._userSpecified === true) {
        // User has explicitly set data, prioritize it over server data
        console.log("Found user-specified pregnancy data, prioritizing it over server data");
        
        // Only use local data if it's different from server data
        if (userSpecifiedData.currentWeek !== pregnancyData.currentWeek) {
          console.log(`Using user-specified week ${userSpecifiedData.currentWeek} instead of server week ${pregnancyData.currentWeek}`);
          setLoadingFromLocal(true);
          // Update UI with user data
          queryClient.setQueryData(["/api/pregnancy"], userSpecifiedData);
        }
      } else {
        // No user-specified data, safe to use and cache server data
        console.log("No user-specified data found, saving server data to localStorage:", pregnancyData);
        saveLocalPregnancyData(pregnancyData);
      }
    }
  }, [pregnancyData, isLoading, isProductionMode]);
  
  // Handle direct local update for production mode
  const handleManualFallback = () => {
    if (!stageValue) {
      toast({
        title: "Selection Required",
        description: "Please select a week, month, or trimester value first.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert stage type and value to week
    let week = parseInt(stageValue);
    if (stageType === "month") {
      week = parseInt(stageValue) * 4;
    } else if (stageType === "trimester") {
      if (stageValue === "1") week = 8;
      else if (stageValue === "2") week = 20;
      else week = 33;
    }
    
    // Calculate due date based on current week (40 weeks total)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (40 - week) * 7);
    
    // Create user-specified pregnancy data with additional metadata
    const localData = {
      currentWeek: week,
      dueDate: dueDate.toISOString(),
      lastUpdated: new Date().toISOString(),
      _userSpecified: true, // Flag to identify user-specified data
      _timestamp: new Date().getTime() // Timestamp for priority checking
    };
    
    // Save to localStorage as user-specified data (with highest priority)
    saveUserPregnancyData(localData);
    
    // Update UI immediately
    queryClient.setQueryData(["/api/pregnancy"], localData);
    setLoadingFromLocal(true);
    
    // Also attempt to update the server in the background
    try {
      fetch("/api/pregnancy/update-with-development", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageType, stageValue }),
        credentials: "include"
      }).then(response => {
        if (response.ok) {
          console.log("✅ Background server update successful");
        }
      }).catch(err => {
        console.log("❌ Background server update failed, using local data only");
      });
    } catch (e) {
      console.error("Failed to send background update:", e);
    }
    
    // Show success notification
    toast({
      title: "Local Update Successful",
      description: `Pregnancy information updated to ${stageType} ${stageValue} (Week ${week}).`,
      variant: "default"
    });
    
    // Attempt to get baby development data
    (async () => {
      try {
        // Try to get cached data first
        const cachedDevelopment = getLocalBabyDevelopmentData(week);
        if (cachedDevelopment) {
          console.log(`Found cached baby development data for week ${week}`);
          setCombinedBabyDevelopment(cachedDevelopment);
          return;
        }
        
        // If no cached data, fetch from server
        const response = await fetch(`/api/baby-development/${week}`);
        if (response.ok) {
          const developmentData = await response.json();
          console.log(`Fetched baby development data for week ${week}`);
          setCombinedBabyDevelopment(developmentData);
          saveLocalBabyDevelopmentData(week, developmentData);
        }
      } catch (error) {
        console.error("Failed to get baby development data:", error);
      }
    })();
  };

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
    <div id="dashboard-section" className="pt-4">
      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-2">Dashboard</h1>
        <p className="text-neutral-dark max-w-2xl mx-auto">Track your pregnancy journey and follow your baby's development week by week</p>
        
        {/* Production mode indicator */}
        {isProductionMode && (
          <div className="mt-2 inline-flex items-center py-1 px-3 text-sm bg-blue-50 text-blue-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deployed Mode
          </div>
        )}
      </div>
      
      {/* Removed the local data indicator message as requested */}
      
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

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={isProductionMode ? handleManualFallback : handleSubmit}
              className="bg-primary hover:bg-primary-dark" 
              disabled={!stageValue || updateStageMutation.isPending}
            >
              {updateStageMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt mr-2"></i>
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Current Pregnancy Week Section */}
      <div className="mb-10">
        <PregnancyProgress currentWeek={currentWeek} isLocalData={loadingFromLocal} />
      </div>

      {/* Baby Development Section */}
      <div className="mb-10">
        <BabyDevelopment 
          currentWeek={currentWeek} 
          developmentData={combinedBabyDevelopment}
          isLocalData={loadingFromLocal}
        />
      </div>

      {/* Additional Features Section */}
      <div className="mb-10">
        <AdditionalFeatures currentWeek={currentWeek} />
      </div>
    </div>
  );
};

export default Dashboard;