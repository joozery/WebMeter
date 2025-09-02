import React, { useState, useRef, useEffect, useContext } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../context/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Search, Table, Rows, Columns, Printer, ArrowLeft, ArrowRight, BarChart3, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TableColumnContext, columnOptions } from '../components/ui/sidebar-menu';
import { useMeterTree } from '@/context/MeterTreeContext';
import { TimeInput24 } from '@/components/ui/time-input-24';
import { DateNavigation } from '@/components/ui/date-navigation';
import { PrintModal } from '@/components/ui/print-modal';
import { useDateNavigation } from '@/hooks/use-date-navigation';
import { api } from '@/services/api';

interface ChargeDataRow {
  meterName: string;
  class: string;
  demandW: number;
  demandVar: number;
  demandVA: number;
  offPeakKWh: number;
  onPeakKWh: number;
  totalKWh: number;
  whCharge: number;
  ft: number;
  demandCharge: number;
  surcharge: number;
  total: number;
  vat: number;
  grandTotal: number;
}

// Class options for the dropdown
const classOptions = [
  { value: "1.1", labelTH: "1.1 บ้านอยู่อาศัย (อัตราปกติ)", labelEN: "1.1 Residential (Normal)" },
  { value: "1.2", labelTH: "1.2 บ้านอยู่อาศัย (อัตรา TOU)", labelEN: "1.2 Residential (TOU)" },
  { value: "2.1", labelTH: "2.1 กิจการขนาดเล็ก (อัตราปกติ)", labelEN: "2.1 Small Business (Normal)" },
  { value: "2.2", labelTH: "2.2 กิจการขนาดเล็ก (อัตรา TOU)", labelEN: "2.2 Small Business (TOU)" },
  { value: "3.1", labelTH: "3.1 กิจการขนาดกลาง", labelEN: "3.1 Medium Business" },
  { value: "3.2", labelTH: "3.2 กิจการขนาดกลาง (อัตรา TOU)", labelEN: "3.2 Medium Business (TOU)" },
  { value: "4.1", labelTH: "4.1 กิจการขนาดใหญ่ (อัตรา TOD)", labelEN: "4.1 Large Business (TOD)" },
  { value: "4.2", labelTH: "4.2 กิจการขนาดใหญ่ (อัตรา TOU)", labelEN: "4.2 Large Business (TOU)" },
  { value: "5.1", labelTH: "5.1 กิจการเฉพาะอย่าง (อัตราปกติ)", labelEN: "5.1 Special Business (Normal)" },
  { value: "5.2", labelTH: "5.2 กิจการเฉพาะอย่าง (อัตรา TOU)", labelEN: "5.2 Special Business (TOU)" },
  { value: "6.1", labelTH: "6.1 องค์การที่ไม่แสวงหากำไร", labelEN: "6.1 Non-Profit Organization" },
  { value: "6.2", labelTH: "6.2 องค์การที่ไม่แสวงหากำไร (อัตรา TOU)", labelEN: "6.2 Non-Profit Organization (TOU)" },
  { value: "7.1", labelTH: "7.1 สูบน้ำเพื่อการเกษตร", labelEN: "7.1 Agricultural Pumping" },
  { value: "7.2", labelTH: "7.2 สูบน้ำเพื่อการเกษตร (อัตรา TOU)", labelEN: "7.2 Agricultural Pumping (TOU)" },
  { value: "8", labelTH: "8 ไฟฟ้าชั่วคราว", labelEN: "8 Temporary Power" }
];

// Empty array for real data
const sampleData: ChargeDataRow[] = [];

// สร้าง mapping สำหรับ charge data columns
const columnDataMap: Record<string, (row: ChargeDataRow) => string> = {
  'Off Peak DmW ': row => (row.demandW * 0.8).toFixed(0),
  'Off Peak Wh': row => row.offPeakKWh.toLocaleString(),
  'On Peak DmW ': row => (row.demandW * 0.2).toFixed(0),
  'On Peak Wh': row => row.onPeakKWh.toLocaleString(),
  'Total kWh': row => row.totalKWh.toLocaleString(),
  'Wh Charge': row => row.whCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  'Demand Charge': row => row.demandCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  'Power Factor': row => (row.demandVA / row.demandW).toFixed(2),
  'FT': row => row.ft.toFixed(2),
  'Total': row => row.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  'VAT': row => row.vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  'Grand Total': row => row.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

export default function ChargeData() {
    const { language } = useLanguage();
    const [error, setError] = useState<string | null>(null);
  
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  const [tableOrientation, setTableOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ChargeDataRow | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
    const [isLoading, setIsLoading] = useState(false);
  
  // State for managing charge data
  const [chargeData, setChargeData] = useState<ChargeDataRow[]>([]);
  
  // Function to update meter class
  const updateMeterClass = (meterName: string, newClass: string) => {
    setChargeData(prevData => 
      prevData.map(row => 
        row.meterName === meterName 
          ? { ...row, class: newClass }
          : row
      )
    );
  };
  
  // Function to get class label from class value
  const getClassLabel = (classValue: string) => {
    const option = classOptions.find(opt => opt.value === classValue);
    return option ? (language === 'TH' ? option.labelTH : option.labelEN) : classValue;
  };
  
  // Function to get short class display (for table column)
  const getShortClassDisplay = (classValue: string) => {
    const option = classOptions.find(opt => opt.value === classValue);
    if (!option) return classValue;
    
    if (language === 'TH') {
      // For Thai, show short format like "1.1 (ทั่วไป)", "3.1", etc.
      const shortLabelsTH: Record<string, string> = {
        "1.1": "1.1 (ทั่วไป)",
        "1.2": "1.2 (TOU)",
        "2.1": "2.1 (ทั่วไป)",
        "2.2": "2.2 (TOU)",
        "3.1": "3.1",
        "3.2": "3.2 (TOU)",
        "4.1": "4.1 (TOD)",
        "4.2": "4.2 (TOU)",
        "5.1": "5.1 (ทั่วไป)",
        "5.2": "5.2 (TOU)",
        "6.1": "6.1",
        "6.2": "6.2 (TOU)",
        "7.1": "7.1",
        "7.2": "7.2 (TOU)",
        "8": "8"
      };
      return shortLabelsTH[classValue] || classValue;
    } else {
      // For English, show short format like "1.1 (Normal)", "3.1", etc.
      const shortLabels: Record<string, string> = {
        "1.1": "1.1 (Normal)",
        "1.2": "1.2 (TOU)",
        "2.1": "2.1 (Normal)",
        "2.2": "2.2 (TOU)",
        "3.1": "3.1",
        "3.2": "3.2 (TOU)",
        "4.1": "4.1 (TOD)",
        "4.2": "4.2 (TOU)",
        "5.1": "5.1 (Normal)",
        "5.2": "5.2 (TOU)",
        "6.1": "6.1",
        "6.2": "6.2 (TOU)",
        "7.1": "7.1",
        "7.2": "7.2 (TOU)",
        "8": "8"
      };
      return shortLabels[classValue] || classValue;
    }
  };
  
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [exportType, setExportType] = useState<'pdf' | 'csv' | 'image'>('pdf');
  const { selectedNodeId, rootNodes } = useMeterTree();

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
    
  // Modal state for export type selection
  const [showExportModal, setShowExportModal] = useState(false);

  // Date navigation hook
  const { dateRange, navigateDate, setDateRangeManually } = useDateNavigation();
  
  // Print modal states
  const [emailGroups, setEmailGroups] = useState<{ id: number; name: string }[]>([]);
  const [lineGroups, setLineGroups] = useState<{ id: number; name: string }[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [lineList, setLineList] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Export handler
  async function handleExport(type: 'pdf' | 'csv' | 'image') {
    // Get current date in DDMMYYYY format
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileDate = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const baseName = `Charge-${fileDate}`;
    
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // Date navigation handler
  const handleDateNavigation = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!dateFrom || !dateTo) return;
    
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
        type: 'charge',
        dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : '',
        dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : '',
        timeFrom,
        timeTo,
        tableOrientation,
        meterCount: filteredData.length,
        totalGrandTotal: filteredData.reduce((sum, row) => sum + row.grandTotal, 0)
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


  const toggleViewMode = () => {
    if (!isLoaded || filteredData.length === 0) {
      alert('กรุณาโหลดข้อมูลก่อนแสดงกราф');
      return;
    }
    setViewMode(viewMode === 'table' ? 'graph' : 'table');
  };


  // ฟังก์ชันค้นหา node ที่เลือกใน tree
  function findNodeById(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Filter data based on selected meter
  let filteredData = chargeData;
  if (selectedNodeId && selectedNodeId.startsWith('meter-')) {
    const selectedNode = findNodeById(rootNodes, selectedNodeId);
    if (selectedNode && selectedNode.name) {
      // Filter by meter name
      filteredData = chargeData.filter(row => row.meterName === selectedNode.name);
    }
  }

  // ฟังก์ชันคำนวณตามสูตรที่กำหนด
  const calculateValues = (row: ChargeDataRow) => {
    const onPeakDmW = row.demandW * 0.2;
    const offPeakDmW = row.demandW * 0.8;
    const onPeakWh = row.onPeakKWh;
    const offPeakWh = row.offPeakKWh;
    
    // 1. Total kWh (THB) = (DmW + Wh) * rate
    const onPeakTotal = (onPeakDmW + onPeakWh) * 4.1839;
    const offPeakTotal = (offPeakDmW + offPeakWh) * 2.6037;
    const totalKWh = onPeakTotal + offPeakTotal;
    
    // 2. Demand Charge (THB) = DmW * 132.93
    const demandCharge = row.demandW * 132.93;
    
    // 3. Power Factor = (Power Factor - 728) * 56.07 (ถ้าเกิน 728)
    const powerFactor = row.demandVA / row.demandW;
    const powerFactorCharge = powerFactor > 728 ? (powerFactor - 728) * 56.07 : 0;
    
    // 4. Total (THB) = Total kWh + Demand Charge + Power Factor
    const total = totalKWh + demandCharge + powerFactorCharge;
    
    // 5. FT = (DmW + Wh) * -0.147
    const ft = (row.demandW + row.totalKWh) * -0.147;
    
    // 6. VAT = (Total - FT) * 7%
    const vat = (total - ft) * 0.07;
    
    // 7. Grand Total = VAT + (Total - FT)
    const grandTotal = vat + (total - ft);
    
    return {
      onPeakDmW,
      offPeakDmW,
      onPeakWh,
      offPeakWh,
      onPeakTotal,
      offPeakTotal,
      totalKWh,
      demandCharge,
      powerFactor,
      powerFactorCharge,
      total,
      ft,
      vat,
      grandTotal
    };
  };

  // ตั้งค่า default date/time: from = วันนี้ เวลา 00:00, to = วันนี้ เวลา ณ ปัจจุบัน
  useEffect(() => {
    if (!dateFrom) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      setDateFrom(todayStart);
      setTimeFrom('00:00');
    }
    if (!dateTo) {
      const now = new Date();
      setDateTo(now);
      // Format current time as HH:mm
      const pad = (n) => n.toString().padStart(2, '0');
      const hh = pad(now.getHours());
      const mm = pad(now.getMinutes());
      setTimeTo(`${hh}:${mm}`);
    }
  }, []);

  // Reset isLoaded เมื่อมีการเปลี่ยน filter
  useEffect(() => {
    setIsLoaded(false);
  }, [dateFrom, dateTo, timeFrom, timeTo]);

  // Reload data when selected meter changes
  useEffect(() => {
    console.log('🔍 selectedNodeId changed:', selectedNodeId);
    console.log('📅 dateFrom:', dateFrom);
    console.log('📅 dateTo:', dateTo);
    console.log('🌳 rootNodes:', rootNodes);
    
    if (selectedNodeId && selectedNodeId.startsWith('meter-') && dateFrom && dateTo) {
      console.log('✅ Loading data for meter:', selectedNodeId);
      loadTableData();
    } else {
      console.log('❌ Cannot load data - missing requirements');
      console.log('  - selectedNodeId:', selectedNodeId);
      console.log('  - starts with meter-:', selectedNodeId?.startsWith('meter-'));
      console.log('  - dateFrom:', dateFrom);
      console.log('  - dateTo:', dateTo);
    }
  }, [selectedNodeId, dateFrom, dateTo, rootNodes]);


  const loadTableData = async () => {
    console.log('🚀 loadTableData called');
    console.log('📅 dateFrom:', dateFrom);
    console.log('📅 dateTo:', dateTo);
    console.log('🔢 selectedNodeId:', selectedNodeId);
    
    if (!dateFrom || !dateTo) {
      setError('กรุณาเลือกช่วงวันที่');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get slave IDs from selected meter
      let slaveIds: number[] = [];
      if (selectedNodeId && selectedNodeId.startsWith('meter-')) {
        const meterId = selectedNodeId.replace('meter-', '');
        console.log('🔍 Looking for meter with ID:', meterId);
        
        // Find the meter in the tree to get its slave_id
        const findMeterInTree = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.id === selectedNodeId) {
              return node;
            }
            if (node.children) {
              const found = findMeterInTree(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const selectedMeter = findMeterInTree(rootNodes);
        console.log('🔍 Found meter:', selectedMeter);
        
        if (selectedMeter && selectedMeter.slave_id) {
          slaveIds = [selectedMeter.slave_id];
          console.log('🔢 Using slave_id:', selectedMeter.slave_id);
        } else {
          console.log('❌ No slave_id found for meter');
        }
      }

      console.log('🌐 Making API call with params:', {
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        slaveIds
      });

      // Test API connection first
      try {
        const testResponse = await fetch('http://localhost:3001/api/table-data/charge-test');
        const testData = await testResponse.json();
        console.log('🧪 API Test Response:', testData);
      } catch (testError) {
        console.log('❌ API Test Failed:', testError);
      }

      const response = await apiClient.getChargeData({
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        slaveIds: slaveIds.length > 0 ? slaveIds : undefined
      });

      console.log('📡 API Response:', response);

      if (response.success && response.data) {
        console.log('✅ Data loaded successfully:', response.data.data);
        setChargeData(response.data.data);
        setIsLoaded(true);
      } else {
        console.log('❌ API Error:', response.error);
        setError(response.error || 'ไม่สามารถโหลดข้อมูลได้');
        setIsLoaded(false);
      }
    } catch (error) {
      console.error('Error loading charge data:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setIsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };
  // กำหนดคอลัมน์ที่ต้องการแสดงสำหรับข้อมูล Charge
  const selectedColumns = [
    'On Peak DmW ',
    'On Peak Wh',
    'Off Peak DmW ',
    'Off Peak Wh',
    'Total kWh',
    'Wh Charge',
    'Demand Charge',
    'Power Factor',
    'FT',
    'Total',
    'VAT',
    'Grand Total',
  ];


  return (
    <PageLayout>
      <div className="pt-2 pb-6 animate-fade-in ml-0 sm:ml-2 md:ml-4 lg:ml-8">
        {/* Header */}
        <div className="flex justify-center -mt-2">
          {/* Filters */}
          <Card className="bg-transparent shadow-none border-none w-full max-w-full rounded-t-xl rounded-b-none">
                      <CardContent className="p-2 bg-transparent shadow-none">
                        <div className="flex flex-wrap items-center gap-2 bg-white rounded-t-xl rounded-b-none px-2 py-1 justify-center text-xs">
                          {/* Table Orientation Toggle */}
                          <div className="flex items-center gap-0.5 mr-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={(tableOrientation === 'horizontal' ? 'bg-primary text-white ' : 'bg-secondary text-black ') + 'h-7 px-2 text-xs rounded-none'}
                              onClick={() => setTableOrientation(tableOrientation === 'horizontal' ? 'vertical' : 'horizontal')}
                              aria-label="Toggle Table Orientation"
                            >
                              {tableOrientation === 'horizontal' ? (
                                <>
                                  {language === 'TH' ? 'แนวนอน' : 'Hor'}
                                </>
                              ) : (
                                <>
                                  {language === 'TH' ? 'แนวตั้ง' : 'Ver'}
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* From - To group in one flex row */}
                          <div className="flex items-center gap-2">
                            {/* From */}
                            <span className="text-xs font-bold text-black">{language === 'TH' ? 'จาก' : 'From'}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                      "h-7 px-1 text-xs rounded bg-white border-none shadow-none ring-0 focus:ring-0 hover:bg-white hover:text-black",
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
                                  onSelect={setDateFrom}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <TimeInput24
                              value={timeFrom}
                              onChange={setTimeFrom}
                              className="h-7 w-10 text-xs rounded-none border-gray-200 px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            {/* To */}
                            <span className="text-xs font-bold text-black ml-0">{language === 'TH' ? 'ถึง' : 'To'}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                      "h-7 px-1 text-xs rounded bg-white border-none shadow-none ring-0 focus:ring-0 hover:bg-white hover:text-black",
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
                                  onSelect={setDateTo}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <TimeInput24
                              value={timeTo}
                              onChange={setTimeTo}
                              className="h-7 w-10 text-xs rounded-none border-gray-200 px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          
                          {/* Load Button */}
                          <Button
                            className={
                              cn(
                                "h-7 px-2 text-xs rounded-none shadow flex items-center",
                                isLoaded
                                  ? "bg-gray-300 text-gray-400 cursor-default"
                                  : "bg-primary hover:bg-primary/90 focus:bg-primary active:bg-primary text-white"
                              )
                            }
                            disabled={isLoaded || isLoading || !selectedNodeId || !selectedNodeId.startsWith('meter-')}
                            onClick={loadTableData}
                          >
                            <Search className="w-4 h-4 mr-0" />
                            {isLoading ? (language === 'TH' ? 'กำลังโหลด...' : 'Loading...') : (language === 'TH' ? 'โหลด' : 'Load')}
                          </Button>
                          
                          {/* Date Navigation */}
                          <DateNavigation
                            onNavigate={handleDateNavigation}
                            className="ml-1"
                            disabled={isLoading || !dateFrom || !dateTo || !selectedNodeId || !selectedNodeId.startsWith('meter-')}
                          />
                          
                          {/* Print Button */}
                          <Button
                            className="h-7 px-2 text-xs rounded-none bg-muted hover:bg-gray-200 shadow flex items-center ml-1"
                            variant="outline"
                            onClick={() => setShowExportModal(true)}
                            disabled={!isLoaded || filteredData.length === 0 || isLoading || !selectedNodeId || !selectedNodeId.startsWith('meter-')}
                          >
                            <Printer className="w-4 h-4 mr-0" />
                          </Button>

                          <Button 
                            className="h-7 px-2 text-xs rounded-none bg-secondary hover:bg-secondary/80 shadow flex items-center ml-1" 
                            variant="outline"
                            onClick={toggleViewMode}
                            disabled={!isLoaded || filteredData.length === 0 || !selectedNodeId || !selectedNodeId.startsWith('meter-')}
                          >
                            <BarChart3 className="w-4 h-4 mr-0" />
                            {viewMode === 'table' ? (language === 'TH' ? 'แสดงกราฟ' : 'Show Graph') : (language === 'TH' ? 'แสดงตาราง' : 'Show Table')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
        </div>

        {/* Data Table - ปรับให้ชิดกับส่วน filter */}
        <Card className="shadow-card rounded-t-none rounded-b-xl -mt-2">
          <CardContent className="p-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-t-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="w-full overflow-x-auto">
              {tableOrientation === 'horizontal' ? (
                <div className="max-h-[84vh]">
                  <table className="w-full min-w-[600px] text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-primary text-primary-foreground text-xs">
                      <tr className="border-b border-primary-foreground/20">
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" rowSpan={2}>Meter Name</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" rowSpan={2}>Catagory</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" colSpan={2}>On Peak</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" colSpan={2}>Off Peak</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" rowSpan={2}>Total kWh</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" colSpan={2}>Wh Charge (฿)</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" colSpan={2}>Demand Charge (฿)</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20 w-16" rowSpan={2}>PF (฿)</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20 w-16" rowSpan={2}>FT</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" rowSpan={2}>Total (฿)</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20" rowSpan={2}>VAT (7%)</th>
                        <th className="text-center align-middle p-2 font-semibold" rowSpan={2}>Sum Total (฿)</th>
                      </tr>
                      <tr className="border-b border-primary-foreground/20">
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">DmW </th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">Wh</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">DmW </th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">Wh</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">On Peak</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">Off Peak</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">On Peak</th>
                        <th className="text-center align-middle p-2 font-semibold border-r border-primary-foreground/20">Off Peak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedNodeId || !selectedNodeId.startsWith('meter-') ? (
                        <tr>
                          <td colSpan={15} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'กรุณาเลือกมิเตอร์ในแถบด้านข้าง' : 'Please select a meter in the sidebar'}
                              </p>
                              <p className="text-sm mt-2">
                                {language === 'TH' ? 'เลือกมิเตอร์เพื่อดูข้อมูลค่าไฟ' : 'Select a meter to view charge data'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : isLoading ? (
                        <tr>
                          <td colSpan={15} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'ไม่พบข้อมูล' : 'No data found'}
                              </p>
                              <p className="text-sm mt-2">
                                {language === 'TH' ? 'กรุณาโหลดข้อมูลหรือเลือกช่วงวันที่อื่น' : 'Please load data or select a different date range'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {filteredData.map((row, index) => (
                            <tr 
                              key={index} 
                              className={`border-t border-gray-200 hover:bg-sky-100/80 transition-colors ${
                                index % 2 === 0 ? 'bg-sky-50' : 'bg-white'
                              }`}
                            >
                              <td 
                                className="text-right align-middle p-1 text-foreground font-medium border-r border-gray-200 cursor-pointer"
                                onClick={() => {
                                  setSelectedRow(row);
                                  setShowCalculation(true);
                                }}
                              >
                                {row.meterName}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-center gap-1 w-full hover:bg-sky-100/80 rounded-none px-1 py-0.5 transition-colors">
                                      <span>{getShortClassDisplay(row.class)}</span>
                                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="rounded-none border border-gray-200 shadow-lg bg-white max-h-60 overflow-y-auto">
                                    {classOptions.map((option) => (
                                      <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => updateMeterClass(row.meterName, option.value)}
                                        className="rounded-none hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700 cursor-pointer px-3 py-2 text-sm border-b border-gray-100 last:border-b-0"
                                      >
                                        {language === 'TH' ? option.labelTH : option.labelEN}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['On Peak DmW '](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['On Peak Wh'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['Off Peak DmW '](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['Off Peak Wh'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['Total kWh'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {/* On Peak Wh Charge */}
                                {((row.onPeakKWh * 4.1839).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {/* Off Peak Wh Charge */}
                                {((row.offPeakKWh * 2.6037).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {/* On Peak Demand Charge (no decimals) */}
                                {Math.round(row.demandW * 0.2 * 132.93).toLocaleString('en-US')}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {/* Off Peak Demand Charge (no decimals) */}
                                {Math.round(row.demandW * 0.8 * 132.93).toLocaleString('en-US')}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200 w-16">
                                {columnDataMap['Power Factor'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200 w-16">
                                {columnDataMap['FT'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['Total'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                                {columnDataMap['VAT'](row)}
                              </td>
                              <td className="text-center align-middle p-1 text-foreground">
                                {columnDataMap['Grand Total'](row)}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Total Row - Only show when there's data */}
                          <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold">
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              TOTAL
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              -
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['On Peak DmW '](row)), 0).toFixed(0)}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['On Peak Wh'](row).replace(/,/g, '')), 0).toLocaleString()}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['Off Peak DmW '](row)), 0).toFixed(0)}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['Off Peak Wh'](row).replace(/,/g, '')), 0).toLocaleString()}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['Total kWh'](row).replace(/,/g, '')), 0).toLocaleString()}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {/* Total On Peak Wh Charge */}
                              {filteredData.reduce((sum, row) => sum + (row.onPeakKWh * 4.1839), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {/* Total Off Peak Wh Charge */}
                              {filteredData.reduce((sum, row) => sum + (row.offPeakKWh * 2.6037), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {/* Total On Peak Demand Charge (no decimals) */}
                              {filteredData.reduce((sum, row) => sum + Math.round(row.demandW * 0.2 * 132.93), 0).toLocaleString('en-US')}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {/* Total Off Peak Demand Charge (no decimals) */}
                              {filteredData.reduce((sum, row) => sum + Math.round(row.demandW * 0.8 * 132.93), 0).toLocaleString('en-US')}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['Power Factor'](row)), 0).toFixed(2)}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + parseFloat(columnDataMap['FT'](row)), 0).toFixed(2)}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + row.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground border-r border-gray-200">
                              {filteredData.reduce((sum, row) => sum + row.vat, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-center align-middle p-1 text-foreground">
                              {filteredData.reduce((sum, row) => sum + row.grandTotal, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-h-[80vh] overflow-y-auto">
                  <table className="min-w-max w-fit text-xs">
                    <thead className="sticky top-0 z-10 bg-gradient-primary text-primary-foreground text-xs">
                      <tr>
                        <th className="text-left p-2 font-semibold">Field</th>
                        {filteredData.length > 0 ? (
                          filteredData.map((_, index) => (
                            <th key={index} className="text-center p-2 font-semibold">{index + 1}</th>
                          ))
                        ) : (
                          <th className="text-center p-2 font-semibold">-</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedNodeId || !selectedNodeId.startsWith('meter-') ? (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'กรุณาเลือกมิเตอร์ในแถบด้านข้าง' : 'Please select a meter in the sidebar'}
                              </p>
                              <p className="text-sm mt-2">
                                {language === 'TH' ? 'เลือกมิเตอร์เพื่อดูข้อมูลค่าไฟ' : 'Select a meter to view charge data'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : isLoading ? (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-gray-500">
                            <div className="text-center">
                              <p className="text-lg font-medium">
                                {language === 'TH' ? 'ไม่พบข้อมูล' : 'No data found'}
                              </p>
                              <p className="text-sm mt-2">
                                {language === 'TH' ? 'กรุณาโหลดข้อมูลหรือเลือกช่วงวันที่อื่น' : 'Please load data or select a different date range'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* Meter Name row always on top */}
                          <tr className="border-t hover:bg-sky-100/80 transition-colors bg-sky-50">
                            <td className="p-1 text-foreground font-medium">Meter Name</td>
                            {filteredData.map((row, index) => (
                              <td key={index} className="text-center p-1 text-foreground">{row.meterName}</td>
                            ))}
                          </tr>
                      {/* Class row */}
                      <tr className="border-t hover:bg-sky-100/80 transition-colors bg-white">
                        <td className="p-1 text-foreground font-medium">Class</td>
                        {filteredData.map((row, index) => (
                          <td key={index} className="text-center p-1 text-foreground cursor-pointer hover:bg-sky-100/80">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center gap-1 w-full hover:bg-sky-100/80 rounded px-1 py-0.5 transition-colors">
                                  <span>{getShortClassDisplay(row.class)}</span>
                                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="rounded-none border border-gray-200 shadow-lg bg-white max-h-60 overflow-y-auto">
                                {classOptions.map((option) => (
                                  <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => updateMeterClass(row.meterName, option.value)}
                                    className="rounded-none hover:bg-sky-50 hover:text-sky-700 focus:bg-sky-50 focus:text-sky-700 cursor-pointer px-3 py-2 text-sm border-b border-gray-100 last:border-b-0"
                                  >
                                    {language === 'TH' ? option.labelTH : option.labelEN}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        ))}
                      </tr>
                      {/* Render only selected columns as rows */}
                      {selectedColumns.map((col, idx) => {
                        // Map column name to data
                        let label = col;
                        let getValue = columnDataMap[col] || (() => '-');
                        return (
                          <tr key={col} className={`border-t hover:bg-sky-100/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-sky-50'}`}> 
                            <td className="p-1 text-foreground font-medium">{label}</td>
                        {filteredData.map((row, index) => (
                              <td key={index} className="text-center p-1 text-foreground">{getValue(row)}</td>
                        ))}
                      </tr>
                        );
                      })}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Modal */}
      {showCalculation && selectedRow && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto border border-gray-300">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Calculation for {selectedRow.meterName}
              </h2>
              <button
                onClick={() => setShowCalculation(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const calc = calculateValues(selectedRow);
              return (
                <div className="grid grid-cols-2 gap-6">
                                     {/* Left Section - Detailed Calculation */}
                   <div className="space-y-4">
                     <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-blue-800">TOU</h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-3 gap-2">
                           <div className="font-semibold">Units (kWh)</div>
                           <div className="font-semibold">Rate (Baht/kWh)</div>
                           <div className="font-semibold">Cost (Baht)</div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                           <div>On Peak: {calc.onPeakWh.toLocaleString()}</div>
                           <div>4.1839</div>
                           <div>{calc.onPeakTotal.toFixed(2)}</div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                           <div>Off Peak: {calc.offPeakWh.toLocaleString()}</div>
                           <div>2.6037</div>
                           <div>{calc.offPeakTotal.toFixed(2)}</div>
                         </div>
                         <div className="border-t border-gray-300 pt-2 font-bold">
                           Total: {calc.totalKWh.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                         </div>
                       </div>
                     </div>

                                         <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-green-800">FT Charge </h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-2 gap-2">
                           <div>FT (Baht/kWh):</div>
                           <div>-0.147</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Units (kWh):</div>
                           <div>{selectedRow.totalKWh.toLocaleString()}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Total (฿):</div>
                           <div>{calc.ft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                         </div>
                       </div>
                     </div>

                                         <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-purple-800">Demand Charge</h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-2 gap-2">
                           <div>On Peak Demand (kW):</div>
                           <div>{selectedRow.demandW}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Demand Rate (Baht/kW):</div>
                           <div>132.93</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Total (฿):</div>
                           <div>{calc.demandCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                         </div>
                       </div>
                     </div>

                                         <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-yellow-800">Power Factor</h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-2 gap-2">
                           <div>Power Factor:</div>
                           <div>{calc.powerFactor > 728 ? (calc.powerFactor - 728).toFixed(2) : '0'}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Power Factor Rate (Baht/KVAR):</div>
                           <div>56.07</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Total (฿):</div>
                           <div>{calc.powerFactorCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                         </div>
                       </div>
                     </div>

                                         <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-orange-800">Total  (kWh+Peak+PF+Ft)</h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-2 gap-2">
                           <div>TOU Cost:</div>
                           <div>{calc.totalKWh.toFixed(2)}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Demand Charge (Baht):</div>
                           <div>{calc.demandCharge.toFixed(2)}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>Power Factor (Baht):</div>
                           <div>{calc.powerFactorCharge.toFixed(2)}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>FT (Baht):</div>
                           <div>{calc.ft.toFixed(2)}</div>
                         </div>
                         <div className="border-t border-gray-300 pt-2 font-bold">
                           Total: {calc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                         </div>
                       </div>
                     </div>

                                         <div className="border border-gray-300 p-4">
                       <h3 className="font-bold text-lg mb-3 text-red-800">VAT</h3>
                       <div className="space-y-2 text-sm">
                         <div className="grid grid-cols-2 gap-2">
                           <div>Total :</div>
                           <div>{calc.total.toFixed(2)}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>VAT 7% :</div>
                           <div>{calc.vat.toFixed(2)}</div>
                         </div>
                         <div className="border-t border-gray-300 pt-2 font-bold">
                           Grand Total: {calc.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                         </div>
                       </div>
                     </div>
                   </div>

                                     {/* Right Section - Bill Summary */}
                   <div className="border border-gray-300 p-4">
                     <h3 className="font-bold text-xl mb-4 text-center">Summary</h3>
                     <div className="space-y-3 text-sm">
                       <div className="grid grid-cols-2 gap-2">
                         <div className="font-semibold">Device Name:</div>
                         <div>{selectedRow.meterName}</div>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <div className="font-semibold">Total kWh:</div>
                         <div>{selectedRow.totalKWh.toLocaleString()}</div>
                       </div>
                       <div className="border-t border-gray-300 pt-3 mt-4">
                         <h4 className="font-bold mb-2">Details</h4>
                         <div className="space-y-2">
                           <div className="grid grid-cols-2 gap-2">
                             <div>TOU Cost:</div>
                             <div>{calc.totalKWh.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>Demand Charge:</div>
                             <div>{calc.demandCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>Power Factor :</div>
                             <div>{calc.powerFactorCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>FT :</div>
                             <div>{calc.ft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                           </div>
                           <div className="border-t border-gray-300 pt-2 font-bold">
                             <div className="grid grid-cols-2 gap-2">
                               <div>Total Exclude VAT :</div>
                               <div>{calc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>VAT 7% :</div>
                             <div>{calc.vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                           </div>
                           <div className="border-t border-gray-300 pt-2 font-bold">
                             <div className="grid grid-cols-2 gap-2">
                               <div>Grand Total:</div>
                               <div>{calc.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Print Modal */}
      <PrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        onSendReport={handleSendReport}
        isLoaded={isLoaded}
        hasData={filteredData.length > 0}
        isLoading={isLoading}
        isSending={isSending}
        emailGroups={emailGroups}
        lineGroups={lineGroups}
        emailList={emailList}
        lineList={lineList}
      />
    </PageLayout>
  );
}
