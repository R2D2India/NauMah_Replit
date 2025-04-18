import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface JournalEntryProps {
  entry: {
    id: number;
    title: string;
    content: string;
    mood: string | null;
    date: string;
    createdAt: string;
  };
  onBack: (e?: React.MouseEvent) => void;
}

export function JournalEntry({ entry, onBack }: JournalEntryProps) {
  const date = new Date(entry.date);
  const createdAt = new Date(entry.createdAt);
  
  // Convert content with line breaks to paragraphs
  const contentParagraphs = entry.content.split('\n').filter(line => line.trim() !== '');
  
  // Get mood badge color
  const getMoodBadgeColor = (mood: string | null) => {
    if (!mood) return 'secondary';
    
    const moodLower = mood.toLowerCase();
    if (['happy', 'excited', 'joyful', 'grateful'].some(m => moodLower.includes(m))) {
      return 'default';
    } else if (['sad', 'upset', 'depressed', 'disappointed'].some(m => moodLower.includes(m))) {
      return 'destructive';
    } else if (['anxious', 'worried', 'nervous', 'stressed'].some(m => moodLower.includes(m))) {
      return 'outline';
    } else if (['calm', 'peaceful', 'relaxed', 'content'].some(m => moodLower.includes(m))) {
      return 'secondary';
    }
    
    return 'secondary';
  };
  
  return (
    <>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={(e) => onBack(e)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {entry.mood && (
            <Badge variant={getMoodBadgeColor(entry.mood)}>{entry.mood}</Badge>
          )}
        </div>
        <CardTitle className="text-2xl mt-4">{entry.title}</CardTitle>
        <CardDescription className="flex items-center gap-3 mt-2">
          <span className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {format(date, 'MMMM d, yyyy')}
          </span>
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {format(createdAt, 'h:mm a')}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-blue max-w-none dark:prose-invert">
          {contentParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </>
  );
}