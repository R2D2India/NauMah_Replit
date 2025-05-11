import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocalBabyDevelopmentData, saveLocalBabyDevelopmentData } from "@/lib/localDataStore";
import { useOpenAIStatus } from "@/hooks/use-openai-status";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface BabyDevelopmentProps {
  currentWeek: number;
  developmentData?: any; // Data from combined API call
  isLocalData?: boolean; // Indicator for local data source
}

interface BabyDevelopmentData {
  description: string;
  keyDevelopments: string[];
  funFact?: string;
  size?: string;
  imageDescription?: string;
  week: number;
}

const BabyDevelopment = ({ currentWeek, developmentData: preloadedData, isLocalData }: BabyDevelopmentProps) => {
  const [babyData, setBabyData] = useState<BabyDevelopmentData | null>(null);
  const [loadingFromLocal, setLoadingFromLocal] = useState(false);
  const [isProductionMode, setIsProductionMode] = useState(false);
  
  // Get translation hooks
  const { t, i18n } = useTranslation();
  
  // Check if OpenAI is available
  const { isAvailable: isAIAvailable } = useOpenAIStatus();
  
  // Set local data flag based on prop
  useEffect(() => {
    if (isLocalData) {
      setLoadingFromLocal(true);
    }
  }, [isLocalData]);
  
  // Detect if we're in production environment and handle data loading
  useEffect(() => {
    const host = window.location.host;
    // Check if we're in a deployed Replit environment
    const isProduction = host.includes('.replit.app') || host.includes('.repl.co');
    setIsProductionMode(isProduction);
    
    // If in production, try to use provided data first, then local storage data
    if (isProduction) {
      if (preloadedData) {
        console.log(`Using provided baby development data for week ${currentWeek}`);
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
  
  // If we have provided data, use it and save to localStorage
  useEffect(() => {
    if (preloadedData) {
      console.log("BabyDevelopment: Using provided data from parent component");
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
    queryKey: [`/api/baby-development/${currentWeek}`, i18n.language],
    enabled: currentWeek > 0 && !babyData && !loadingFromLocal,
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    queryFn: async () => {
      console.log(`Fetching baby development data for week ${currentWeek} in language ${i18n.language}`);
      const response = await fetch(`/api/baby-development/${currentWeek}?lang=${i18n.language}`);
      if (!response.ok) {
        throw new Error('Failed to fetch baby development data');
      }
      return response.json();
    }
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
  
  // If preloaded data doesn't match current week or language changes, get data for current week from API or localStorage
  useEffect(() => {
    // If we have preloaded data that matches our current week, use it
    if (preloadedData && preloadedData.week === currentWeek) {
      console.log(`BabyDevelopment: Using preloaded data for week ${currentWeek}`);
      setBabyData(preloadedData);
      return;
    }
    
    // If no preloaded data or it doesn't match current week
    if (!preloadedData || preloadedData.week !== currentWeek) {
      console.log(`BabyDevelopment: Preloaded data week ${preloadedData?.week} doesn't match current week ${currentWeek}`);
      
      // In development mode or when language changes, skip localStorage and request fresh data
      const isLanguageChanged = localStorage.getItem('lastLanguage') !== i18n.language;
      if (isLanguageChanged) {
        localStorage.setItem('lastLanguage', i18n.language);
        console.log(`Language changed to ${i18n.language}, fetching fresh baby development data`);
        
        // Reset data to trigger a new query with the current language
        setBabyData(null);
        setLoadingFromLocal(false);
        return;
      }
      
      // Try localStorage first
      const localData = getLocalBabyDevelopmentData(currentWeek);
      if (localData) {
        console.log(`Using local storage baby development data for week ${currentWeek}`);
        setBabyData(localData);
        setLoadingFromLocal(true);
      } else {
        // If no local data, make direct API call
        console.log("BabyDevelopment: Requesting data for week", currentWeek);
        console.log("Will make direct API call to baby-development endpoint for week", currentWeek);
        
        // Reset data to trigger a new query
        setBabyData(null);
        setLoadingFromLocal(false);
      }
    }
  }, [currentWeek, preloadedData, i18n.language]);
  
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
      <div className="flex flex-wrap justify-between items-start md:items-center mb-4">
        <h2 className="text-xl md:text-2xl font-montserrat font-bold text-primary flex items-center mb-2 md:mb-0">
          <span className="bg-primary/10 p-1 md:p-2 rounded-full mr-2 md:mr-3 hidden md:flex">
            <i className="fas fa-baby text-primary"></i>
          </span>
          <span className="bg-primary/10 p-1 rounded-full mr-2 flex md:hidden">
            <i className="fas fa-baby text-primary text-sm"></i>
          </span>
          {t('babyDevelopment.title', 'Baby Development - Week {{week}}', { week: currentWeek })}
        </h2>
        
        {loadingFromLocal && (
          <span className="text-xs text-orange-600 flex items-center bg-orange-50 py-1 px-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('babyDevelopment.cachedData', 'Cached data')}
          </span>
        )}
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <div className="p-6">
          <p className="text-neutral-dark mb-6 leading-relaxed">
            {developmentData?.description || t('babyDevelopment.noInfo', 'Information not available for this week. Please try updating your pregnancy stage again.')}
          </p>
          
          {developmentData?.keyDevelopments && developmentData.keyDevelopments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary mb-3">{t('babyDevelopment.keyDevelopments', 'Key Developments This Week')}</h3>
              <ul className="list-disc pl-5 space-y-2 text-neutral-dark">
                {developmentData.keyDevelopments.map((development, index) => (
                  <li key={index} className="leading-relaxed">
                    {t(`babyDevelopment.development${index + 1}`, development, { defaultValue: development })}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {developmentData?.funFact && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-blue-700 mb-2">{t('babyDevelopment.funFact', 'Fun Fact')}</h3>
              <p className="text-blue-700">{t('babyDevelopment.funFactContent', developmentData.funFact, { defaultValue: developmentData.funFact })}</p>
            </div>
          )}
          
          {developmentData?.size && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-primary mb-2">{t('babyDevelopment.sizeComparison', 'Size Comparison')}</h3>
              <p className="text-neutral-dark">{t('babyDevelopment.sizeContent', developmentData.size, { defaultValue: developmentData.size })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyDevelopment;