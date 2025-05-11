import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, FilePlus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SafetyChecker() {
  const { t } = useTranslation();
  const [medicationName, setMedicationName] = useState("");
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
        title: t('safety.input_required'),
        description: t('safety.enter_medication'),
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full border border-primary/5">
      {/* Elegant header with gradient underline */}
      <div className="relative pb-3 mb-5">
        <h3 className="text-xl font-montserrat font-bold text-primary flex items-center">
          <i className="fas fa-pills mr-3 p-2 bg-primary/10 rounded-full"></i>
          <span>{t('safety.title')}</span>
        </h3>
        <div className="absolute bottom-0 left-0 w-24 h-1 bg-gradient-to-r from-primary to-primary/30 rounded-full"></div>
      </div>
      
      <p className="mb-5 text-neutral-dark leading-relaxed">
        {t('safety.subtitle')}
      </p>
      
      {/* Enhanced text input for medication names */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input 
            type="text" 
            className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none shadow-sm transition-all duration-200" 
            placeholder={t('safety.input_placeholder')}
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
          />
        </div>
        <button 
          className="bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-montserrat font-medium transition duration-300 shadow-sm hover:shadow flex items-center justify-center"
          onClick={handleMedicationCheck}
          disabled={checkMedicationMutation.isPending}
        >
          {checkMedicationMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              <span>{t('safety.checking')}</span>
            </>
          ) : (
            <>
              <i className="fas fa-check-circle mr-2"></i>
              <span>{t('safety.check_button')}</span>
            </>
          )}
        </button>
      </div>
      
      {/* Camera UI when active */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-primary">Take a Photo</h3>
              <button 
                onClick={cancelCamera}
                className="text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            
            <div className="relative bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-auto"
                style={{ maxHeight: '70vh' }}
              ></video>
            </div>
            
            <div className="p-4 flex justify-between">
              <button 
                onClick={cancelCamera}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={takePicture}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition"
              >
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Divider with label */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm text-neutral-dark">{t('common.or')}</span>
        </div>
      </div>

      {/* Enhanced camera and upload buttons */}
      <div className="mb-5">
        <p className="mb-3 font-medium flex items-center">
          <i className="fas fa-camera text-primary mr-2"></i>
          <span>{t('safety.analyze_label')}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="flex items-center justify-center bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 rounded-lg p-4 transition duration-200 shadow-sm hover:shadow group"
            onClick={handleCameraCapture}
            disabled={analyzeProductImageMutation.isPending || showCamera}
          >
            <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('safety.take_photo')}</p>
              <p className="text-xs text-gray-500">{t('safety.camera_description')}</p>
            </div>
          </button>
          
          <button
            className="flex items-center justify-center bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border border-gray-200 rounded-lg p-4 transition duration-200 shadow-sm hover:shadow group"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzeProductImageMutation.isPending || showCamera}
          >
            <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FilePlus className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('safety.upload_image')}</p>
              <p className="text-xs text-gray-500">{t('safety.upload_description')}</p>
            </div>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      {/* Enhanced image preview and analysis results */}
      {imagePreview && (
        <div className="mt-6 border border-primary/10 rounded-lg overflow-hidden bg-white shadow-md">
          <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex justify-between items-center">
            <h4 className="font-medium text-primary flex items-center">
              <i className="fas fa-image mr-2"></i>
              <span>{t('safety.product_analysis')}</span>
            </h4>
            <button
              className="text-sm text-gray-500 hover:text-red-500 bg-white hover:bg-red-50 rounded-full p-1 transition-colors"
              onClick={clearImagePreview}
              title="Clear image"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Image preview */}
              <div className="relative md:w-1/3">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <img 
                    src={imagePreview} 
                    alt="Product" 
                    className="w-full h-auto max-h-48 object-contain rounded" 
                  />
                </div>
                
                {analyzeProductImageMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                    <div className="text-center text-white px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm">
                      <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Analyzing image...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Analysis results */}
              {productAnalysisResult && (
                <div className="md:w-2/3">
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-gray-500">Product Name</span>
                      <span className="font-medium text-lg">{productAnalysisResult.productName}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-gray-500">Product Type</span>
                      <span className="font-medium">{productAnalysisResult.productType}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-gray-500">Safety Status</span>
                      <span className={`font-medium ${
                        productAnalysisResult.isSafe === true ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block' :
                        productAnalysisResult.isSafe === false ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block' :
                        'text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full inline-block'
                      }`}>
                        {productAnalysisResult.isSafe === true ? '✓ Safe for pregnancy' :
                        productAnalysisResult.isSafe === false ? '✕ Not recommended' :
                        '? Unknown safety profile'}
                      </span>
                    </div>
                    
                    {productAnalysisResult.notes && (
                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-gray-500">Notes</span>
                        <p className="text-neutral-dark bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">{productAnalysisResult.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Recently checked section with enhanced design */}
      <div className="flex items-center mt-6 pt-4 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Recently checked:</span>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-primary/5 px-2 py-1 rounded-full text-primary">Acetaminophen</span>
          <span className="text-xs bg-primary/5 px-2 py-1 rounded-full text-primary">Prenatal vitamins</span>
          <span className="text-xs bg-primary/5 px-2 py-1 rounded-full text-primary">Ginger tea</span>
        </div>
      </div>
    </div>
  );
}