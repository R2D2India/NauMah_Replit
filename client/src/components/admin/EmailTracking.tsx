import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { SearchIcon, RefreshCw } from 'lucide-react';

interface EmailTrackingEntry {
  id: number;
  userId: number;
  emailType: string; 
  emailTo: string;
  emailFrom: string;
  subject: string;
  status: string;
  statusDetails?: string;
  sentAt: string;
  updatedAt: string;
  userDetails?: {
    username: string;
    email: string;
  }
}

export function EmailTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all email tracking entries
  const { data: emailTrackingData, isLoading, error, refetch } = useQuery<EmailTrackingEntry[]>({
    queryKey: ['/api/admin/email-tracking'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/email-tracking');
      return await response.json();
    }
  });

  // Handle loading and error states
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Tracking</CardTitle>
          <CardDescription>Loading email tracking data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Tracking</CardTitle>
          <CardDescription>Failed to load email tracking data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on search query
  const filteredData = emailTrackingData?.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.emailTo.toLowerCase().includes(searchLower) ||
      entry.emailFrom.toLowerCase().includes(searchLower) ||
      entry.subject.toLowerCase().includes(searchLower) ||
      entry.emailType.toLowerCase().includes(searchLower) ||
      entry.status.toLowerCase().includes(searchLower) ||
      (entry.statusDetails && entry.statusDetails.toLowerCase().includes(searchLower)) ||
      (entry.userDetails?.username && entry.userDetails.username.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get status badge variant based on email status
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Email Tracking</CardTitle>
            <CardDescription>
              Monitor all email communications sent through the platform
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search emails..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Emails</TabsTrigger>
            <TabsTrigger value="welcome">Welcome Emails</TabsTrigger>
            <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
            <TabsTrigger value="failed">Failed Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <EmailTrackingTable 
              data={paginatedData}
              getStatusBadgeVariant={getStatusBadgeVariant}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="welcome" className="space-y-4">
            <EmailTrackingTable 
              data={paginatedData.filter(entry => entry.emailType === 'welcome')}
              getStatusBadgeVariant={getStatusBadgeVariant}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="password-reset" className="space-y-4">
            <EmailTrackingTable 
              data={paginatedData.filter(entry => entry.emailType === 'password-reset')}
              getStatusBadgeVariant={getStatusBadgeVariant}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="failed" className="space-y-4">
            <EmailTrackingTable 
              data={paginatedData.filter(entry => entry.status === 'failed')}
              getStatusBadgeVariant={getStatusBadgeVariant}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
        
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simplified pagination display logic
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}

// Table component extracted to avoid duplication in tabs
interface EmailTrackingTableProps {
  data: EmailTrackingEntry[];
  getStatusBadgeVariant: (status: string) => string;
  formatDate: (dateString: string) => string;
}

function EmailTrackingTable({ data, getStatusBadgeVariant, formatDate }: EmailTrackingTableProps) {
  if (data.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No email records found.</p>;
  }
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Type</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead className="hidden md:table-cell">Subject</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium capitalize">
                {entry.emailType}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{entry.emailTo}</span>
                  {entry.userDetails && (
                    <span className="text-xs text-muted-foreground">
                      {entry.userDetails.username}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {entry.subject}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(entry.status)}>
                  {entry.status}
                </Badge>
                {entry.statusDetails && entry.status === 'failed' && (
                  <div className="text-xs text-destructive mt-1 max-w-[180px] truncate" title={entry.statusDetails}>
                    {entry.statusDetails}
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDate(entry.sentAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}