import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocalBabyDevelopmentData, saveLocalBabyDevelopmentData } from "@/lib/localDataStore";
import { useOpenAIStatus } from "@/hooks/use-openai-status";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface BabyDevelopmentProps {
  currentWeek: number;
  preloadedData?: any; // Data from combined API call
}

interface BabyDevelopmentData {
  description: string;
  keyDevelopments: string[];
  funFact?: string;
  size?: string;
  imageDescription?: string;
  week: number;
}

const BabyDevelopment = ({ currentWeek, preloadedData }: BabyDevelopmentProps) => {
  const [babyData, setBabyData] = useState<BabyDevelopmentData | null>(null);
  const [loadingFromLocal, setLoadingFromLocal] = useState(false);
  const [isProductionMode, setIsProductionMode] = useState(false);
  
  // Check if OpenAI is available
  const { isAvailable: isAIAvailable } = useOpenAIStatus();
  
  // Detect if we're in production environment
  useEffect(() => {
    const host = window.location.host;
    // Check if we're in a deployed Replit environment
    const isProduction = host.includes('.replit.app') || host.includes('.repl.co');
    setIsProductionMode(isProduction);
    
    // If in production, try to use preloaded data first, then local storage data
    if (isProduction) {
      if (preloadedData) {
        console.log(`Using preloaded baby development data for week ${currentWeek}`);
        setBabyData(preloadedData);
      } else {
        const localData = getLocalBabyDevelopmentData(currentWeek);
        if (localData) {
          console.log(`Using local storage baby development data for week ${currentWeek}`);
          setBabyData(localData);
          setLoadingFromLocal(true);
        }
      }
    }
  }, [currentWeek, preloadedData]);
  
  // If we have preloaded data, use it and save to localStorage
  useEffect(() => {
    if (preloadedData) {
      console.log("BabyDevelopment: Using preloaded data from combined API call");
      setBabyData(preloadedData);
      
      if (isProductionMode) {
        saveLocalBabyDevelopmentData(currentWeek, preloadedData);
        console.log(`Saved baby development data for week ${currentWeek} to localStorage`);
      }
    }
  }, [preloadedData, currentWeek, isProductionMode]);
  
  // Fetch baby development data from API if needed
  const { 
    data: apiData, 
    isLoading, 
    isError 
  } = useQuery<BabyDevelopmentData>({
    queryKey: ["/api/baby-development", currentWeek.toString()],
    enabled: !babyData && isAIAvailable && !loadingFromLocal,
    staleTime: 1000 * 60 * 60 * 24, // 1 day
  });
  
  // Update local state when API data is received
  useEffect(() => {
    if (apiData && !babyData) {
      console.log("BabyDevelopment: Setting data from API response");
      setBabyData(apiData);
      
      if (isProductionMode) {
        saveLocalBabyDevelopmentData(currentWeek, apiData);
        console.log(`Saved baby development data for week ${currentWeek} to localStorage`);
      }
    }
  }, [apiData, babyData, currentWeek, isProductionMode]);
  
  // If preloaded data doesn't match current week, get data for current week from API or localStorage
  useEffect(() => {
    if (preloadedData?.week !== currentWeek) {
      console.log(`BabyDevelopment: Preloaded data week ${preloadedData?.week} doesn't match current week ${currentWeek}`);
      
      // Try localStorage first
      const localData = getLocalBabyDevelopmentData(currentWeek);
      if (localData) {
        console.log(`Using local storage baby development data for week ${currentWeek}`);
        setBabyData(localData);
        setLoadingFromLocal(true);
      } else if (isAIAvailable) {
        // If no local data, make direct API call
        console.log("BabyDevelopment: Requesting AI data for week", currentWeek);
        console.log("Making direct API call to baby-development endpoint for week", currentWeek);
        
        // Reset data to trigger a new query
        setBabyData(null);
        setLoadingFromLocal(false);
      }
    }
  }, [currentWeek, preloadedData, isAIAvailable]);
  
  // If we're still loading or have an error without backup data
  if ((isLoading || isError) && !babyData) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-montserrat font-bold text-primary mb-6 flex items-center">
          <span className="bg-primary/10 p-2 rounded-full mr-3">
            <i className="fas fa-baby text-primary"></i>
          </span>
          Baby Development - Week {currentWeek}
        </h2>
        
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            
            <div className="pt-4">
              <Skeleton className="h-6 w-40 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  const developmentData = babyData || apiData;
  
  return (
    <div className="mb-8" id="baby-development-section">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-2xl font-montserrat font-bold text-primary flex items-center">
          <span className="bg-primary/10 p-2 rounded-full mr-3">
            <i className="fas fa-baby text-primary"></i>
          </span>
          Baby Development - Week {currentWeek}
        </h2>
        
        {loadingFromLocal && (
          <span className="text-xs text-orange-600 flex items-center bg-orange-50 py-1 px-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cached data
          </span>
        )}
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <div className="p-6">
          <p className="text-neutral-dark mb-6 leading-relaxed">
            {developmentData?.description || "Information not available for this week. Please try updating your pregnancy stage again."}
          </p>
          
          {developmentData?.keyDevelopments && developmentData.keyDevelopments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary mb-3">Key Developments This Week</h3>
              <ul className="list-disc pl-5 space-y-2 text-neutral-dark">
                {developmentData.keyDevelopments.map((development, index) => (
                  <li key={index} className="leading-relaxed">{development}</li>
                ))}
              </ul>
            </div>
          )}
          
          {developmentData?.funFact && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-blue-700 mb-2">Fun Fact</h3>
              <p className="text-blue-700">{developmentData.funFact}</p>
            </div>
          )}
          
          {developmentData?.size && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-primary mb-2">Size Comparison</h3>
              <p className="text-neutral-dark">{developmentData.size}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyDevelopment;