import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LineChart, BarChart3, Search, Printer, CalendarIcon, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { addMinutes } from 'date-fns';
import { TimeInput24 } from '@/components/ui/time-input-24';
import { api, type Event, type EventFilters } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DateNavigation } from '@/components/ui/date-navigation';
import { PrintModal } from '@/components/ui/print-modal';
import { useDateNavigation } from '@/hooks/use-date-navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PAGE_SIZE = 20;

export default function Event() {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default: from = วันนี้ 00:00, to = วันนี้ เวลาปัจจุบัน
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [typeFilter, setTypeFilter] = useState<'manual' | 'auto'>('manual');
  const [dateFrom, setDateFrom] = useState<Date>(now);
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [dateTo, setDateTo] = useState<Date>(now);
  const [timeTo, setTimeTo] = useState(currentTime);

  const { toast } = useToast();
  
  // Date navigation hook
  const { dateRange, navigateDate, setDateRangeManually } = useDateNavigation();
  
  // Print modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [emailGroups, setEmailGroups] = useState<{ id: number; name: string }[]>([]);
  const [lineGroups, setLineGroups] = useState<{ id: number; name: string }[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [lineList, setLineList] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch email/line groups and users for print modal
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Fetch email groups
        const emailGroupsResponse = await apiClient.getEmailGroups();
        setEmailGroups(emailGroupsResponse.data || []);

        // Fetch line groups
        const lineGroupsResponse = await apiClient.getLineGroups();
        setLineGroups(lineGroupsResponse.data || []);

        // Fetch all users for email list
        const allUsersResponse = await apiClient.getUsers();
        const emailUsers = allUsersResponse.data?.filter((user: any) => user.enabled && user.email) || [];
        setEmailList(emailUsers);

        // Fetch all users for line list
        const lineUsers = allUsersResponse.data?.filter((user: any) => user.enabled && user.lineId) || [];
        setLineList(lineUsers);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, []);

  // Load events from API
  const loadEvents = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const filters: EventFilters = {
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        page,
        limit: PAGE_SIZE,
        sortBy: sortField,
        sortOrder: sortDirection,
        search: searchTerm || undefined,
      };

      const response = await apiClient.getEvents(filters);
      
      if (response.success && response.data) {
        setEvents(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
        setIsLoaded(true);
        

      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: response.error || "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load events when page, sort, or search changes
  useEffect(() => {
    if (isLoaded) {
      loadEvents();
    }
  }, [page, sortField, sortDirection, searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('ASC');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Backend sorting only; return events as-is
  const getSortedEvents = () => events;

  const handleSearch = () => {
    setPage(1);
    loadEvents();
  };

  // Export handler (PDF, CSV, Image)
  async function handleExport(type: 'pdf' | 'csv' | 'image') {
    // Get current date in DDMMYYYY format
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileDate = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const baseName = `Event-${fileDate}`;
    
    if (type === 'pdf') {
      // Export as PDF
      const table = document.querySelector('table');
      if (!table) return;
      const canvas = await html2canvas(table as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight > pageHeight-40 ? pageHeight-40 : imgHeight);
      pdf.save(`${baseName}.pdf`);
    } else if (type === 'csv') {
      // Export as CSV
      let csv = '';
      const table = document.querySelector('table');
      if (!table) return;
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cols = row.querySelectorAll('th,td');
        const rowData = Array.from(cols).map(col => '"' + col.textContent?.replace(/"/g, '""') + '"').join(',');
        csv += rowData + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'image') {
      // Export as Image
      const table = document.querySelector('table');
      if (!table) return;
      const canvas = await html2canvas(table as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `${baseName}.png`;
      a.click();
    }
  }

  // Date navigation handler
  const handleDateNavigation = (direction: 'left' | 'right' | 'up' | 'down') => {
    const newDateFrom = new Date(dateFrom);
    const newDateTo = new Date(dateTo);
    
    switch (direction) {
      case 'left': // Previous day
        newDateFrom.setDate(newDateFrom.getDate() - 1);
        newDateTo.setDate(newDateTo.getDate() - 1);
        break;
      case 'right': // Next day
        newDateFrom.setDate(newDateFrom.getDate() + 1);
        newDateTo.setDate(newDateTo.getDate() + 1);
        break;
      case 'up': // Next month
        newDateFrom.setMonth(newDateFrom.getMonth() + 1);
        newDateTo.setMonth(newDateTo.getMonth() + 1);
        break;
      case 'down': // Previous month
        newDateFrom.setMonth(newDateFrom.getMonth() - 1);
        newDateTo.setMonth(newDateTo.getMonth() - 1);
        break;
    }
    
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    setIsLoaded(false);
  };

  // Send report handler
  async function handleSendReport(type: 'email' | 'line') {
    setIsSending(true);
    try {
      // Create report data
      const reportData = {
        type: 'event',
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        totalRecords,
        events: events.length
      };

      // Send report logic here
      console.log('Sending report:', reportData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`ส่งรายงานเรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error sending report:', error);
      alert('เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(600vh-6000px)] pt-0 mt-0 animate-fade-in">
        {/* Filters */}
        <div className="w-full max-w-6xl flex justify-center mb-0 mt-0">
          <Card className="bg-transparent shadow-none border-none w-full rounded-t-xl rounded-b-none">
            <CardContent className="p-2 bg-transparent shadow-none">
              <div className="flex flex-wrap items-center gap-1 bg-white rounded-t-xl rounded-b-none px-2 py-1 justify-center text-xs">
                {/* Date From + Time From */}
                <span className="text-xs text-black font-medium ml-2">From</span>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-7 px-1 text-xs rounded-none bg-white  shadow-none ring-0 focus:ring-0 hover:bg-white hover:text-black",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                   
                        {dateFrom ? format(dateFrom, "dd MMMM yyyy") : "--/--/----"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={date => { setDateFrom(date); setIsLoaded(false); }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <TimeInput24
                    value={timeFrom}
                    onChange={(value) => { setTimeFrom(value); setIsLoaded(false); }}
                    className="h-7 w-10 text-xs rounded-none shadow-sm px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                {/* Date To + Time To */}
                <span className="text-xs text-black font-medium ml-0">To</span>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-7 px-1 text-xs rounded-none bg-white shadow-none ring-0 focus:ring-0 hover:bg-white hover:text-black",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                    
                        {dateTo ? format(dateTo, "dd MMMM yyyy") : "--/--/----"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={date => { setDateTo(date); setIsLoaded(false); }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <TimeInput24
                    value={timeTo}
                    onChange={(value) => { setTimeTo(value); setIsLoaded(false); }}
                    className="h-7 w-10 text-xs rounded-none shadow-sm px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
          
                {/* Load Button */}
                <Button
                  disabled={loading}
                  className={cn(
                    "h-7 px-2 text-xs rounded-none shadow flex items-center",
                    loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 focus:bg-primary active:bg-primary text-white"
                  )}
                  onClick={handleSearch}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-0" />
                  )}
                  {loading ? 'Loading...' : 'Load'}
                </Button>
                
                {/* Date Navigation */}
                <DateNavigation
                  onNavigate={handleDateNavigation}
                  className="ml-1"
                  disabled={loading}
                />
                
                {/* Print Button */}
                <Button 
                  className="h-7 px-2 text-xs rounded-none bg-muted hover:bg-gray-200 shadow flex items-center ml-1" 
                  variant="outline"
                  onClick={() => setShowExportModal(true)}
                  disabled={!isLoaded || events.length === 0 || loading}
                >
                  <Printer className="w-4 h-4 mr-0" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full max-w-6xl flex justify-center">
          <Card className="w-full rounded-none border border-gray-200">
            <CardContent className="p-0 text-xs">
              <div className="overflow-x-auto rounded-none">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs border border-gray-200 rounded-none">
                    <thead className="sticky top-0 z-10 bg-primary text-white text-xs">
                      <tr>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            No.
                            {sortField === 'id' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('timestamp')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Time
                            {sortField === 'timestamp' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('username')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Username
                            {sortField === 'username' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('lognet')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Lognet
                            {sortField === 'lognet' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('ip')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            IP
                            {sortField === 'ip' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 px-2 font-semibold border-b border-gray-200 cursor-pointer hover:bg-cyan-500 select-none"
                          onClick={() => handleSort('event')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Event
                            {sortField === 'event' && (
                              sortDirection === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center">
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin mr-2" />
                              Loading events...
                            </div>
                          </td>
                        </tr>
                      ) : getSortedEvents().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {isLoaded ? (
                              <div>
                                <div className="text-sm">
                                  Not Found Data :<br/>

                                </div>
                              </div>
                            ) : 'คลิกปุ่ม Load เพื่อโหลดข้อมูล'}
                          </td>
                        </tr>
                      ) : (
                        getSortedEvents().map((row, idx) => (
                          <tr
                            key={row.id}
                            className={
                              `text-center ${idx % 2 === 0 ? 'bg-cyan-100' : 'bg-cyan-50'}`
                            }
                          >
                            <td className="py-2 px-3 border-b border-gray-100">{row.id}</td>
                            <td className="py-2 px-3 border-b border-gray-100">{row.time}</td>
                            <td className="py-2 px-3 border-b border-gray-100">{row.username}</td>
                            <td className="py-2 px-3 border-b border-gray-100">{row.lognetIp}</td>
                            <td className="py-2 px-3 border-b border-gray-100">{row.ip}</td>
                            <td className="py-2 px-3 border-b border-gray-100 text-center">{row.event}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center gap-2 p-2">
                    <div className="text-xs text-gray-600">
                      Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} events
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded-none border text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        &lt;
                      </button>
                      <span className="text-xs">{page} / {totalPages}</span>
                      <button
                        className="px-2 py-1 rounded-none border text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Print Modal */}
        <PrintModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          onSendReport={handleSendReport}
          isLoaded={isLoaded}
          hasData={events.length > 0}
          isLoading={loading}
          isSending={isSending}
          emailGroups={emailGroups}
          lineGroups={lineGroups}
          emailList={emailList}
          lineList={lineList}
        />
      </div>
    </PageLayout>
  );
} 