import { BABY_SIZE_COMPARISONS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, InfoIcon } from "lucide-react";
import { useOpenAIStatus } from "@/hooks/use-openai-status";
import { Badge } from "@/components/ui/badge";

interface BabyDevelopmentProps {
  currentWeek: number;
}

interface MilestoneData {
  description: string;
  keyDevelopments: string[];
  funFact?: string;
  size?: string;
  imageDescription?: string;
}

const BabyDevelopment = ({ currentWeek }: BabyDevelopmentProps) => {
  // Use state to track if we should use AI-generated content
  const [useAIContent, setUseAIContent] = useState(false);
  
  // Check if OpenAI integration is available
  const { isAvailable: isOpenAIAvailable, isLoading: checkingOpenAI } = useOpenAIStatus();
  
  // Get baby size for current week from constants (fallback)
  const babySize = BABY_SIZE_COMPARISONS.find(item => item.week === currentWeek) || 
                  BABY_SIZE_COMPARISONS[0]; // Default to first week if not found
                  
  // Fetch dynamic baby development information from the API
  const { 
    data: aiMilestones, 
    isLoading, 
    isError, 
    error 
  } = useQuery<MilestoneData>({
    queryKey: ["/api/baby-development", currentWeek],
    queryFn: async () => {
      if (!useAIContent) return null;
      
      // Add cache-busting parameter for production environments
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/baby-development/${currentWeek}?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch baby development data");
      }
      return response.json();
    },
    enabled: useAIContent && (isOpenAIAvailable || !checkingOpenAI), // Only run if OpenAI is available
    retry: 2, // Retry failed requests twice
    retryDelay: 1000 // Wait 1 second between retries
  });
  
  // Set useAIContent to true after component mounts and OpenAI status is checked
  useEffect(() => {
    if (!checkingOpenAI) {
      setUseAIContent(true);
      console.log(`BabyDevelopment: Requesting AI data for week ${currentWeek}`);
    }
  }, [currentWeek, checkingOpenAI]);
  
  // Determine the milestone data to display
  const milestones: MilestoneData = aiMilestones || {
    description: "Your baby is continuing to grow and develop this week. Check back soon for more specific information.",
    keyDevelopments: ["Development information is being generated", "Please check back in a moment"],
    funFact: "Every baby develops at their own pace, and the information provided is a general guideline."
  };

  // Use AI-provided size if available, otherwise use the value from constants
  const displaySize = (aiMilestones?.size) || babySize.size;
  
  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl p-6 shadow-md border border-primary/10">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-montserrat font-bold text-primary flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-3">
              <i className="fas fa-baby text-primary"></i>
            </span>
            Your Baby's Development
          </h2>
          <p className="text-neutral-dark mt-1 ml-11">Track how your baby is growing week by week</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-neutral-dark">Loading baby development information...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4">
            <h3 className="font-bold mb-2 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Error Loading Development Data
            </h3>
            <p className="text-sm">We couldn't load the latest development information. Using saved information instead.</p>
            <p className="text-xs mt-2 text-red-500">{error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="md:w-1/2 mb-6 md:mb-0">
              {/* Enhanced image container with subtle decoration */}
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-full z-0"></div>
                <div className="relative z-10 bg-white p-2 rounded-xl shadow-md border border-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1610122748280-d0ae76b10750?w=500&auto=format&fit=crop&q=60" 
                    alt="Baby Development Stage" 
                    className="w-full rounded-lg h-80 object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-primary/5 rounded-full z-0"></div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="flex items-center mb-4">
                <div className="relative mr-4">
                  <div className="rounded-lg shadow-md flex items-center justify-center bg-gradient-to-br from-neutral-light to-white h-[180px] w-[180px] text-center border border-gray-100">
                    <div className="flex flex-col items-center">
                      <span className="text-7xl mb-3" aria-hidden="true">{babySize.image}</span>
                      <span className="text-lg font-montserrat font-medium text-primary">Week {currentWeek}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 right-1/2 transform translate-x-1/2 bg-primary text-white rounded-full px-4 py-1 shadow-md">
                    <span className="font-montserrat font-medium text-sm">Size: {displaySize}</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-montserrat font-bold text-primary-dark mb-2">Your Baby This Week</h3>
                  <p className="text-neutral-dark text-sm leading-relaxed">{milestones.description}</p>
                </div>
              </div>

              <div className="bg-neutral-light/80 rounded-lg p-5 shadow-sm border border-primary/5 mt-6">
                <h3 className="font-montserrat font-bold text-lg mb-3 text-primary-dark flex items-center">
                  <i className="fas fa-list-check text-primary mr-2"></i>
                  Key Developments
                </h3>
                <ul className="space-y-3">
                  {milestones.keyDevelopments.map((development, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mr-3 mt-0.5">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                      <span className="text-neutral-dark">{development}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {'funFact' in milestones && milestones.funFact && (
                <div className="mt-4 bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-start">
                    <i className="fas fa-lightbulb text-primary text-lg mt-1 mr-3"></i>
                    <p className="text-neutral-dark italic">{milestones.funFact}</p>
                  </div>
                </div>
              )}
              
              {aiMilestones && (
                <div className="mt-4 text-xs text-right text-neutral-400">
                  <p>AI-generated content for Week {currentWeek}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyDevelopment;