import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NAME_ORIGINS, NAME_GENDERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AdditionalFeaturesProps {
  currentWeek: number;
}

const AdditionalFeatures = ({ currentWeek }: AdditionalFeaturesProps) => {
  const [medicationName, setMedicationName] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("All Origins");
  const [selectedGender, setSelectedGender] = useState("All Genders");
  const { toast } = useToast();

  // Medication check mutation
  const checkMedicationMutation = useMutation({
    mutationFn: async (data: { medicationName: string }) => {
      return await apiRequest("/api/medication/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      const variant = data.isSafe === true ? "default" : 
                      data.isSafe === false ? "destructive" : "default";
      
      toast({
        title: data.isSafe === true ? "Safe for pregnancy" : 
               data.isSafe === false ? "Not recommended during pregnancy" : 
               "Safety information unavailable",
        description: data.notes,
        variant,
      });
    },
    onError: (error) => {
      toast({
        title: "Error checking medication",
        description: `Failed to check medication: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleMedicationCheck = () => {
    if (!medicationName.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a medication name",
        variant: "destructive",
      });
      return;
    }
    
    checkMedicationMutation.mutate({ medicationName });
  };

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch names');
      }

      const data = await response.json();
      if (!data.names || !data.meanings) {
        throw new Error('Invalid response format');
      }

      const namesList = data.names;
      const meanings = data.meanings;
      
      setNames(namesList.map(name => ({
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

  // Add names display section after the button
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Medication Safety Checker */}
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-pills mr-2"></i>Medication Safety Checker
        </h3>
        <p className="mb-4">Verify if a medication is safe to use during your pregnancy.</p>
        
        <div className="flex gap-3 mb-4">
          <input 
            type="text" 
            className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
            placeholder="Enter medication name..."
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
          />
          <button 
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-montserrat font-medium transition duration-300"
            onClick={handleMedicationCheck}
            disabled={checkMedicationMutation.isPending}
          >
            {checkMedicationMutation.isPending ? "Checking..." : "Check"}
          </button>
        </div>
        
        <p className="text-sm text-neutral-dark">Recently checked: Acetaminophen, Prenatal vitamins</p>
      </div>
      
      {/* Baby Name Explorer */}
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-baby mr-2"></i>Baby Name Explorer
        </h3>
        <p className="mb-4">Find the perfect name for your little one with our name database.</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            {NAME_ORIGINS.map(origin => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>
          <select 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            {NAME_GENDERS.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-montserrat font-medium transition duration-300"
          onClick={handleExploreNames}
          disabled={isLoadingNames}
        >
          {isLoadingNames ? "Generating Names..." : "Explore Names"}
        </button>

        {names.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold mb-2">Generated Names:</h4>
            <div className="max-h-60 overflow-y-auto">
              {names.map((item, index) => (
                <div key={index} className="border-b border-gray-100 py-2">
                  <span className="font-medium text-primary">{item.name}</span>
                  <p className="text-sm text-gray-600">{item.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Medication Safety Checker */}
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-pills mr-2"></i>Medication Safety Checker
        </h3>
        <p className="mb-4">Verify if a medication is safe to use during your pregnancy.</p>
        
        <div className="flex gap-3 mb-4">
          <input 
            type="text" 
            className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
            placeholder="Enter medication name..."
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
          />
          <button 
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-montserrat font-medium transition duration-300"
            onClick={handleMedicationCheck}
            disabled={checkMedicationMutation.isPending}
          >
            {checkMedicationMutation.isPending ? "Checking..." : "Check"}
          </button>
        </div>
        
        <p className="text-sm text-neutral-dark">Recently checked: Acetaminophen, Prenatal vitamins</p>
      </div>
      
      {/* Baby Name Explorer */}
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-baby mr-2"></i>Baby Name Explorer
        </h3>
        <p className="mb-4">Find the perfect name for your little one with our name database.</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            {NAME_ORIGINS.map(origin => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>
          <select 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            {NAME_GENDERS.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-montserrat font-medium transition duration-300"
          onClick={handleExploreNames}
        >
          Explore Names
        </button>
      </div>
    </div>
  );
};

export default AdditionalFeatures;
