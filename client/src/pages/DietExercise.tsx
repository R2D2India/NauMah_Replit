import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { 
  DIET_RECOMMENDATIONS, 
  EXERCISE_RECOMMENDATIONS, 
  TEST_RECOMMENDATIONS, 
  COMMON_SYMPTOMS, 
  RESOURCE_RECOMMENDATIONS, 
  getTrimeasterFromWeek 
} from "@/lib/constants";
import { queryClient, appEvents, APP_EVENTS, STORAGE_KEYS } from "@/lib/queryClient";
import { getLocalPregnancyData, saveLocalPregnancyData } from "@/lib/localDataStore";
import { 
  Apple, 
  Dumbbell, 
  TestTube, 
  Activity, 
  BookOpen, 
  AlertCircle, 
  Coffee, 
  Utensils, 
  Moon, 
  Cherry 
} from "lucide-react";

export default function DietExercise() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("diet");
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [mealPlan, setMealPlan] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  } | null>(null);

  // Define pregnancy data type
  interface PregnancyData {
    currentWeek: number;
    dueDate?: string;
    startDate?: string;
    [key: string]: any;
  }
  
  // Get pregnancy data for current week
  const { data: pregnancyData, refetch: refetchPregnancyData } = useQuery<PregnancyData | null>({
    queryKey: ["/api/pregnancy"],
    staleTime: 0, // Always refetch when accessed
    refetchOnMount: true, // Ensure data is fresh when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
  
  // Track if we're using local data
  const [loadingFromLocal, setLoadingFromLocal] = useState(false);
  const localDataRef = useRef<PregnancyData | null>(null);
  
  // Set up logging for data changes and sync status
  useEffect(() => {
    if (pregnancyData) {
      console.log("⚠️ Diet & Exercise: Pregnancy data updated", pregnancyData);
      
      // When we get server data, store it locally
      if (!loadingFromLocal && !pregnancyData._userSpecified) {
        saveLocalPregnancyData(pregnancyData);
      }
      
      // Clear synchronizing state
      setIsSynchronizing(false);
    }
  }, [pregnancyData, loadingFromLocal]);
  
  // For production, use local data if needed
  useEffect(() => {
    // Check for local data if server data is missing or if it shows week 1
    if ((!pregnancyData || pregnancyData.currentWeek === 1) && !loadingFromLocal) {
      // Get local data with user preference priority
      const localData = getLocalPregnancyData();
      
      if (localData && localData._userSpecified === true) {
        console.log("Diet & Exercise: Using user-specified local data:", localData);
        localDataRef.current = localData;
        setLoadingFromLocal(true);
        
        // Update the UI with the local data
        queryClient.setQueryData(["/api/pregnancy"], localData);
      }
    }
  }, [pregnancyData, loadingFromLocal]);

  // Use either server data or local data with proper fallback
  const currentWeek = (loadingFromLocal && localDataRef.current?.currentWeek) || 
    pregnancyData?.currentWeek || 1;

  // Generate a meal plan
  const handleGenerateMealPlan = async () => {
    try {
      setIsGeneratingMealPlan(true);
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentWeek }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate meal plan");
      }

      const data = await response.json();
      setMealPlan(data);
    } catch (error) {
      console.error("Error generating meal plan:", error);
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  // Get trimester for recommendations
  const trimester = getTrimeasterFromWeek(currentWeek);

  // Track if component is mounted
  const isMounted = useRef(true);
  const lastUpdateTimestamp = useRef(0);
  
  // Force sync on initial render
  useEffect(() => {
    console.log("⚠️ Diet & Exercise: Component mounted, forcing data sync");
    // Short delay to ensure all components are loaded
    const timer = setTimeout(() => {
      if (isMounted.current) {
        console.log("⚠️ Diet & Exercise: Initial force sync");
        appEvents.forceSyncAll();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check URL parameters for timestamp changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const urlTimestamp = parseInt(url.searchParams.get('_t') || '0');
      if (urlTimestamp > 0 && urlTimestamp > lastUpdateTimestamp.current) {
        console.log("Diet & Exercise: Detected URL timestamp change, refreshing data");
        lastUpdateTimestamp.current = urlTimestamp;
        refetchPregnancyData();
      }
    } catch (err) {
      console.error("Error processing URL parameters:", err);
    }
  }, [window.location.search, refetchPregnancyData]);
  
  // Set up event listeners for pregnancy data updates
  useEffect(() => {
    // Set up pregnancy stage update event listener
    const handlePregnancyStageUpdate = (updatedData: any) => {
      console.log("Diet & Exercise: Received pregnancy stage update event", updatedData);
      if (isMounted.current) {
        // Show synchronizing state
        setIsSynchronizing(true);
        
        // Mark this as user-specified data for persistence
        if (updatedData) {
          // Create a copy with user metadata
          const userUpdatedData = {
            ...updatedData,
            _userSpecified: true,
            _localTimestamp: Date.now()
          };
          
          // Save to local storage immediately
          saveLocalPregnancyData(userUpdatedData);
          
          // Update the UI directly without waiting for API
          queryClient.setQueryData(["/api/pregnancy"], userUpdatedData);
          
          // Still refresh from server to sync both ways
          refetchPregnancyData();
        } else {
          // If no data, just refresh
          refetchPregnancyData();
        }
        
        // Update our last timestamp
        lastUpdateTimestamp.current = Date.now();
      }
    };
    
    // Subscribe to pregnancy stage update events (in-memory)
    const unsubscribe = appEvents.subscribe(
      APP_EVENTS.PREGNANCY_STAGE_UPDATED, 
      handlePregnancyStageUpdate
    );
    
    // Initial fetch
    refetchPregnancyData();
    
    // Check if there was a recent update in localStorage
    try {
      const localTimestamp = appEvents.getLastUpdateTimestamp();
      if (localTimestamp > 0 && localTimestamp > lastUpdateTimestamp.current) {
        console.log("Diet & Exercise: Detected localStorage update, refreshing data");
        lastUpdateTimestamp.current = localTimestamp;
        refetchPregnancyData();
      }
    } catch (err) {
      console.error("Error checking localStorage:", err);
    }
    
    // Set up storage event listener for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LAST_PREGNANCY_UPDATE && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          console.log("Diet & Exercise: Detected localStorage event", data);
          if (isMounted.current && data.timestamp > lastUpdateTimestamp.current) {
            lastUpdateTimestamp.current = data.timestamp;
            setIsSynchronizing(true);
            
            // Check for user data in localStorage
            const localData = getLocalPregnancyData();
            if (localData && localData._userSpecified === true) {
              // If we have userSpecified data, use it directly
              queryClient.setQueryData(["/api/pregnancy"], localData);
              // Still trigger a server sync (but we prioritize local data)
              refetchPregnancyData();
            } else {
              // If no user data, fetch from server
              refetchPregnancyData();
            }
          }
        } catch (err) {
          console.error("Error processing storage event:", err);
        }
      }
    };
    
    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Set up a periodic check for updates as a fallback mechanism - less frequent now
    const intervalId = setInterval(() => {
      if (isMounted.current) {
        console.log("Diet & Exercise: Periodic pregnancy data refresh");
        
        // First check for user-specified local data
        const localData = getLocalPregnancyData();
        if (localData && localData._userSpecified === true) {
          // If we have user data with a timestamp that's newer than server data
          const currentData = queryClient.getQueryData<PregnancyData | null>(["/api/pregnancy"]);
          const serverTime = currentData?._serverTimestamp || 0;
          const localTime = localData._localTimestamp || 0;
          
          if (localTime > serverTime) {
            console.log("Diet & Exercise: Using fresher local data in periodic refresh");
            queryClient.setQueryData(["/api/pregnancy"], localData);
          }
        }
        
        // Still fetch from server but local data will have priority when rendering
        refetchPregnancyData();
      }
    }, 30000); // Every 30 seconds as a fallback (reduced frequency)
    
    // Clean up
    return () => {
      isMounted.current = false;
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [refetchPregnancyData]);
  
  // Get recommendations based on trimester
  const dietRecs = DIET_RECOMMENDATIONS[trimester as keyof typeof DIET_RECOMMENDATIONS];
  const exerciseRecs = EXERCISE_RECOMMENDATIONS[trimester as keyof typeof EXERCISE_RECOMMENDATIONS];
  const testRecs = TEST_RECOMMENDATIONS[trimester as keyof typeof TEST_RECOMMENDATIONS];
  const symptoms = COMMON_SYMPTOMS[trimester as keyof typeof COMMON_SYMPTOMS];
  const resources = RESOURCE_RECOMMENDATIONS;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">{t('dietExercise.title', 'Diet & Exercise')}</h1>
        <div className="text-sm text-gray-500 flex items-center">
          <span className="mr-2">{t('dietExercise.week', 'Week')} {currentWeek}</span>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {t('dietExercise.subtitle', 'Nutrition and activity recommendations for week {{week}} of your pregnancy', { week: currentWeek })}
        </p>
        <div className="flex items-center gap-3">
          {isSynchronizing ? (
            <div className="flex items-center text-xs text-primary animate-pulse">
              <div className="mr-1 relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              {t('dietExercise.syncingData', 'Syncing data...')}
            </div>
          ) : (
            <button 
              onClick={() => {
                console.log("⚠️ Diet & Exercise: Manual sync requested");
                setIsSynchronizing(true);
                appEvents.forceSyncAll();
              }}
              className="text-xs text-primary hover:text-primary-dark flex items-center"
              title={t('dietExercise.syncTooltip', 'Sync data with other pages')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
              </svg>
              {t('dietExercise.sync', 'Sync')}
            </button>
          )}
        </div>
      </div>
      
      <Tabs 
        defaultValue="diet" 
        className="space-y-6" 
        onValueChange={(value) => setActiveTab(value)}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-primary/5 pb-2 border-b">
            <TabsList className="w-full h-auto p-0 bg-transparent space-x-1">
              <TabsTrigger 
                value="diet" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-t-lg rounded-b-none py-3 flex gap-2"
              >
                <Apple className="w-4 h-4" />
                <span>{t('dietExercise.tabLabel.diet', 'Diet')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="exercise" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-t-lg rounded-b-none py-3 flex gap-2"
              >
                <Dumbbell className="w-4 h-4" />
                <span>{t('dietExercise.tabLabel.exercise', 'Exercise')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tests" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-t-lg rounded-b-none py-3 flex gap-2"
              >
                <TestTube className="w-4 h-4" />
                <span>{t('dietExercise.tabLabel.tests', 'Tests')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="symptoms" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-t-lg rounded-b-none py-3 flex gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>{t('dietExercise.tabLabel.symptoms', 'Symptoms')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resources" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-t-lg rounded-b-none py-3 flex gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('dietExercise.tabLabel.resources', 'Resources')}</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-6">
            {/* Diet Tab Content */}
            <TabsContent value="diet" className="mt-0">
              <h3 className="text-xl font-bold text-primary mb-4">
                {t('dietExercise.diet.heading', 'Recommended Diet for Week {{week}}', { week: currentWeek })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3">{t('dietExercise.diet.focusNutrients', 'Focus Nutrients')}</h4>
                  <ul className="space-y-3">
                    {dietRecs.focusNutrients.map((nutrient: { name: string; description: string }, index: number) => (
                      <li key={index} className="flex">
                        <div className="h-6 w-6 rounded-full bg-primary-light flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-3">{index + 1}</div>
                        <div>
                          <span className="font-medium">{t(`dietExercise.nutrients.${nutrient.name.toLowerCase().replace(/[- ]/g, '').replace(/[0-9]/g, '')}`, nutrient.name)}</span>
                          <p className="text-sm text-neutral-dark">{t(`dietExercise.nutrients.${nutrient.name.toLowerCase().replace(/[- ]/g, '').replace(/[0-9]/g, '')}Desc`, nutrient.description)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3">{t('dietExercise.diet.mealPlanner', 'Weekly Meal Planner')}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-primary-dark">{t('dietExercise.diet.breakfast', 'Breakfast')}</div>
                      <p className="text-sm">{t(`dietExercise.meals.${trimester}.breakfast`, dietRecs.sampleMealPlan.breakfast)}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">{t('dietExercise.diet.lunch', 'Lunch')}</div>
                      <p className="text-sm">{t(`dietExercise.meals.${trimester}.lunch`, dietRecs.sampleMealPlan.lunch)}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">{t('dietExercise.diet.dinner', 'Dinner')}</div>
                      <p className="text-sm">{t(`dietExercise.meals.${trimester}.dinner`, dietRecs.sampleMealPlan.dinner)}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">{t('dietExercise.diet.snacks', 'Snacks')}</div>
                      <p className="text-sm">{t(`dietExercise.meals.${trimester}.snacks`, dietRecs.sampleMealPlan.snacks)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary-light rounded-lg border border-secondary">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-primary mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium">{t('dietExercise.diet.personalizedTip', 'Personalized Tip')}</h4>
                    <p className="text-sm">{t('dietExercise.personalizedTipWeek', 'At {{week}} weeks, your baby is developing rapidly. Try adding an extra serving of leafy greens daily to boost your iron intake naturally. Iron is crucial during this period of your pregnancy.', { week: currentWeek })}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button 
                  className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-medium transition duration-300"
                  onClick={handleGenerateMealPlan}
                  disabled={isGeneratingMealPlan}
                >
                  {isGeneratingMealPlan ? t('dietExercise.diet.generating', 'Generating...') : t('dietExercise.diet.generateCompleteMealPlan', 'Generate Complete Meal Plan')}
                </button>
                {mealPlan && (
                  <div className="mt-6 text-left max-w-3xl mx-auto bg-neutral-light rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-bold text-primary mb-4 text-center">{t('dietExercise.diet.yourPersonalizedMealPlan', 'Your Personalized Meal Plan')}</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg text-primary-dark mb-2 border-b border-primary-light pb-1 flex items-center">
                        <Coffee className="h-5 w-5 mr-2" />
                        {t('dietExercise.diet.breakfast', 'Breakfast')}
                      </h4>
                      <ul className="ml-6">
                        <li className="flex items-start mb-1">
                          <span className="text-primary mr-2">•</span>
                          <span>{mealPlan.breakfast}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg text-primary-dark mb-2 border-b border-primary-light pb-1 flex items-center">
                        <Utensils className="h-5 w-5 mr-2" />
                        {t('dietExercise.diet.lunch', 'Lunch')}
                      </h4>
                      <ul className="ml-6">
                        <li className="flex items-start mb-1">
                          <span className="text-primary mr-2">•</span>
                          <span>{mealPlan.lunch}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg text-primary-dark mb-2 border-b border-primary-light pb-1 flex items-center">
                        <Moon className="h-5 w-5 mr-2" />
                        {t('dietExercise.diet.dinner', 'Dinner')}
                      </h4>
                      <ul className="ml-6">
                        <li className="flex items-start mb-1">
                          <span className="text-primary mr-2">•</span>
                          <span>{mealPlan.dinner}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-lg text-primary-dark mb-2 border-b border-primary-light pb-1 flex items-center">
                        <Cherry className="h-5 w-5 mr-2" />
                        {t('dietExercise.diet.snacks', 'Snacks')}
                      </h4>
                      <ul className="ml-6">
                        {mealPlan.snacks.map((snack, index) => (
                          <li key={index} className="flex items-start mb-1">
                            <span className="text-primary mr-2">•</span>
                            <span>{snack}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 inline-block mr-1" />
                      {t('dietExercise.diet.mealPlanOptimalNutrition', 'This meal plan is tailored for week {{week}} of your pregnancy to provide optimal nutrition.', { week: currentWeek })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Exercise Tab Content */}
            <TabsContent value="exercise" className="mt-0">
              <h3 className="text-xl font-bold text-primary mb-4">
                {t('dietExercise.exercise.heading', 'Exercise for Week {{week}}', { week: currentWeek })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {exerciseRecs.map((exercise: { name: string; duration: string; icon: string }, index: number) => (
                  <div key={index} className="bg-neutral-light rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary-light mx-auto mb-3 flex items-center justify-center">
                      <i className={`fas fa-${exercise.icon} text-white text-xl`}></i>
                    </div>
                    <h4 className="font-medium">{t(`dietExercise.exercises.${exercise.name.toLowerCase()}`, exercise.name)}</h4>
                    <p className="text-sm text-neutral-dark">{t(`dietExercise.exercises.${exercise.name.toLowerCase()}Duration${trimester === 'third' ? '3' : '1'}`, exercise.duration)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-light rounded-lg p-4 mb-6">
                <h4 className="font-medium text-lg mb-3">{t('dietExercise.exercise.tips', 'Exercise Tips')}</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Stay hydrated before, during, and after exercise</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Wear comfortable, supportive shoes and clothing</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Avoid exercises that require lying flat on your back</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Listen to your body and stop if you feel discomfort</span>
                  </li>
                </ul>
              </div>

              <div className="bg-secondary-light rounded-lg p-4 border border-secondary mb-5">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium">Important Note</h4>
                    <p className="text-sm">Always consult with your healthcare provider before starting or modifying any exercise routine during pregnancy.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-medium transition duration-300">
                  View Exercise Videos
                </button>
              </div>
            </TabsContent>

            {/* Tests Tab Content */}
            <TabsContent value="tests" className="mt-0">
              <h3 className="text-xl font-bold text-primary mb-4">Recommended Tests for Week {currentWeek}</h3>

              <div className="mb-6 bg-neutral-light rounded-lg p-4">
                <h4 className="font-medium text-lg mb-3">Key Tests This Period</h4>
                <div className="space-y-4">
                  {testRecs.map((test: { name: string; description: string; icon: string }, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mr-4">
                        <i className={`fas fa-${test.icon}`}></i>
                      </div>
                      <div>
                        <h5 className="font-medium">{test.name}</h5>
                        <p className="text-sm text-neutral-dark">{test.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-secondary-light rounded-lg p-4 border border-secondary">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium">Appointment Reminder</h4>
                    <p className="text-sm">Don't forget to schedule your next prenatal check-up. Regular monitoring is important for both you and your baby's health.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Symptoms Tab Content */}
            <TabsContent value="symptoms" className="mt-0">
              <h3 className="text-xl font-bold text-primary mb-4">Common Symptoms in Week {currentWeek}</h3>

              <div className="bg-neutral-light rounded-lg p-4 mb-5">
                <h4 className="font-medium text-lg mb-3">What You Might Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {symptoms.map((symptom: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="font-medium text-primary-dark mb-2">{symptom.name}</h5>
                      <p className="text-sm">{symptom.remedy || symptom.management}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary-light rounded-lg p-4 border border-secondary">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium">When to Call Your Doctor</h4>
                    <p className="text-sm">Contact your healthcare provider immediately if you experience severe abdominal pain, vaginal bleeding, severe headache, vision changes, or decreased fetal movement.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Resources Tab Content */}
            <TabsContent value="resources" className="mt-0">
              <h3 className="text-xl font-bold text-primary mb-4">Helpful Resources</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Convert the nested resources object into a flat array */}
                {[
                  ...(resources.books || []).map((book: any) => ({
                    title: book.title,
                    description: `By ${book.author}`,
                    category: "Book",
                    url: "#" 
                  })),
                  ...(resources.podcasts || []).map((podcast: any) => ({
                    title: podcast.title,
                    description: podcast.description,
                    category: "Podcast",
                    url: "#"
                  }))
                ].map((resource: any, index: number) => (
                  <div key={index} className="bg-neutral-light rounded-lg p-4">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {resource.category}
                    </span>
                    <h4 className="font-medium mt-2 mb-1">{resource.title}</h4>
                    <p className="text-sm mb-3">{resource.description}</p>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      <span>Learn more</span>
                      <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                    </a>
                  </div>
                ))}
              </div>

              <div className="bg-secondary-light rounded-lg p-4 border border-secondary">
                <div className="flex items-start">
                  <i className="fas fa-book-open text-primary mt-1 mr-3 text-lg"></i>
                  <div>
                    <h4 className="font-medium">Recommended Reading</h4>
                    <p className="text-sm">Books like "What to Expect When You're Expecting" and "Expecting Better" can be valuable resources during your pregnancy journey.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}