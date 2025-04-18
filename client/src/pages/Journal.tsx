import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Plus, PenLine, BookOpen, ArrowLeft, CalendarIcon } from 'lucide-react';
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
  const handleViewEntry = (entry: JournalEntryType, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Keep the scroll position
    const scrollPosition = window.scrollY;
    
    setSelectedEntry(entry);
    setIsCreateMode(false);
    setViewingAllEntries(false);
    
    // Restore scroll position after state update
    setTimeout(() => window.scrollTo(0, scrollPosition), 0);
  };

  // Function to start creating a new entry
  const handleCreateEntry = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Keep the scroll position
    const scrollPosition = window.scrollY;
    
    setSelectedEntry(null);
    setIsCreateMode(true);
    setViewingAllEntries(false);
    
    // Restore scroll position after state update
    setTimeout(() => window.scrollTo(0, scrollPosition), 0);
  };

  // Function to handle form submission
  const handleSubmit = (data: { title: string; content: string; mood?: string }) => {
    // Keep the scroll position
    const scrollPosition = window.scrollY;
    
    createEntryMutation.mutate({
      ...data,
      date: new Date(), // Always use current date
    });
    
    // Restore scroll position after mutation
    setTimeout(() => window.scrollTo(0, scrollPosition), 0);
  };

  // Function to go back to the entry list
  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Keep the scroll position
    const scrollPosition = window.scrollY;
    
    setIsCreateMode(false);
    setSelectedEntry(null);
    setViewingAllEntries(false);
    
    // Restore scroll position after state update
    setTimeout(() => window.scrollTo(0, scrollPosition), 0);
  };
  
  // Function to view all entries
  const handleViewAllEntries = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Keep the scroll position
    const scrollPosition = window.scrollY;
    
    setSelectedEntry(null);
    setIsCreateMode(false);
    setViewingAllEntries(true);
    
    // Reset scroll to top for the all entries view
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Pregnancy Journal</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Capture your thoughts, feelings, and milestones throughout your pregnancy journey.
        </p>
      </div>

      {viewingAllEntries ? (
        // All Entries View
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold tracking-tight">My Journal Entries</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={(e) => handleBack(e)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="gap-1" onClick={(e) => handleCreateEntry(e)}>
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading journal entries...</p>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-destructive">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p>Failed to load journal entries</p>
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <BookOpen className="h-12 w-12 mb-4" />
              <p className="mb-4">No journal entries yet.</p>
              <Button onClick={(e) => handleCreateEntry(e)}>Create Your First Entry</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 flex flex-col h-full overflow-hidden"
                  onClick={(e) => handleViewEntry(entry, e)}
                >
                  <CardHeader className="pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{entry.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1 inline" />
                      {format(new Date(entry.date), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {entry.content.substring(0, 150)}
                      {entry.content.length > 150 ? '...' : ''}
                    </p>
                    {entry.mood && (
                      <div className="mt-auto pt-2 border-t border-border">
                        <span className="text-xs font-medium text-muted-foreground">Mood: </span>
                        <span className="text-sm">{entry.mood}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* My Journal Entries section */}
          <div className="md:col-span-4">
            <Card 
              className="cursor-pointer shadow-sm hover:shadow-md hover:bg-muted/30 transition-all duration-200"
              onClick={(e) => handleViewAllEntries(e)}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Journal Entries
                </CardTitle>
                <CardDescription>
                  Click to view all your journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                    <p className="text-sm text-muted-foreground">Loading entries...</p>
                  </div>
                ) : isError ? (
                  <div className="py-8 text-center text-destructive">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-8 w-8 mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm">Failed to load journal entries</p>
                  </div>
                ) : sortedEntries.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="text-sm mb-2">No journal entries yet.</p>
                    <p className="text-xs">Create your first entry to start your pregnancy journal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-3 bg-muted/50 py-2 px-3 rounded-md flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                      You have {sortedEntries.length} journal {sortedEntries.length === 1 ? 'entry' : 'entries'}
                    </div>
                    <div className="space-y-3">
                      {sortedEntries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="text-sm py-2 px-3 border border-border rounded-md hover:bg-muted/20 transition-colors">
                          <div className="font-medium truncate mb-1">{entry.title}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(new Date(entry.date), 'MMM d, yyyy')}
                            </div>
                            {entry.mood && (
                              <div className="text-xs">
                                {entry.mood}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {sortedEntries.length > 3 && (
                      <div className="text-sm text-center pt-2 mt-3 border-t border-border">
                        <span className="text-primary font-medium text-sm">
                          + {sortedEntries.length - 3} more entries
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Entry view or form section */}
          <div className="md:col-span-8">
            <Card className="h-full shadow-sm">
              {isCreateMode ? (
                <>
                  <CardHeader className="pb-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold">New Journal Entry</CardTitle>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => handleBack(e)}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    </div>
                    <CardDescription>
                      Record your thoughts, feelings, and experiences during your pregnancy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JournalEntryForm onSubmit={handleSubmit} isSubmitting={createEntryMutation.isPending} />
                  </CardContent>
                </>
              ) : selectedEntry ? (
                <JournalEntry entry={selectedEntry} onBack={handleBack} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 px-6">
                  <div className="max-w-md text-center">
                    <BookOpen className="h-12 w-12 text-primary/80 mx-auto mb-6" />
                    <h3 className="text-xl font-medium mb-3">Your Pregnancy Journal</h3>
                    <p className="text-muted-foreground mb-8">
                      Document your pregnancy journey with thoughts, feelings, and milestones. 
                      Create new entries or browse your existing ones.
                    </p>
                    <Button size="lg" onClick={(e) => handleCreateEntry(e)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Journal Entry
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}