import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MoodTracker from "./MoodTracker";
import { useQuery } from "@tanstack/react-query";

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
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Mood Tracker</h2>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 pb-2">
          <CardTitle className="text-primary font-montserrat text-xl">
            Emotional Wellness Journal
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Track your emotional well-being throughout your pregnancy journey
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <MoodTracker currentWeek={currentWeek} />
        </CardContent>
      </Card>
    </div>
  );
}