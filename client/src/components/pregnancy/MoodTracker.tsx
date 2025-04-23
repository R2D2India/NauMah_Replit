import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SmilePlus, Smile, Meh, Frown, AlertTriangle, History, BookOpen, Loader2 } from "lucide-react";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  note?: string;
  week: number;
  createdAt: string;
}

interface MoodTrackerProps {
  currentWeek: number;
}

const MoodTracker = ({ currentWeek }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();
  
  // Fetch mood entries
  const { data: moodEntriesResponse, isLoading: isLoadingMoodEntries } = useQuery({
    queryKey: ["/api/mood"]
  });
  
  // Convert the response to properly typed mood entries array
  const moodEntries: MoodEntry[] = Array.isArray(moodEntriesResponse) ? moodEntriesResponse : [];

  // Mood entry mutation
  const createMoodEntryMutation = useMutation({
    mutationFn: async (data: { mood: string; note?: string; week: number }) => {
      return await apiRequest("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      // Clear form and show success message
      setSelectedMood(null);
      setNote("");
      
      toast({
        title: "Mood saved",
        description: "Your mood entry has been recorded successfully.",
        variant: "default",
      });
      
      // Invalidate mood entries query if implemented
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving mood",
        description: `Failed to save mood entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveMood = () => {
    if (!selectedMood) {
      toast({
        title: "Mood selection required",
        description: "Please select your current mood",
        variant: "destructive",
      });
      return;
    }
    
    createMoodEntryMutation.mutate({ 
      mood: selectedMood, 
      note: note.trim() !== "" ? note : undefined,
      week: currentWeek
    });
  };

  // Updated with Lucide icons
  const moods = [
    { id: "great", label: "Great", icon: SmilePlus, color: "text-yellow-500", bgColor: "bg-yellow-100" },
    { id: "good", label: "Good", icon: Smile, color: "text-green-500", bgColor: "bg-green-100" },
    { id: "okay", label: "Okay", icon: Meh, color: "text-blue-500", bgColor: "bg-blue-100" },
    { id: "low", label: "Low", icon: Frown, color: "text-orange-500", bgColor: "bg-orange-100" },
    { id: "stressed", label: "Stressed", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-100" },
  ];

  return (
    <div>
      <div className="p-6">
        <p className="text-gray-600 mb-5">Select an emotion that best represents how you're feeling today.</p>
        
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {moods.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.id;
            return (
              <button 
                key={mood.id}
                className={`mood-btn p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                  isSelected 
                    ? `${mood.bgColor} border-2 border-${mood.color.split('-')[1]} shadow-md transform scale-110` 
                    : 'bg-neutral-50 border-2 border-neutral-100 hover:border-neutral-200'
                }`}
                onClick={() => setSelectedMood(mood.id)}
                aria-pressed={isSelected}
                title={`Select ${mood.label} mood`}
              >
                <div className={`w-12 h-12 rounded-full ${isSelected ? mood.bgColor : 'bg-white'} flex items-center justify-center mb-2`}>
                  <Icon className={`w-6 h-6 ${mood.color}`} />
                </div>
                <span className={`font-medium text-sm ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>{mood.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="bg-neutral-light rounded-lg p-4 mb-4">
          <h4 className="font-montserrat font-medium mb-2">Add a note (optional)</h4>
          <textarea 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
            rows={2} 
            placeholder="How are you feeling today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>
        
        <button 
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-montserrat font-medium transition duration-300"
          onClick={handleSaveMood}
          disabled={createMoodEntryMutation.isPending}
        >
          {createMoodEntryMutation.isPending ? "Saving..." : "Save Today's Mood"}
        </button>
      </div>

      {/* Mood History */}
      <div className="bg-white/50 rounded-xl p-6 border mt-8">
        <h3 className="text-xl font-medium mb-4 flex items-center">
          <History className="mr-2 w-5 h-5 text-primary" />
          Your Mood History
        </h3>
        
        {isLoadingMoodEntries ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="mt-3">Loading your mood history...</p>
          </div>
        ) : moodEntries.length > 0 ? (
          <div className="space-y-3">
            {moodEntries.slice(0, 5).map((entry) => {
              // Find the mood details to get the icon and color
              const moodDetails = moods.find(m => m.id === entry.mood);
              
              return (
                <div key={entry.id} className="bg-neutral-light p-4 rounded-lg flex items-start">
                  {moodDetails && (
                    <>
                      <div className={`h-12 w-12 rounded-full ${moodDetails.bgColor} flex items-center justify-center mr-3 shadow-sm`}>
                        <moodDetails.icon className={`w-6 h-6 ${moodDetails.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="font-semibold">{moodDetails.label}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {entry.note && <p className="text-sm mt-1 text-gray-700">{entry.note}</p>}
                        <div className="text-xs text-gray-500 mt-1">Week {entry.week}</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto bg-neutral-light w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-gray-500" />
            </div>
            <h4 className="font-montserrat font-medium mb-2">No mood entries yet</h4>
            <p className="text-gray-500 text-sm">
              Track your first mood using the form above to start building your pregnancy mood journal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
