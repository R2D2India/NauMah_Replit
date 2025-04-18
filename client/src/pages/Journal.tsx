import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, PenLine, BookOpen } from 'lucide-react';
import { queryClient, apiRequest } from '../lib/queryClient';
import { JournalEntry } from '../components/journal/JournalEntry';
import { JournalEntryForm } from '../components/journal/JournalEntryForm';

interface JournalEntryType {
  id: number;
  userId: number;
  title: string;
  content: string;
  mood: string | null;
  date: string;
  createdAt: string;
}

export default function Journal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryType | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const { toast } = useToast();

  // Fetch journal entries
  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['/api/journal'],
    queryFn: async () => {
      const response = await fetch('/api/journal');
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      const data = await response.json();
      return data as JournalEntryType[];
    },
  });

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      mood?: string;
      date: Date;
    }) => {
      const res = await apiRequest('POST', '/api/journal', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Journal Entry Added',
        description: 'Your journal entry has been saved successfully.',
      });
      setIsCreateMode(false);
      queryClient.invalidateQueries(['/api/journal']);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save journal entry: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Function to show entry details
  const handleViewEntry = (entry: JournalEntryType) => {
    setSelectedEntry(entry);
    setIsCreateMode(false);
  };

  // Function to start creating a new entry
  const handleCreateEntry = () => {
    setSelectedEntry(null);
    setIsCreateMode(true);
  };

  // Function to handle form submission
  const handleSubmit = (data: { title: string; content: string; mood?: string }) => {
    createEntryMutation.mutate({
      ...data,
      date: new Date(), // Always use current date
    });
  };

  // Function to go back to the entry list
  const handleBack = () => {
    setIsCreateMode(false);
    setSelectedEntry(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pregnancy Journal</h1>
        <p className="text-muted-foreground mt-2">
          Capture your thoughts, feelings, and milestones throughout your pregnancy journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entry list section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Journal Entries</CardTitle>
                <Button size="sm" variant="outline" onClick={handleCreateEntry}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-4 text-center">Loading entries...</div>
              ) : isError ? (
                <div className="py-4 text-center text-destructive">Failed to load journal entries</div>
              ) : sortedEntries.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No journal entries yet.
                  <div className="mt-2">
                    <Button variant="secondary" size="sm" onClick={handleCreateEntry}>
                      <PenLine className="h-4 w-4 mr-1" />
                      Add your first entry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedEntries.map((entry) => (
                    <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewEntry(entry)}>
                      <CardContent className="p-4">
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(entry.date), 'MMMM d, yyyy')} · {entry.mood || 'No mood'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Entry view or form section */}
        <div className="md:col-span-2">
          <Card className="h-full">
            {isCreateMode ? (
              <>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>New Journal Entry</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      Back to Entries
                    </Button>
                  </div>
                  <CardDescription>
                    Record your thoughts and feelings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JournalEntryForm onSubmit={handleSubmit} isSubmitting={createEntryMutation.isPending} />
                </CardContent>
              </>
            ) : selectedEntry ? (
              <JournalEntry entry={selectedEntry} onBack={handleBack} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Your Pregnancy Journal</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Document your pregnancy journey. Select an entry from the list or create a new one for today.
                </p>
                <Button onClick={handleCreateEntry}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Journal Entry
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}