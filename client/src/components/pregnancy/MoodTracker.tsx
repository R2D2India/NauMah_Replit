import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  const moods = [
    { id: "great", label: "Great", icon: "grin-stars", color: "text-yellow-500" },
    { id: "good", label: "Good", icon: "smile", color: "text-green-500" },
    { id: "okay", label: "Okay", icon: "meh", color: "text-blue-500" },
    { id: "low", label: "Low", icon: "frown", color: "text-orange-500" },
    { id: "stressed", label: "Stressed", icon: "tired", color: "text-red-500" },
  ];

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-smile mr-2"></i>Daily Mood Tracker
        </h3>
        <p className="mb-5">Track your emotional well-being throughout your pregnancy journey.</p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {moods.map((mood) => (
            <button 
              key={mood.id}
              className={`mood-btn h-16 w-16 rounded-full ${selectedMood === mood.id ? 'bg-secondary-light' : 'bg-neutral-light hover:bg-secondary-light'} flex flex-col items-center justify-center transition duration-300`}
              onClick={() => setSelectedMood(mood.id)}
            >
              <i className={`fas fa-${mood.icon} text-2xl ${mood.color}`}></i>
              <span className="text-xs mt-1">{mood.label}</span>
            </button>
          ))}
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
      <div className="bg-white rounded-xl p-6 custom-shadow mt-6">
        <h3 className="text-xl font-montserrat font-bold text-primary mb-4">
          <i className="fas fa-history mr-2"></i>Your Mood History
        </h3>
        
        {isLoadingMoodEntries ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent"></div>
            <p className="mt-3">Loading your mood history...</p>
          </div>
        ) : moodEntries.length > 0 ? (
          <div className="space-y-3">
            {moodEntries.slice(0, 5).map((entry) => {
              // Find the mood details to get the icon and color
              const moodDetails = moods.find(m => m.id === entry.mood);
              
              return (
                <div key={entry.id} className="bg-neutral-light p-3 rounded-lg flex items-start">
                  <div className={`h-12 w-12 rounded-full bg-white flex items-center justify-center mr-3 ${moodDetails?.color}`}>
                    <i className={`fas fa-${moodDetails?.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold">{moodDetails?.label}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {entry.note && <p className="text-sm mt-1">{entry.note}</p>}
                    <div className="text-xs text-gray-500 mt-1">Week {entry.week}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto bg-neutral-light w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-book text-xl text-gray-500"></i>
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
