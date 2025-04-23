import { useState } from "react";
import { NAME_ORIGINS, NAME_GENDERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AdditionalFeaturesProps {
  currentWeek: number;
}

const AdditionalFeatures = ({ currentWeek }: AdditionalFeaturesProps) => {
  const [medicationName, setMedicationName] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("All Origins");
  const [selectedGender, setSelectedGender] = useState("All Genders");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productAnalysisResult, setProductAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Product image analysis mutation
  const analyzeProductImageMutation = useMutation({
    mutationFn: async (data: { imageBase64: string }) => {
      return await apiRequest("/api/product/image-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setProductAnalysisResult(data);
      
      const variant = data.isSafe === true ? "default" : 
                      data.isSafe === false ? "destructive" : "default";
      
      toast({
        title: data.isSafe === true ? `${data.productName} is safe for pregnancy` : 
               data.isSafe === false ? `${data.productName} is not recommended during pregnancy` : 
               `Safety information for ${data.productName} is unavailable`,
        description: data.notes,
        variant,
      });
    },
    onError: (error) => {
      setImagePreview(null);
      toast({
        title: "Error analyzing product",
        description: `Failed to analyze the product image: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        setImagePreview(result);
        analyzeProductImageMutation.mutate({ imageBase64: base64Data });
      }
    };
    reader.readAsDataURL(file);
  };

  // State to manage camera UI
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleCameraCapture = async () => {
    try {
      // Show camera interface
      setShowCamera(true);
      
      // Camera constraints - prefer rear camera if available
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      
      // Access the user's camera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setShowCamera(false);
      
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use this feature or upload an image instead.",
        variant: "destructive",
      });
    }
  };
  
  const takePicture = () => {
    if (!videoRef.current || !cameraStream) return;
    
    // Create a canvas to capture the image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Draw the current video frame to the canvas
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    const base64Data = imageDataUrl.split(',')[1];
    
    // Stop all video streams and hide camera
    cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setShowCamera(false);
    
    // Update state with the captured image
    setImagePreview(imageDataUrl);
    analyzeProductImageMutation.mutate({ imageBase64: base64Data });
  };
  
  const cancelCamera = () => {
    // Stop all video streams and hide camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setProductAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Only display one return statement, removing duplicate code
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
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


};

export default AdditionalFeatures;
