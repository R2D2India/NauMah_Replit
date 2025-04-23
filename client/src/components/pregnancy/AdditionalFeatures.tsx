import { useState } from "react";
import { NAME_ORIGINS, NAME_GENDERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AdditionalFeaturesProps {
  currentWeek: number;
}

const AdditionalFeatures = ({ currentWeek }: AdditionalFeaturesProps) => {
  const [selectedOrigin, setSelectedOrigin] = useState("All Origins");
  const [selectedGender, setSelectedGender] = useState("All Genders");
  const { toast } = useToast();

  const [names, setNames] = useState<{ name: string; meaning: string }[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);

  const handleExploreNames = async () => {
    try {
      setIsLoadingNames(true);
      const response = await fetch('/api/baby-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: selectedOrigin,
          gender: selectedGender,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch names');
      }

      if (!data.names || !data.meanings) {
        throw new Error('Invalid response format');
      }

      const namesList: string[] = data.names;
      const meanings: Record<string, string> = data.meanings;
      
      setNames(namesList.map((name: string) => ({
        name,
        meaning: meanings[name] || 'A beautiful name',
      })));
    } catch (error) {
      console.error('Error fetching names:', error);
      toast({
        title: "Error",
        description: "Failed to generate names. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNames(false);
    }
  };

  return (
    <div className="mb-8">
      {/* Baby Name Explorer */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-primary/10">
        {/* Section Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-montserrat font-bold text-primary flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-3">
              <i className="fas fa-baby-carriage text-primary"></i>
            </span>
            Baby Name Explorer
          </h2>
          <p className="text-neutral-dark mt-1 ml-11">Find the perfect name for your little one with our AI-powered name generator</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-primary/5 p-5 rounded-lg border border-primary/10">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-globe text-primary"></i>
              </div>
              <div>
                <h4 className="font-medium">Select Preferences</h4>
                <p className="text-xs text-neutral-dark">Choose origin and gender preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-dark">Origin</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none shadow-sm"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                >
                  {NAME_ORIGINS.map(origin => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-dark">Gender</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none shadow-sm"
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                >
                  {NAME_GENDERS.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-montserrat font-medium transition duration-300 shadow hover:shadow-md flex items-center justify-center"
                onClick={handleExploreNames}
                disabled={isLoadingNames}
              >
                {isLoadingNames ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    <span>Generating Names...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    <span>Generate Baby Names</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className={`bg-white rounded-lg border ${names.length > 0 ? 'border-primary/20' : 'border-gray-200'} p-5`}>
            <h4 className="font-medium text-lg mb-3 flex items-center">
              <i className="fas fa-star text-primary mr-2"></i>
              <span>Generated Names</span>
            </h4>
            
            {names.length > 0 ? (
              <div className="max-h-72 overflow-y-auto px-1">
                {names.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 py-3 hover:bg-gray-50 px-2 rounded transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary text-lg">{item.name}</span>
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">
                        {selectedGender === "All Genders" ? "Unisex" : selectedGender.slice(0, -1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.meaning}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <i className="fas fa-baby text-primary/30 text-5xl mb-3"></i>
                <p>Select preferences and click generate to discover beautiful baby names</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );


};

export default AdditionalFeatures;
