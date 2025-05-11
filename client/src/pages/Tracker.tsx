
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { LineChart } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoodTrackerSection } from "@/components/pregnancy/MoodTrackerSection";
import { useTranslation } from "react-i18next";

export default function Tracker() {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date>(new Date());
  const [newWeight, setNewWeight] = useState("");
  const [newSymptom, setNewSymptom] = useState({ type: "", severity: 1, notes: "" });
  const [newAppointment, setNewAppointment] = useState({ title: "", type: "", location: "", notes: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: weightData = [] } = useQuery({
    queryKey: ["weight-tracking"],
    queryFn: async () => {
      const response = await fetch("/api/weight-tracking");
      if (!response.ok) throw new Error("Failed to fetch weight data");
      return response.json();
    }
  });

  const { data: symptoms = [] } = useQuery({
    queryKey: ["symptoms"],
    queryFn: async () => {
      const response = await fetch("/api/symptoms");
      if (!response.ok) throw new Error("Failed to fetch symptoms");
      return response.json();
    }
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    }
  });

  // Mutations
  const addWeightMutation = useMutation({
    mutationFn: async (weight: number) => {
      const response = await fetch("/api/weight-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, date })
      });
      if (!response.ok) throw new Error("Failed to add weight entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-tracking"] });
      toast({ title: "Weight entry added successfully" });
      setNewWeight("");
    }
  });

  const addSymptomMutation = useMutation({
    mutationFn: async (symptomData: typeof newSymptom) => {
      const response = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...symptomData, date })
      });
      if (!response.ok) throw new Error("Failed to log symptom");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      toast({ title: "Symptom logged successfully" });
      setNewSymptom({ type: "", severity: 1, notes: "" });
    }
  });

  const addAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: typeof newAppointment) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...appointmentData, date })
      });
      if (!response.ok) throw new Error("Failed to add appointment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Appointment scheduled successfully" });
      setNewAppointment({ title: "", type: "", location: "", notes: "" });
    }
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">{t('tracker.title', 'Pregnancy Tracker')}</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('tracker.tabs.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="weight">{t('tracker.tabs.weight', 'Weight')}</TabsTrigger>
          <TabsTrigger value="symptoms">{t('tracker.tabs.symptoms', 'Symptoms')}</TabsTrigger>
          <TabsTrigger value="appointments">{t('tracker.tabs.appointments', 'Appointments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tracker.overview.calendar', 'Pregnancy Calendar')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                className="rounded-md border"
              />
              <div className="mt-4">
                <h3 className="font-semibold mb-2">{t('tracker.overview.todaySummary', 'Today\'s Summary')}</h3>
                <ul className="space-y-2">
                  {appointments.filter(apt => 
                    new Date(apt.date).toDateString() === date.toDateString()
                  ).map(apt => (
                    <li key={apt.id} className="text-sm">
                      {apt.title} - {apt.type}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tracker.weight.title', 'Weight Tracking')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  type="number"
                  placeholder={t('tracker.weight.enterWeight', 'Enter weight')}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <Button onClick={() => newWeight && addWeightMutation.mutate(parseFloat(newWeight))}>
                  {t('tracker.weight.addEntry', 'Add Entry')}
                </Button>
              </div>
              <LineChart data={weightData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tracker.symptoms.title', 'Symptom Log')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {["Nausea", "Fatigue", "Backache", "Headache", "Cramping"].map((symptom) => (
                  <div key={symptom} className="flex items-center justify-between p-2 border rounded">
                    <span>{symptom}</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">{t('tracker.symptoms.logButton', 'Log')}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('tracker.symptoms.logDialogTitle', 'Log {{symptom}}', { symptom })}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium">{t('tracker.symptoms.severity', 'Severity (1-5)')}</label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={newSymptom.severity}
                              onChange={(e) => setNewSymptom({
                                ...newSymptom,
                                type: symptom,
                                severity: parseInt(e.target.value)
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">{t('tracker.symptoms.notes', 'Notes')}</label>
                            <Input
                              value={newSymptom.notes}
                              onChange={(e) => setNewSymptom({
                                ...newSymptom,
                                type: symptom,
                                notes: e.target.value
                              })}
                            />
                          </div>
                          <Button onClick={() => addSymptomMutation.mutate(newSymptom)}>
                            {t('tracker.symptoms.save', 'Save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tracker.appointments.title', 'Appointments')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mb-4">{t('tracker.appointments.scheduleNew', 'Schedule New Appointment')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('tracker.appointments.newAppointment', 'New Appointment')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder={t('tracker.appointments.title', 'Title')}
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment,
                        title: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Type (e.g., Checkup, Ultrasound)"
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment,
                        type: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Location"
                      value={newAppointment.location}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment,
                        location: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Notes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({
                        ...newAppointment,
                        notes: e.target.value
                      })}
                    />
                    <Button onClick={() => addAppointmentMutation.mutate(newAppointment)}>
                      Save Appointment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="space-y-2">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-3 border rounded">
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString()} - {appointment.type}
                    </div>
                    {appointment.location && (
                      <div className="text-sm text-gray-600">{appointment.location}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Mood Tracker Section - integrated with the same width as content above */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-8 -mx-4 px-4 mt-10 border-t">
        <MoodTrackerSection />
      </div>
    </div>
  );
}
