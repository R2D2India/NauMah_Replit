import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

interface SupportMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function SupportMessages() {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  
  // Fetch support messages
  const { 
    data: messagesData, 
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["/api/admin/support-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support-messages", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch support messages");
      }
      
      return res.json() as Promise<SupportMessage[]>;
    },
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/admin/support-messages/${messageId}/mark-read`, {
        method: "POST",
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to mark message as read");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message marked as read",
        description: "The message has been marked as read",
      });
      
      // Refetch messages to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark message as read",
        variant: "destructive",
      });
    },
  });
  
  const handleOpenMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    
    // If message is not read, mark it as read
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };
  
  const handleCloseDialog = () => {
    setSelectedMessage(null);
  };
  
  if (loadingMessages) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Messages</CardTitle>
          <CardDescription>Loading messages...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  const unreadCount = messagesData?.filter(message => !message.isRead).length || 0;
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center">
              Support Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              User contact form submissions
            </CardDescription>
          </div>
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {messagesData && messagesData.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messagesData.map((message) => (
                    <TableRow key={message.id} className={!message.isRead ? "bg-secondary/20" : ""}>
                      <TableCell>
                        {message.isRead ? (
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3" /> Read
                          </Badge>
                        ) : (
                          <Badge variant="default">New</Badge>
                        )}
                      </TableCell>
                      <TableCell>{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{message.subject || "N/A"}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenMessage(message)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No support messages found.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Message detail dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMessage?.subject || "Support Message"}
            </DialogTitle>
            <DialogDescription>
              From: {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 my-4 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {selectedMessage?.message}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Received: {selectedMessage?.createdAt && new Date(selectedMessage.createdAt).toLocaleString()}
          </div>
          
          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}