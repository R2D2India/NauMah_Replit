import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Form schema with validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  mood: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JournalEntryFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<FormValues>;
}

export function JournalEntryForm({ onSubmit, isSubmitting, defaultValues }: JournalEntryFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      content: defaultValues?.content || '',
      mood: defaultValues?.mood || undefined,
    },
  });

  // List of mood options
  const moodOptions = [
    'Happy',
    'Excited',
    'Grateful',
    'Proud',
    'Calm',
    'Content',
    'Tired',
    'Anxious',
    'Worried',
    'Overwhelmed',
    'Sad',
    'Frustrated',
    'Mixed feelings',
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Give your entry a title"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How are you feeling today?</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {moodOptions.map((mood) => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Tracking your mood helps identify patterns throughout your pregnancy
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Journal Entry</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write about your day, feelings, or anything you want to remember about your pregnancy journey..."
                  className="min-h-[200px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Journal Entry'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}