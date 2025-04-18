import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, PenLine, BookOpen } from 'lucide-react';
import { queryClient, apiRequestLegacy } from '../lib/queryClient';
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
      const res = await apiRequestLegacy('POST', '/api/journal', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Journal Entry Added',
        description: 'Your journal entry has been saved successfully.',
      });
      setIsCreateMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save journal entry: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // State for viewing all entries page
  const [viewingAllEntries, setViewingAllEntries] = useState(false);
  
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Function to show entry details
  const handleViewEntry = (entry: JournalEntryType) => {
    setSelectedEntry(entry);
    setIsCreateMode(false);
    setViewingAllEntries(false);
  };

  // Function to start creating a new entry
  const handleCreateEntry = () => {
    setSelectedEntry(null);
    setIsCreateMode(true);
    setViewingAllEntries(false);
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
    setViewingAllEntries(false);
  };
  
  // Function to view all entries
  const handleViewAllEntries = () => {
    setSelectedEntry(null);
    setIsCreateMode(false);
    setViewingAllEntries(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pregnancy Journal</h1>
        <p className="text-muted-foreground mt-2">
          Capture your thoughts, feelings, and milestones throughout your pregnancy journey.
        </p>
      </div>

      {viewingAllEntries ? (
        // All Entries View
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Journal Entries</h2>
            <div>
              <Button variant="ghost" size="sm" className="mr-2" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreateEntry}>
                <Plus className="h-4 w-4 mr-1" />
                New Entry
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Loading entries...</div>
          ) : isError ? (
            <div className="py-8 text-center text-destructive">Failed to load journal entries</div>
          ) : sortedEntries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No journal entries yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEntries.map((entry) => (
                <Card key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewEntry(entry)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(entry.date), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {entry.content.substring(0, 100)}
                      {entry.content.length > 100 ? '...' : ''}
                    </p>
                    {entry.mood && (
                      <div className="mt-2 text-sm font-medium">
                        Mood: {entry.mood}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Main Journal Page View
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* My Journal Entries section */}
          <div className="md:col-span-1">
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleViewAllEntries}
            >
              <CardHeader>
                <CardTitle>My Journal Entries</CardTitle>
                <CardDescription>
                  Click to view all your journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-4 text-center">Loading entries...</div>
                ) : isError ? (
                  <div className="py-4 text-center text-destructive">Failed to load journal entries</div>
                ) : sortedEntries.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No journal entries yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      You have {sortedEntries.length} journal {sortedEntries.length === 1 ? 'entry' : 'entries'}
                    </div>
                    {sortedEntries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="text-sm py-1 border-b border-border last:border-0">
                        <div className="font-medium truncate">{entry.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    ))}
                    {sortedEntries.length > 3 && (
                      <div className="text-sm text-muted-foreground mt-2 text-center">
                        + {sortedEntries.length - 3} more entries
                      </div>
                    )}
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
                        Back
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
                    Document your pregnancy journey. Create a new entry or view your existing entries.
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
      )}
    </div>
  );
}