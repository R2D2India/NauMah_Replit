
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { LineChart } from "@/components/ui/chart";
import { useState } from "react";

export default function Tracker() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const weightData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [{
      label: "Weight (kg)",
      data: [65, 65.5, 66, 66.2],
      borderColor: "rgb(75, 192, 192)",
    }]
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Pregnancy Tracker</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pregnancy Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={weightData} />
              <Button className="mt-4">Add Weight Entry</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {["Nausea", "Fatigue", "Backache"].map((symptom) => (
                  <div key={symptom} className="flex items-center justify-between p-2 border rounded">
                    <span>{symptom}</span>
                    <Button variant="outline" size="sm">Log</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="mb-4">Schedule New Appointment</Button>
              <div className="space-y-2">
                {["Ultrasound - Week 20", "Regular Checkup - Week 24"].map((appointment) => (
                  <div key={appointment} className="p-3 border rounded">
                    {appointment}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
