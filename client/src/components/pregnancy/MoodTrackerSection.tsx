import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MoodTracker from "./MoodTracker";
import { useQuery } from "@tanstack/react-query";
import { Smile, LineChart, CalendarCheck } from "lucide-react";

export function MoodTrackerSection() {
  // Get current pregnancy week for the mood tracker
  const { data: pregnancyData } = useQuery({
    queryKey: ["/api/pregnancy"],
    queryFn: async () => {
      const response = await fetch("/api/pregnancy");
      if (!response.ok) {
        throw new Error("Failed to fetch pregnancy data");
      }
      return response.json();
    }
  });

  // Default to week 1 if not available
  const currentWeek = pregnancyData?.currentWeek || 1;

  return (
    <div className="mt-10 mb-12 max-w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center">
          <Smile className="mr-2 h-7 w-7 text-primary" />
          Emotional Wellness Tracker
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your mood patterns and emotional well-being throughout your pregnancy journey
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        <Card className="border-0 shadow-sm overflow-hidden lg:col-span-3">
          <CardHeader className="bg-primary/5 pb-2 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-primary font-montserrat text-xl flex items-center">
                  <Smile className="mr-2 h-5 w-5" />
                  Daily Mood Journal
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Record how you're feeling today
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarCheck className="mr-1 h-4 w-4" />
                  <span>Week {currentWeek}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <LineChart className="mr-1 h-4 w-4" />
                  <span>Track Patterns</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoodTracker currentWeek={currentWeek} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}