import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CalendarIcon, Download, FileText, Search, Table, Rows, Columns, Printer, ArrowLeft, ArrowRight, BarChart3, Image as ImageIcon, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TableColumnContext, columnOptions } from '../components/ui/sidebar-menu';
import { useMeterTree } from '@/context/MeterTreeContext';
import { TimeInput24 } from '@/components/ui/time-input-24';
import { api, TableDataRow as ApiTableDataRow, handleApiError } from '@/services/api';
import { TrendChart } from '@/components/charts/TrendChart';
import { DateNavigation, PrintModal } from '@/components/ui';
import { useDateNavigation } from '@/hooks/use-date-navigation';

const scrollbarStyles = `
  :root {
    --sidebar-width: 350px;
  }
  
  [data-sidebar-collapsed="true"] {
    --sidebar-width: 0px;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }

  /* Enhanced horizontal scrollbar for better visibility */
  .horizontal-scroll-only::-webkit-scrollbar:vertical {
    display: none;
  }
  
  .horizontal-scroll-only {
    scrollbar-width: thin;
    scrollbar-color: #94a3b8 #f1f5f9;
  }

  /* Table container with improved scroll behavior */
  .table-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-scroll-wrapper {
    overflow-x: auto;
    overflow-y: auto;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: #94a3b8 #f1f5f9;
    height: 100%;
  }

  /* Enhanced scrollbar styling */
  .table-scroll-wrapper::-webkit-scrollbar {
    height: 16px;
    width: 16px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 8px;
    border: 2px solid #f1f5f9;
    box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }

  .table-scroll-wrapper::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }

  /* Sticky column enhancement */
  .sticky-time-column {
    position: sticky !important;
    left: 0 !important;
    z-index: 20 !important;
    box-shadow: 2px 0 8px rgba(0,0,0,0.12);
  }

  .sticky-time-header {
    position: sticky !important;
    left: 0 !important;
    z-index: 30 !important;
    box-shadow: 2px 0 8px rgba(0,0,0,0.18);
  }
`;

// ใช้ interface จาก API แทน
interface TableDataRow extends ApiTableDataRow {}

export default function TableData() {
  const { language, setLanguage } = useLanguage();

  // Set default language to English on mount
  useEffect(() => {
    setLanguage('EN');
  }, [setLanguage]);

  // Modal export state (must be inside the component)
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  
  // Date navigation hook - initialize with current date range
  const { dateRange, navigateDate, formatDateRange } = useDateNavigation({
    from: dateFrom || new Date(),
    to: dateTo || new Date()
  });
  
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
  const [tableOrientation, setTableOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<ApiTableDataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(350); // State สำหรับขนาด sidebar
  const [itemsPerPage, setItemsPerPage] = useState(39); // Default 39 items
  const [currentPage, setCurrentPage] = useState(1);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { selectedNodeId, rootNodes, onlineNodes, selectedSlaveIds } = useMeterTree();
  
  // ใช้ context สำหรับ selected columns
  const context = useContext(TableColumnContext);
  const contextSelectedColumns = context?.selectedColumns || [];
  
  // ใช้ selectedSlaveIds จาก Context แทน local state

  // โหลดข้อมูลอัตโนมัติเมื่อเลือกมิเตอร์ใหม่
  useEffect(() => {
    if (selectedSlaveIds.length > 0 && dateFrom && dateTo) {
      // โหลดข้อมูลใหม่เมื่อเลือกมิเตอร์ใหม่
      console.log('🔄 Auto-loading data for selected meter(s):', selectedSlaveIds);
      loadTableData();
    }
  }, [selectedSlaveIds]); // ไม่ต้องใส่ dateFrom, dateTo ใน dependency เพราะจะทำให้โหลดซ้ำ

  // ตรวจสอบสถานะ sidebar และปรับ CSS variable
  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[data-sidebar]');
      const isCollapsed = sidebar?.getAttribute('data-state') === 'collapsed';
      document.documentElement.style.setProperty(
        '--sidebar-width', 
        isCollapsed ? '0px' : '350px'
      );
    };

    // เรียกครั้งแรก
    updateSidebarWidth();

    // ตรวจสอบการเปลี่ยนแปลง
    const observer = new MutationObserver(updateSidebarWidth);
    const sidebar = document.querySelector('[data-sidebar]');
    
    if (sidebar) {
      observer.observe(sidebar, { 
        attributes: true, 
        attributeFilter: ['data-state'] 
      });
    }

    return () => observer.disconnect();
  }, []);

  // ฟังก์ชันกรองข้อมูลให้ห่างกัน 15 นาที
  const filterDataBy15MinuteInterval = (data: ApiTableDataRow[]): ApiTableDataRow[] => {
    if (data.length === 0) return data;
    
    const filteredData: ApiTableDataRow[] = [];
    let lastTimestamp: Date | null = null;
    
    // เรียงข้อมูลตามเวลา
    const sortedData = [...data].sort((a, b) => {
      const timeA = new Date(a.reading_timestamp || a.time);
      const timeB = new Date(b.reading_timestamp || b.time);
      return timeA.getTime() - timeB.getTime();
    });
    
    sortedData.forEach((row) => {
      const currentTimestamp = new Date(row.reading_timestamp || row.time);
      
      // เพิ่มข้อมูลแรกเสมอ
      if (lastTimestamp === null) {
        filteredData.push(row);
        lastTimestamp = currentTimestamp;
        return;
      }
      
      // คำนวณความแตกต่างของเวลาในนาที
      const timeDiffMinutes = (currentTimestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60);
      
      // เพิ่มข้อมูลถ้าห่างกัน 15 นาทีหรือมากกว่า
      if (timeDiffMinutes >= 15) {
        filteredData.push(row);
        lastTimestamp = currentTimestamp;
      }
    });
    
    // console.log('⏰ กรองข้อมูล 15 นาที:', {
    //   'ข้อมูลเดิม': data.length,
    //   'ข้อมูลหลังกรอง': filteredData.length,
    //   'ตัวอย่างเวลาที่เลือก': filteredData.slice(0, 5).map(row => 
    //     formatDateTime(row.reading_timestamp || row.time)
    //   )
    // });
    
    return filteredData;
  };

  // ใช้ selectedSlaveIds จาก Context แทนการคำนวณเอง

  // ฟังก์ชันโหลดข้อมูลจาก API
  const loadTableData = async () => {
    if (!dateFrom || !dateTo) {
      setError('กรุณาเลือกช่วงวันที่');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = {
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        columns: contextSelectedColumns.length > 0 ? contextSelectedColumns : undefined,
        slaveIds: selectedSlaveIds.length > 0 ? selectedSlaveIds : undefined, // ใช้ slaveIds จาก Context
      };

      // Log ข้อมูลการดึงข้อมูล
      console.log('🚀 === DATA LOADING LOG ===');
      console.log('📅 Date Range:', `${params.dateFrom} ${params.timeFrom} to ${params.dateTo} ${params.timeTo}`);
      console.log('🔢 Slave IDs to fetch:', params.slaveIds);
      console.log('📊 Selected Columns:', params.columns);
      console.log('🔍 Full API Parameters:', params);
      console.log('================================');

      // console.log('🔍 ส่งพารามิเตอร์ไปยัง API:', params);
      
      const response = await api.tableData.getTableData(params);
      
      // console.log('📊 ผลลัพธ์จาก API:', response);
      console.log('📊 response.success:', response.success);

      // // Log ผลลัพธ์ที่ได้รับ
      // console.log('📈 === API RESPONSE LOG ===');
      // console.log('✅ Success:', response.success);
      // console.log('🔢 Total rows received:', Array.isArray(response.data) ? response.data.length : 0);
      // if (Array.isArray(response.data) && response.data.length > 0) {
      //   console.log('📋 First row received:');
      //   console.log('   - Time:', response.data[0].time);
      //   console.log('   - Slave ID:', response.data[0].slave_id);
      //   console.log('   - Frequency:', response.data[0].Frequency);
      //   console.log('   - Voltage Avg:', response.data[0]['Volt LN Avg']);
      //   console.log('   - Current Avg:', response.data[0]['Current Avg']);
      //   console.log('   - Power Total:', response.data[0]['Watt Total']);
      // }
      // console.log('📊 Response data type:', typeof response.data);
      // console.log('================================');
      // console.log('📊 response.data:', response.data);
      // console.log('📊 typeof response.data:', typeof response.data);
      // console.log('📊 Array.isArray(response.data):', Array.isArray(response.data));
      
      if (response.success && response.data) {
        let rawData: ApiTableDataRow[] = [];
        
        // ตรวจสอบว่า response.data เป็น array หรือ object
        if (Array.isArray(response.data)) {
          // ถ้าเป็น array แสดงว่าข้อมูลอยู่ในนี้เลย
          // console.log('✅ ข้อมูลที่ได้รับ (array):', response.data);
          // console.log('📈 จำนวนข้อมูล:', response.data.length);
          // console.log('🔍 ตัวอย่างข้อมูลแถวแรก:', response.data[0]);
          // console.log('🗂️ Keys ของข้อมูลแถวแรก:', response.data[0] ? Object.keys(response.data[0]) : 'ไม่มีข้อมูล');
          
          rawData = response.data;
        } else {
          // ถ้าเป็น object ให้ดูว่าข้อมูลอยู่ที่ไหน
          // console.log('✅ ข้อมูลที่ได้รับ (object):', response.data);
          // console.log('📋 Keys ใน response.data:', Object.keys(response.data));
          
          // ลองหาใน properties ต่างๆ - ตรวจสอบว่าเป็น array หรือไม่
          rawData = Array.isArray(response.data.data) ? response.data.data : 
                   Array.isArray(response.data) ? response.data : [];
          // console.log('📈 จำนวนข้อมูล:', rawData.length);
          // console.log('🔍 ตัวอย่างข้อมูลแถวแรก:', rawData[0]);
          // console.log('🗂️ Keys ของข้อมูลแถวแรก:', rawData[0] ? Object.keys(rawData[0]) : 'ไม่มีข้อมูล');
        }
        
        // กรองข้อมูลให้ห่างกัน 15 นาที
        const filteredData = filterDataBy15MinuteInterval(rawData);
        setTableData(filteredData);
        
        setIsLoaded(true);
      } else {
        console.error('❌ เกิดข้อผิดพลาด:', response.message);
        setError(response.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  
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


  // State for export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [emailGroups, setEmailGroups] = useState<{ id: number; name: string }[]>([]);
  const [lineGroups, setLineGroups] = useState<{ id: number; name: string }[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [lineList, setLineList] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Fetch email and line groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const [usersResponse] = await Promise.all([
          api.users.getAll({
            page: 1,
            limit: 1000,
            sortBy: 'id',
            sortOrder: 'ASC'
          })
        ]);
        
        // Set empty groups for now since we don't have these APIs yet
        setEmailGroups([]);
        setLineGroups([]);
        
        if (usersResponse.success) {
          const userData = usersResponse.data || [];
          
          // Transform users to EmailRow format (like in Email.tsx)
          const transformedUsers = userData.map((user: any) => ({
            id: user.id,
            displayName: user.username || '',
            email: user.email || '',
            groups: user.group_name ? [user.group_name] : [],
            line_groups: user.line_group_name ? [user.line_group_name] : [],
            name: `${user.name || ''} ${user.surname || ''}`.trim(),
            phone: user.phone || '',
            lineId: user.line_id || '',
            enabled: user.status === 'active'
          }));
          
          // Filter email users (users with email) - like in Email.tsx
          const emailUsers = transformedUsers.filter((user: any) => user.enabled && user.email && user.email.trim() !== '');
          setEmailList(emailUsers);
          
          // Filter line users (users with lineId) - like in Email.tsx
          const lineUsers = transformedUsers.filter((user: any) => user.enabled && user.lineId && user.lineId.trim() !== '');
          setLineList(lineUsers);
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    
    fetchGroups();
  }, []);

  // Modal export handler
  async function handleExport(type: 'pdf' | 'csv' | 'image') {
    if (!isLoaded || paginatedData.length === 0) {
      alert('กรุณาโหลดข้อมูลก่อนทำการ export');
      return;
    }
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const defaultFileName = `TableData_${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${thaiYear}`;
    if (type === 'pdf') {
      try {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text('WebMeter - Table Data Report', 14, 20);
        doc.setFontSize(10);
        const fromDate = dateFrom ? format(dateFrom, 'dd/MM/yyyy') : '-';
        const toDate = dateTo ? format(dateTo, 'dd/MM/yyyy') : '-';
        const selectedNode = selectedNodeId ? findNodeById(rootNodes, selectedNodeId) : null;
        const meterName = selectedNode?.name || 'All Meters';
        doc.text(`Date Range: ${fromDate} ${timeFrom} - ${toDate} ${timeTo}`, 14, 30);
        doc.text(`Time Range: ${timeFrom} - ${timeTo}`, 14, 35);
        doc.text(`Meter: ${meterName}`, 14, 40);
        doc.text(`Generated: ${format(now, 'dd/MM/yyyy HH:mm:ss')}`, 14, 45);
        const headers = ['Time', ...displayColumns];
        const tableData = filteredData.map(row => [
          formatDateTime(row.reading_timestamp || row.time),
          ...displayColumns.map(col => getColumnValue(row, col))
        ]);
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 55,
          styles: { fontSize: 6, cellPadding: 1 },
          headStyles: { fillColor: [6, 182, 212], textColor: 255, fontSize: 7, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 25 } },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { top: 55, right: 14, bottom: 20, left: 14 },
          tableWidth: 'auto',
          theme: 'grid',
        });
        doc.save(`${defaultFileName}.pdf`);
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการสร้าง PDF');
      }
    } else if (type === 'csv') {
      let csv = headersToCSV(['Time', ...displayColumns]) + '\n';
      filteredData.forEach(row => {
        const rowData = [formatDateTime(row.reading_timestamp || row.time), ...displayColumns.map(col => getColumnValue(row, col))];
        csv += rowData.map(val => '"' + (val ?? '').toString().replace(/"/g, '""') + '"').join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${defaultFileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'image') {
      try {
        const table = document.querySelector('table');
        if (!table) return;
        const canvas = await html2canvas(table as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${defaultFileName}.png`;
        a.click();
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
      }
    }
  }

  // Send report handler
  async function handleSendReport(type: 'email' | 'line') {
    if (!isLoaded || paginatedData.length === 0) {
      alert('กรุณาโหลดข้อมูลก่อนส่งรายงาน');
      return;
    }

    setIsSending(true);
    try {
      // Create report data
      const reportData = {
        type,
        report: {
          dateRange: `${format(dateFrom!, 'dd/MM/yyyy')} ${timeFrom} - ${format(dateTo!, 'dd/MM/yyyy')} ${timeTo}`,
          meterName: selectedNodeId ? findNodeById(rootNodes, selectedNodeId)?.name || 'All Meters' : 'All Meters',
          data: filteredData.slice(0, 10), // Send first 10 rows as preview
          totalRows: filteredData.length,
          columns: displayColumns
        }
      };

      // Here you would send the report data to your backend
      console.log('Sending report:', reportData);
      
      // For now, just show success message
      alert(`ส่งรายงานเรียบร้อยแล้ว`);
      
    } catch (error) {
      console.error('Error sending report:', error);
      alert('เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsSending(false);
    }
  }

  function headersToCSV(headers: string[]) {
    return headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',');
  }

  // ฟังก์ชันสำหรับสลับระหว่าง table และ graph
  const toggleViewMode = () => {
    if (!isLoaded || filteredData.length === 0) {
      alert('กรุณาโหลดข้อมูลก่อนแสดงกราф');
      return;
    }
    setViewMode(viewMode === 'table' ? 'graph' : 'table');
  };

  // ฟังก์ชันสำหรับแปลงข้อมูลให้เป็นรูปแบบที่ chart ใช้ได้
  const prepareChartData = () => {
    return filteredData.map(row => {
      const chartPoint: any = {
        name: formatDateTime(row.reading_timestamp || row.time)
      };
      
      // เพิ่มข้อมูลคอลัมน์ที่เลือกไว้
      displayColumns.forEach((col, index) => {
        const value = row[col];
        if (typeof value === 'number') {
          chartPoint[`value${index === 0 ? '' : index + 1}`] = value;
          chartPoint[`${col}`] = value;
        }
      });
      
      return chartPoint;
    });
  };

  // ตัวอย่าง: สมมติ sampleData มี field meterName (หรือใช้ row.time แทนถ้าไม่มี)
  let filteredData = tableData;
  if (selectedNodeId) {
    const selectedNode = findNodeById(rootNodes, selectedNodeId);
    if (selectedNode && selectedNode.name) {
      // ถ้า tableData มี meterName ให้ filter ตามชื่อ node
      // filteredData = tableData.filter(row => row.meterName === selectedNode.name);
      // ถ้าไม่มี meterName ให้ filter อื่นหรือแสดงทั้งหมด (ตัวอย่างนี้แสดงทั้งหมด)
      filteredData = tableData;
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // ตั้งค่า default date/time เป็นวันปัจจุบัน 00:00 ถึง วันปัจจุบัน เวลาปัจจุบัน
  useEffect(() => {
    if (!dateFrom) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      setDateFrom(startOfDay);
      setTimeFrom('00:00');
    }
    if (!dateTo) {
      const now = new Date();
      setDateTo(now);
      setTimeTo(now.toTimeString().slice(0,5));
    }
  }, []);

  // Reset isLoaded เมื่อมีการเปลี่ยน filter
  useEffect(() => {
    setIsLoaded(false);
  }, [dateFrom, dateTo, timeFrom, timeTo]);

  // Debug: แสดงข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    // console.log('🔍 Debug - filteredData.length:', filteredData.length);
    // console.log('🔍 Debug - tableData.length:', tableData.length);
    // console.log('🔍 Debug - isLoaded:', isLoaded);
    if (tableData.length > 0) {
      // console.log('🔍 Debug - ตัวอย่างข้อมูลแถวแรก:', tableData[0]);
      // console.log('🔍 Debug - Keys ในข้อมูล:', Object.keys(tableData[0]));
    }
  }, [tableData, filteredData, isLoaded]);

  // ฟังก์ชันสำหรับจัดรูปแบบวันเวลา (แบบสั้น)
  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    
    // จัดรูปแบบวันที่: HH:MM DD Month YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes} ${day} ${month} ${year}`;
  };

  // ฟังก์ชันสำหรับแสดงค่าในแต่ละคอลัมน์
  const getColumnValue = (row: ApiTableDataRow, columnName: string): string => {
    // ใช้ชื่อคอลัมน์ UI โดยตรง เพราะ backend ได้ mapping ให้แล้ว
    const value = row[columnName];
    
    // Debug: แสดงข้อมูลที่ค้นหา (แสดงเฉพาะ 1 คอลัมน์แรกเพื่อไม่ให้ log เยอะเกินไป)
    if (tableData.length > 0 && columnName === 'Frequency') {
      // console.log(`🔍 หาค่าคอลัมน์ UI "${columnName}" ในแถว:`, row);
      // console.log(`📋 Keys ที่มีในข้อมูล:`, Object.keys(row));
      // console.log(`💾 ค่าที่ได้จาก "${columnName}":`, value);
    }
    
    if (value === undefined || value === null) return '-';
    
    // แปลงค่าตามประเภทคอลัมน์
    if (typeof value === 'number') {
      // คอลัมน์ที่ไม่มีทศนิยม (Demand และ kWh/kVarh)
      if (columnName === 'Demand W' || columnName === 'Demand Var' || columnName === 'Demand VA' ||
          columnName === 'Import kWh' || columnName === 'Export kWh' || 
          columnName === 'Import kVarh' || columnName === 'Export kVarh') {
        return Math.round(value).toString();
      }
      
      // คอลัมน์อื่นๆ แสดงทศนิยม 2 หลัก
      return value.toFixed(2);
    }
    
    return value.toString();
  };

  // กำหนดคอลัมน์ที่ต้องการแสดง - แสดงทั้งหมดเสมอ
  const allColumns = [
    'Frequency',
    'Volt AN', 
    'Volt BN',
    'Volt CN',
    'Volt LN Avg',
    'Volt AB',
    'Volt BC', 
    'Volt CA',
    'Volt LL Avg',
    'Current A',
    'Current B',
    'Current C', 
    'Current Avg',
    'Current IN',
    'Watt A',
    'Watt B',
    'Watt C',
    'Watt Total',
    'Var A',
    'Var B',
    'Var C',
    'Var total',
    'VA A',
    'VA B',
    'VA C',
    'VA Total',
    'PF A',
    'PF B',
    'PF C',
    'PF Total',
    'Demand W',
    'Demand Var',
    'Demand VA',
    'Import kWh',
    'Export kWh',
    'Import kVarh',
    'Export kVarh',
    'THDV',
    'THDI'
  ];

  // ใช้คอลัมน์ที่เลือกจาก sidebar เสมอ (ไม่ fallback ไป allColumns)
  const displayColumns = contextSelectedColumns;

  // Debug: แสดงข้อมูลเพื่อตรวจสอบ
  // console.log('🎯 TABLE DATA DEBUG:');
  // console.log('   - contextSelectedColumns:', contextSelectedColumns);
  // console.log('   - contextSelectedColumns.length:', contextSelectedColumns.length);
  // console.log('   - displayColumns:', displayColumns);
  // console.log('   - displayColumns.length:', displayColumns.length);
  // console.log('   - Logic: contextSelectedColumns.length > 0 ?', contextSelectedColumns.length > 0);
  // console.log('   - Using:', contextSelectedColumns.length > 0 ? 'contextSelectedColumns' : 'allColumns');

  // // Handle scroll shadows
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const container = tableContainerRef.current;
    
    if (container && element) {
      const scrollLeft = element.scrollLeft;
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;
      
      // Add 'scrolled' class when scrolled right
      if (scrollLeft > 10) {
        container.classList.add('scrolled');
      } else {
        container.classList.remove('scrolled');
      }
      
      // Add 'scrolled-end' class when near the end
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        container.classList.add('scrolled-end');
      } else {
        container.classList.remove('scrolled-end');
      }
    }
  };

  return (
    <PageLayout>
      <style>{scrollbarStyles}</style>
      <div className="pt-0 pb-6 animate-fade-in ml-0 sm:ml-2 md:ml-4 lg:ml-8">
        {/* Header */}
        <div className="flex justify-center -mt-2 px-4 sm:px-6 lg:px-8">
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
                
                {/* Load, Export, Show Graph Buttons */}
                <Button
                  className={
                    cn(
                      "h-7 px-2 text-xs rounded-none shadow flex items-center",
                      isLoading
                        ? "bg-gray-300 text-gray-400 cursor-default"
                        : "bg-primary hover:bg-primary/90 focus:bg-primary active:bg-primary text-white"
                    )
                  }
                  disabled={isLoading}
                  onClick={loadTableData}
                >
                  <Search className="w-4 h-4 mr-0" />
                  {isLoading ? (language === 'TH' ? 'กำลังโหลด...' : 'Loading...') : (language === 'TH' ? 'โหลด' : 'Load')}
                </Button>
                
                {/* Date Navigation */}
                <DateNavigation 
                  onNavigate={(direction) => {
                    navigateDate(direction);
                    // Update the local date states to match the navigation
                    const { from, to } = dateRange;
                    setDateFrom(from);
                    setDateTo(to);
                    setTimeFrom(from.toTimeString().slice(0, 5));
                    setTimeTo(to.toTimeString().slice(0, 5));
                  }}
                  className="ml-1"
                />
                <Button
                  className="h-7 px-2 text-xs rounded-none bg-muted hover:bg-primary shadow flex items-center ml-1"
                  variant="outline"
                  onClick={() => setShowExportModal(true)}
                  disabled={!isLoaded || paginatedData.length === 0 || isLoading}
                >
                  <Printer className="w-4 h-4 mr-0" />
                </Button>
                <PrintModal
                  isOpen={showExportModal}
                  onClose={() => setShowExportModal(false)}
                  onExport={handleExport}
                  onSendReport={handleSendReport}
                  isLoaded={isLoaded}
                  hasData={paginatedData.length > 0}
                  isLoading={isLoading}
                  isSending={isSending}
                  emailGroups={emailGroups}
                  lineGroups={lineGroups}
                  emailList={emailList}
                  lineList={lineList}
                />
                <Button 
                  className="h-7 px-2 text-xs rounded-none bg-secondary hover:bg-secondary/80 shadow flex items-center ml-1" 
                  variant="outline"
                  onClick={toggleViewMode}
                  disabled={!isLoaded || filteredData.length === 0 || isLoading}
                >
                  <BarChart3 className="w-4 h-4 mr-0" />
                  {viewMode === 'table' ? (language === 'TH' ? 'แสดงกราฟ' : 'Show Graph') : (language === 'TH' ? 'แสดงตาราง' : 'Show Table')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table - ปรับให้ชิดกับส่วน filter */}
        <div className="px-4 sm:px-6 lg:px-8">
          <Card className="shadow-card rounded-none -mt-2 w-full">
            <CardContent className="p-0">
              {error && (
                <div className="p-4 text-red-600 bg-red-50 border-b">
                  {error}
                </div>
              )}
             
              <div
                className="w-full max-w-[calc(100vw-var(--sidebar-width))]"
                style={{
                  height: paginatedData.length > 0 && paginatedData.length < 4
                    ? `${Math.max(200, paginatedData.length * 40 + 100)}px`
                    : 'calc(100vh - 130px)'
                }}
              >
                {viewMode === 'graph' ? (
                  // Graph View
                  <div className="h-full p-4">
                    {displayColumns.length === 0 ? (
                      <div className="text-center p-4 text-gray-500">
                        กรุณาเลือกคอลัมน์ที่ต้องการแสดงในกราฟจาก sidebar
                      </div>
                    ) : (
                      <div className="h-full">
                        <div className="bg-white rounded-lg shadow p-4 h-full">
                          <div style={{ height: 'calc(100% - 20px)' }}>
                            <TrendChart
                              data={prepareChartData()}
                              height={500}
                              color={`hsl(210, 70%, 50%)`}
                              showSecondLine={displayColumns.length > 1}
                              color2={`hsl(120, 70%, 50%)`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Table View (existing code)
                  <>
                {tableOrientation === 'horizontal' ? (
                  <div className="h-full border border-gray-200 relative">
                    {/* Table container with fixed height and horizontal scroll */}
                    <div 
                      ref={tableScrollRef}
                      className="h-full overflow-x-auto overflow-y-auto custom-scrollbar table-scroll-wrapper" 
                      onScroll={handleScroll}
                      style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}
                    >
                      <table className="text-[10px] border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
                      <thead className="sticky top-0 z-40 text-[10px]">
                        <tr>
                          <th 
                            className="text-left p-1 font-semibold bg-cyan-500 text-white border-r border-white"
                            style={{ 
                              position: 'sticky', 
                              left: 0, 
                              top: 0,
                              zIndex: 100,
                              backgroundColor: '#06b6d4',
                              boxShadow: '2px 0 8px rgba(0,0,0,0.18)',
                              width: '130px',
                              minWidth: '130px',
                              maxWidth: '130px'
                            }}
                          >
                            {language === 'TH' ? 'เวลา' : 'Time'}
                          </th>
                          {displayColumns.map((col) => (
                            <th 
                              key={col} 
                              className="text-center p-1 font-semibold whitespace-nowrap bg-cyan-500 text-white border-r border-white last:border-r-0"
                              style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={displayColumns.length + 1} className="text-center p-4 text-gray-500 bg-white text-xs">
                              {isLoaded ? 'No data found in the selected time range' : 'Please Load to get data'}
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, index) => (
                            <tr
                              key={startIndex + index}
                              className={`border-t border-gray-200 hover:bg-cyan-50 transition-colors ${
                                (startIndex + index) % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td
                                className="p-1 text-foreground font-medium border-r border-gray-200 text-[10px]"
                                style={{
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 30,
                                  backgroundColor: (startIndex + index) % 2 === 0 ? 'white' : '#f9fafb',
                                  boxShadow: '2px 0 8px rgba(0,0,0,0.12)',
                                  width: '130px',
                                  minWidth: '130px',
                                  maxWidth: '130px'
                                }}
                              >
                                {formatDateTime(row.reading_timestamp || row.time)}
                              </td>
                              {displayColumns.map((col) => (
                                <td
                                  key={col}
                                  className="text-center p-1 text-foreground whitespace-nowrap border-r border-gray-200 last:border-r-0 text-[10px]"
                                  style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}
                                >
                                  {getColumnValue(row, col)}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-gray-200 custom-scrollbar overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}>
                    <table className="text-[10px] border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
                      <thead className="sticky top-0 z-10 text-[10px]">
                        <tr>
                          <th className="text-left p-1 font-semibold bg-cyan-500 text-white border-r border-white" style={{ width: '130px', minWidth: '130px' }}>Field</th>
                          {filteredData.map((_, index) => (
                            <th key={index} className="text-center p-1 font-semibold bg-cyan-500 text-white border-r border-white last:border-r-0" style={{ width: '70px', minWidth: '70px' }}>{index + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={100} className="text-center p-4 text-gray-500 bg-white text-xs">
                              {isLoaded ? 'ไม่พบข้อมูลในช่วงเวลาที่เลือก' : 'กรุณากดปุ่ม Load เพื่อโหลดข้อมูล'}
                            </td>
                          </tr>
                        ) : (
                          <>
                            {/* Time row always on top */}
                            <tr className="border-t border-gray-200 hover:bg-cyan-50 transition-colors bg-white">
                              <td className="p-1 text-foreground font-medium bg-gray-100 border-r border-gray-200 text-[10px]" style={{ width: '130px', minWidth: '130px' }}>{language === 'TH' ? 'เวลา' : 'Time'}</td>
                              {paginatedData.map((row, index) => (
                                <td key={startIndex + index} className="text-center p-1 text-foreground border-r border-gray-200 last:border-r-0 text-[10px]" style={{ width: '70px', minWidth: '70px' }}>
                                  {formatDateTime(row.reading_timestamp || row.time)}
                                </td>
                              ))}
                            </tr>
                            {/* Render only selected columns as rows */}
                            {displayColumns.map((col, idx) => (
                              <tr key={col} className={`border-t border-gray-200 hover:bg-cyan-50 transition-colors ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="p-1 text-foreground font-medium bg-gray-100 border-r border-gray-200 text-[10px]" style={{ width: '130px', minWidth: '130px' }}>{col}</td>
                                {paginatedData.map((row, index) => (
                                  <td key={startIndex + index} className="text-center p-1 text-foreground border-r border-gray-200 last:border-r-0 text-[10px]" style={{ width: '70px', minWidth: '70px' }}>
                                    {getColumnValue(row, col)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                </>
              )}
              </div>
              {/* Pagination Controls */}
              {isLoaded && filteredData.length > 0 && viewMode === 'table' && (
                <div className="flex justify-center items-center py-2 gap-2">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-7 px-2 text-xs rounded-none"
                  >
                    First
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2 text-xs rounded-none"
                  >
                    Prev
                  </Button>
                  <span className="text-xs px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2 text-xs rounded-none"
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2 text-xs rounded-none"
                  >
                    Last
                  </Button>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when changing items per page
                      }}
                      className="border rounded text-xs h-7"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="39">39</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}