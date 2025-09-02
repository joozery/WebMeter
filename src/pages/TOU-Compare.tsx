import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useReactToPrint } from 'react-to-print';
import type { UseReactToPrintOptions } from 'react-to-print';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Search, FileText, Printer, BarChart3, PieChart as PieChartIcon, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TableColumnContext } from '@/components/ui/sidebar-menu';
import { TimeInput24 } from '@/components/ui/time-input-24';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useMeterTree } from '@/context/MeterTreeContext';
import { api, TableDataRow as ApiTableDataRow, handleApiError } from '@/services/api';
import { DateNavigation } from '@/components/ui/date-navigation';
import { PrintModal } from '@/components/ui/print-modal';
import { useDateNavigation } from '@/hooks/use-date-navigation';

interface TableDataRow {
  time: string;
  [key: string]: any;
}

function formatDateTime(date: Date | undefined, time: string) {
  if (!date) return '--/--/---- --:--';
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  // แปลง time ("14:03") เป็น 24 ชม. format
  let timeStr = time;
  if (/^\d{2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(Number(h));
    d.setMinutes(Number(m));
    timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return `${dateStr} ${timeStr}`;
}

function getCurrentDateTimeString() {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
}

export default function TOU_Compare() {
  const { language } = useLanguage();
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const currentTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState(currentTime);
  const [typeFilter, setTypeFilter] = useState<'24h' | '1month' | '1year'>('24h');
  const [graphType, setGraphType] = useState<'bar' | 'pie'>('pie');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<ApiTableDataRow[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]); // Add monthDays state
  const chartRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => chartRef.current
  } as any);
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTimeString());
  const [showExportModal, setShowExportModal] = useState(false);

  // Date navigation hook
  const { dateRange, navigateDate, setDateRangeManually } = useDateNavigation();
  
  // Print modal states
  const [emailGroups, setEmailGroups] = useState<{ id: number; name: string }[]>([]);
  const [lineGroups, setLineGroups] = useState<{ id: number; name: string }[]>([]);
  const [emailList, setEmailList] = useState<any[]>([]);
  const [lineList, setLineList] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // ใช้ context สำหรับ sidebar
  const { selectedColumns } = React.useContext(TableColumnContext) || { selectedColumns: ['Demand W'] };
  
  // ใช้ context สำหรับ selected meter tree
  const { selectedNodeId, treeData } = useMeterTree();

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
  
  // หาข้อมูล meter ที่เลือก
  const findNodeById = (nodes: any[], id: string): any => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  
  const selectedNode = selectedNodeId && treeData ? findNodeById(treeData, selectedNodeId) : null;
  const meterName = selectedNode?.name || 'AMR-BF-01';
  
  // แมป selectedColumns กับ dataKey ของ chart
  const getVisibleMetrics = () => {
    const metricsMap: { [key: string]: string } = {
      'Demand W': 'wattTotal',
      'Demand Var': 'varTotal',
      'Demand VA': 'vaTotal',
      'Import kWh': 'wattTotal', // ใช้ wattTotal สำหรับ Import kWh
      'Export kWh': 'varTotal',  // ใช้ varTotal สำหรับ Export kWh
      'Import kVarh': 'vaTotal', // ใช้ vaTotal สำหรับ Import kVarh
      'Export kVarh': 'wattTotal' // ใช้ wattTotal สำหรับ Export kVarh
    };
    return selectedColumns.filter(col => metricsMap[col]).map(col => metricsMap[col]);
  };
  
  const visibleMetrics = getVisibleMetrics();
  
  // ฟังก์ชันแปลงข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    console.log('🔍 prepareChartData - ข้อมูลที่ส่งเข้า:', tableData);
    console.log('🔍 prepareChartData - จำนวนข้อมูล:', tableData.length);
    console.log('🔍 prepareChartData - typeFilter:', typeFilter);
    
    if (!tableData || tableData.length === 0) {
      console.log('⚠️ ไม่มีข้อมูลสำหรับสร้างกราฟ');
      return [];
    }

    // สำหรับ month view ให้จัดกลุ่มข้อมูลตามวันในเดือน
    if (typeFilter === '1month') {
      console.log('🗓️ กำลังประมวลผลข้อมูลสำหรับ Month View');
      // จัดกลุ่มข้อมูลตามวันและรวมค่าทุกแถวในแต่ละวัน
      const dailyData: { [key: number]: any } = {};
      
      // เรียงข้อมูลตามเวลา (reading_timestamp)
      const sortedTable = [...tableData].sort((a, b) => {
        const tA = a.reading_timestamp || a.time;
        const tB = b.reading_timestamp || b.time;
        return new Date(tA).getTime() - new Date(tB).getTime();
      });
      
      console.log('🗓️ ข้อมูลที่ส่งเข้า month view:', sortedTable);
      console.log('🗓️ จำนวนข้อมูลที่ส่งเข้า month view:', sortedTable.length);
      
      sortedTable.forEach(row => {
        // ใช้ reading_timestamp เป็นหลักในการ plot เสมอ
        const timeField = row.reading_timestamp || row.time;
        if (!timeField || typeof timeField !== 'string') return;
        
        // แปลง ISO string (UTC) เป็นวันที่
        let localDate: Date | null = null;
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeField)) {
          localDate = new Date(timeField);
        } else {
          return; // ถ้าไม่ใช่ format ที่ถูกต้อง ข้ามไป
        }
        
        const day = localDate.getDate(); // วันที่ (1-31)
        
        if (!dailyData[day]) {
          dailyData[day] = {
            time: day,
            day: day,
            count: 0 // นับจำนวนข้อมูลในวันนั้น
          };
          
          // Initialize all columns
          Object.keys(row).forEach(key => {
            if (key !== 'time' && key !== 'reading_timestamp') {
              dailyData[day][key] = 0;
            }
          });
        }
        
        // Sum values for all numeric columns
        Object.keys(row).forEach(key => {
          if (key !== 'time' && key !== 'reading_timestamp') {
            const value = row[key];
            if (typeof value === 'string' && !isNaN(parseFloat(value))) {
              dailyData[day][key] += parseFloat(value);
            } else if (typeof value === 'number' && !isNaN(value)) {
              dailyData[day][key] += value;
            }
          }
        });
        
        dailyData[day].count++;
      });
      
      console.log('🗓️ ข้อมูลที่จัดกลุ่มตามวัน:', dailyData);
      console.log('🗓️ จำนวนวันที่มีข้อมูล:', Object.keys(dailyData).length);
      
      // แปลง object เป็น array และเรียงลำดับตามวัน
      const result = Object.values(dailyData).sort((a: any, b: any) => a.day - b.day);
      
      console.log('📊 Month view - ข้อมูลที่ประมวลผลแล้ว:', result);
      console.log('📊 จำนวนวันที่มีข้อมูล:', result.length);
      console.log('📊 วันที่มีข้อมูล:', result.map((item: any) => item.day));
      
      return result;
    }
    // สำหรับ year view ให้จัดกลุ่มข้อมูลตามเดือน
    else if (typeFilter === '1year') {
      // จัดกลุ่มข้อมูลตามเดือนและรวมค่าทุกแถวในแต่ละเดือน
      const monthlyData: { [key: number]: any } = {};
      
      tableData.forEach((row, index) => {
        // ใช้ reading_timestamp เป็นหลัก ถ้าไม่มีให้ใช้ time
        const timeField = row.reading_timestamp || row.time;
        
        if (timeField && typeof timeField === 'string') {
          let date: Date | null = null;
          
          // ลองแปลง timestamp หลายรูปแบบ
          if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeField)) {
            // ISO format: 2024-01-15T14:30:00
            date = new Date(timeField);
          } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(timeField)) {
            // MySQL format: 2024-01-15 14:30:00
            date = new Date(timeField.replace(' ', 'T'));
          } else if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(timeField)) {
            // DD/MM/YYYY HH:MM format
            const parts = timeField.split(' ');
            const datePart = parts[0].split('/');
            const timePart = parts[1];
            date = new Date(`${datePart[2]}-${datePart[1]}-${datePart[0]}T${timePart}:00`);
          }
          
          if (date && !isNaN(date.getTime())) {
            const month = date.getMonth() + 1; // 1-12
            
            if (!monthlyData[month]) {
              monthlyData[month] = {
                time: month,
                month: month,
                count: 0 // นับจำนวนข้อมูลในเดือนนั้น
              };
              
              // Initialize all columns
              Object.keys(row).forEach(key => {
                if (key !== 'time' && key !== 'reading_timestamp') {
                  monthlyData[month][key] = 0;
                }
              });
            }
            
            // Sum values for all numeric columns
            Object.keys(row).forEach(key => {
              if (key !== 'time' && key !== 'reading_timestamp') {
                const value = row[key];
                if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                  monthlyData[month][key] += parseFloat(value);
                } else if (typeof value === 'number' && !isNaN(value)) {
                  monthlyData[month][key] += value;
                }
              }
            });
            
            monthlyData[month].count++;
          }
        }
      });
      
      // แปลง object เป็น array และเรียงลำดับตามเดือน
      const result = Object.values(monthlyData).sort((a: any, b: any) => a.month - b.month);
      
      console.log('📊 Year view - ข้อมูลที่ประมวลผลแล้ว:', result);
      console.log('📊 จำนวนเดือนที่มีข้อมูล:', result.length);
      console.log('📊 เดือนที่มีข้อมูล:', result.map((item: any) => item.month));
      
      return result;
    }
    // สำหรับ day view ใช้ logic เดิม
    else {
      console.log('📊 Day view - ข้อมูลที่ประมวลผลแล้ว:', tableData);
      console.log('📊 จำนวนข้อมูล:', tableData.length);
      return tableData;
    }
  };

  // คำนวณช่วงแกน X ตามข้อมูลจริง
  const getXAxisConfig = () => {
    if (typeFilter === '1year') {
      // สำหรับ Year view ให้แสดงแกน X เป็น 1-12 เสมอ
      return {
        domain: [1, 12],
        ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      };
    } else if (typeFilter === '1month') {
      // สำหรับ Month view ให้แสดงตามวันที่มีข้อมูลจริงจาก reading_timestamp
      if (chartData.length > 0 && monthDays.length > 0) {
        // ใช้ข้อมูลวันที่ที่ดึงมาจาก reading_timestamp
        const validMonthDays = monthDays.filter(day => typeof day === 'number' && !isNaN(day) && isFinite(day));
        if (validMonthDays.length > 0) {
          return {
            domain: [Math.min(...validMonthDays) - 1, Math.max(...validMonthDays) + 1], // เพิ่มขอบเล็กน้อย
            ticks: validMonthDays
          };
        }
      }
      // ถ้าไม่มีข้อมูลให้ใช้ domain ตามปกติ
      return {
        domain: [1, 30],
        ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
      };
    } else {
      // สำหรับ Day view ให้แสดงแกน X เป็น 0-24 เสมอ
      return {
        domain: [0, 24],
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      };
    }
  };

  // useEffect สำหรับอัปเดต handlersDays เมื่อ tableData หรือ typeFilter เปลี่ยนแปลง
  useEffect(() => {
    if (typeFilter === '1month' && tableData.length > 0) {
      const daysSet = new Set<number>();
      tableData.forEach(row => {
        if (row.reading_timestamp && typeof row.reading_timestamp === 'string') {
          if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(row.reading_timestamp)) {
            const date = new Date(row.reading_timestamp);
            const day = date.getDate();
            if (day >= 1 && day <= 31) {
              daysSet.add(day);
            }
          }
        }
      });
      const sortedDays = Array.from(daysSet).sort((a, b) => a - b);
      setMonthDays(sortedDays);
    }
  }, [tableData, typeFilter]);

  // ข้อมูลสำหรับกราฟที่ได้จาก API
  const chartData = prepareChartData();
  
  
  // โหลดข้อมูลจาก API
  const loadChartData = async () => {
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
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        meterId: selectedNodeId || undefined,
      };

      console.log('🔍 ส่งพารามิเตอร์ไปยัง API (CompareGraph):', params);
      
      const response = await apiClient.getTableData(params);
      
      console.log('📊 ผลลัพธ์จาก API (CompareGraph):', response);
      console.log('📊 ข้อมูลดิบที่ได้รับ:', response.data);
      console.log('📊 จำนวนข้อมูลดิบ:', Array.isArray(response.data) ? response.data.length : 'ไม่ใช่ array');
      
      let cleanData: any[] = [];
      if (response.success && response.data) {
        // ตรวจสอบว่า response.data เป็น array หรือ object
        if (Array.isArray(response.data)) {
          console.log('✅ ข้อมูลที่ได้รับ (array):', response.data);
          cleanData = response.data;
        } else {
          // ถ้าเป็น object ให้ดูว่าข้อมูลอยู่ที่ไหน
          const dataArray = Array.isArray(response.data.data) ? response.data.data :
                           Array.isArray(response.data) ? response.data : [];
          console.log('✅ ข้อมูลที่ได้รับ (object):', dataArray);
          cleanData = dataArray;
        }

          // Clean invalid values for BarChart
          const metricsMap: { [key: string]: string } = {
            'Demand W': 'wattTotal',
            'Demand Var': 'varTotal',
            'Demand VA': 'vaTotal',
            'Import kWh': 'wattTotal',
            'Export kWh': 'varTotal',
            'Import kVarh': 'vaTotal',
            'Export kVarh': 'wattTotal'
          };
          const keysToCheck = selectedColumns.map(col => (cleanData[0] && col in cleanData[0]) ? col : metricsMap[col]).filter(Boolean);
          cleanData = cleanData.map(row => {
            const newRow = { ...row };
            // Ensure 'time' is present and valid
            if (!('time' in newRow) || newRow['time'] === undefined || newRow['time'] === null || newRow['time'] === '' || isNaN(Number(newRow['time'])) && typeof newRow['time'] !== 'string') {
              newRow['time'] = '';
            }
            keysToCheck.forEach(key => {
              let val = newRow[key];
              if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
                newRow[key] = 0;
              } else {
                newRow[key] = typeof val === 'string' ? parseFloat(val) : val;
              }
            });
            return newRow;
          });

          console.log('📊 ข้อมูลหลังจาก clean:', cleanData);
          console.log('📊 จำนวนข้อมูลหลังจาก clean:', cleanData.length);
          
          setTableData(cleanData);
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

  // สร้างข้อมูลสำหรับ Pie Chart จากข้อมูลจริง
  const getRealPieChartData = () => {
    if (!tableData || tableData.length === 0 || selectedColumns.length === 0) {
      return { chart1Data: [], chart2Data: [] };
    }

    // ใช้ข้อมูลจริงจาก tableData
    const meter1Data: any[] = [];
    const meter2Data: any[] = [];
    const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618'];

    selectedColumns.slice(0, 4).forEach((col, index) => {
      // ใช้ col เป็น dataKey ถ้ามีใน tableData, fallback ไป metricsMap ถ้าไม่มี
      let dataKey = col;
      if (!tableData[0] || !(col in tableData[0])) {
        const metricsMap: { [key: string]: string } = {
          'Demand W': 'wattTotal',
          'Demand Var': 'varTotal',
          'Demand VA': 'vaTotal',
          'Import kWh': 'wattTotal',
          'Export kWh': 'varTotal',
          'Import kVarh': 'vaTotal',
          'Export kVarh': 'wattTotal'
        };
        dataKey = metricsMap[col] || col;
      }
      if (!dataKey) return;

      // หาค่าสูงสุดสำหรับ dataKey นี้
      const values = tableData.map(row => {
        const val = row[dataKey];
        return typeof val === 'string' ? parseFloat(val) : val;
      }).filter(val => typeof val === 'number' && !isNaN(val));

      const maxValue = values.length > 0 ? Math.max(...values) : 0;

      const chartData = {
        name: col,
        value: maxValue,
        color: colors[index % colors.length]
      };

      if (index < 2) {
        meter1Data.push(chartData);
      } else {
        meter2Data.push(chartData);
      }
    });

    return { chart1Data: meter1Data, chart2Data: meter2Data };
  };

  const { chart1Data, chart2Data } = getRealPieChartData();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatically load chart data when component mounts
  useEffect(() => {
    // Auto-load data when component mounts
    if (!isLoaded && tableData.length === 0) {
      loadChartData();
    }
  }, []); // Run only once when component mounts

  // Reload data when selected columns change
  useEffect(() => {
    if (isLoaded) {
      loadChartData();
    }
  }, [selectedColumns]); // Re-run when selectedColumns change

  // Export handler (PDF, CSV, Image)
  async function handleExport(type: 'pdf' | 'csv' | 'image') {
    // Get current date in DDMMYYYY format
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileDate = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const baseName = `TOU-Compare-${fileDate}`;
    
    if (type === 'pdf') {
      // Export as PDF
      const chart = chartRef.current;
      if (!chart) return;
      const canvas = await html2canvas(chart as HTMLElement, { scale: 2 });
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
      const chart = chartRef.current;
      if (!chart) return;
      const canvas = await html2canvas(chart as HTMLElement, { scale: 2 });
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
        type: 'tou-compare',
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
        timeFrom,
        timeTo,
        typeFilter,
        graphType,
        meterName,
        dataPoints: chartData.length
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
      <div className="pt-0 pb-6 animate-fade-in ml-0 sm:ml-2 md:ml-4 lg:ml-8">
        {/* Header */}
        <div className="flex justify-center mt-0">
         <Card className="bg-transparent shadow-none border-none w-full max-w-5xl rounded-t-xl rounded-b-none">
                     <CardContent className="p-2 bg-transparent shadow-none">
                       <div className="flex flex-wrap items-center gap-1 bg-white rounded-t-xl rounded-b-none px-2 py-1 justify-center text-xs">
                         {/* Toggle Graph Type */}
                         <ToggleGroup type="single" value={graphType} onValueChange={v => v && setGraphType(v as 'bar' | 'pie')} className="mr-1">
                           <ToggleGroupItem value="pie" aria-label="Pie Chart" className="flex items-center gap-1 px-2 py-0 h-7 rounded-none text-xs data-[state=on]:bg-primary data-[state=on]:text-white">
                             <PieChartIcon className="w-4 h-4" />
                             <span className="hidden sm:inline">{language === 'TH' ? 'พาย' : 'Pie'}</span>
                           </ToggleGroupItem>
                           <ToggleGroupItem value="bar" aria-label="Bar Graph" className="flex items-center gap-1 px-2 py-0 h-7 rounded-none text-xs data-[state=on]:bg-primary data-[state=on]:text-white">
                             <BarChart3 className="w-4 h-4" />
                             <span className="hidden sm:inline">{language === 'TH' ? 'แท่ง' : 'Bar'}</span>
                           </ToggleGroupItem>
                         </ToggleGroup>
                         
                         {/* Type Filter */}
                         <div className="flex items-center gap-1">
                           <span className="text-xs text-muted-foreground">{language === 'TH' ? 'ประเภท' : 'Type'}</span>
                           <Select value={typeFilter} onValueChange={v => { setTypeFilter(v as '24h' | '1month' | '1year'); setIsLoaded(false); }}>
                             <SelectTrigger id="typeFilter" className="w-auto min-w-[70px] h-7 text-xs rounded-none border border-gray-300 px-2">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="24h">{language === 'TH' ? 'วัน' : 'Day'}</SelectItem>
                               <SelectItem value="1month">{language === 'TH' ? 'เดือน' : 'Month'}</SelectItem>
                               <SelectItem value="1year">{language === 'TH' ? 'ปี' : 'Year'}</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         
                         {/* Date From */}
                         <div className="flex items-center gap-1">
                           <span className="text-xs text-muted-foreground">{language === 'TH' ? 'วันที่' : 'Date'}</span>
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="ghost"
                                 className={cn(
                                   "h-7 px-1 text-xs rounded bg-white border-none shadow-none ring-0 focus:ring-0 hover:bg-white hover:text-black",
                                   !dateFrom && "text-muted-foreground"
                                 )}
                               >
                                 {dateFrom ? format(dateFrom, language === 'TH' ? "dd MMMM yyyy" : "dd MMMM yyyy") : "--/--/----"}
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
                         </div>
                         
                         {/* Time From */}
                         <TimeInput24
                           value={timeFrom}
                           onChange={setTimeFrom}
                           className="h-7 w-10 text-xs rounded-none border-gray-200 shadow-sm px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                         />
                          {/* Date To */}
                                         <div className="flex items-center gap-1">
                                           <span className="text-xs text-muted-foreground">{language === 'TH' ? 'ถึง' : 'To'}</span>
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
                                                 onSelect={date => { setDateTo(date); setIsLoaded(false); }}
                                                 initialFocus
                                                 className="p-3 pointer-events-auto"
                                               />
                                             </PopoverContent>
                                           </Popover>
                                         </div>
                                         {/* Time To */}
                                         <TimeInput24
                                           value={timeTo}
                                           onChange={setTimeTo}
                                           className="h-7 w-10 text-xs rounded-none border-gray-200 shadow-sm px-1 focus:ring-2 focus:ring-primary focus:border-primary"
                                         />
                         
                         
                         {/* Load Button */}
                         <Button
                           disabled={isLoading}
                           className={cn(
                             "h-7 px-2 text-xs rounded-none shadow flex items-center",
                             isLoading
                               ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                               : "bg-primary hover:bg-primary/90 focus:bg-primary active:bg-primary text-white"
                           )}
                           onClick={loadChartData}
                         >
                           <Search className="w-4 h-4 mr-0" />
                           {isLoading ? (language === 'TH' ? 'กำลังโหลด...' : 'Loading...') : (language === 'TH' ? 'โหลด' : 'Load')}
                         </Button>
                         
                         {/* Date Navigation */}
                         <DateNavigation
                           onNavigate={handleDateNavigation}
                           className="ml-1"
                           disabled={isLoading}
                         />
                         
                         {/* Print Button */}
                         <Button
                           className="h-7 px-2 text-xs rounded-none bg-muted hover:bg-gray-200 shadow flex items-center ml-1"
                           variant="outline"
                           onClick={() => setShowExportModal(true)}
                           disabled={!isLoaded || chartData.length === 0 || isLoading}
                         >
                           <Printer className="w-4 h-4 mr-0" />
                         </Button>

                       </div>
                     </CardContent>
                   </Card>
        </div>
        <Card className="shadow-card">
          <CardHeader className="text-black py-1">
            <CardTitle className="text-center text-sm font-semibold w-full flex flex-wrap items-center justify-center gap-2">
              <span>{meterName} /</span>
              <span className="text-blue-600 font-bold">{formatDateTime(dateFrom, timeFrom)}</span>
              <span>–</span>
              <span className="text-green-600 font-bold">{formatDateTime(dateTo, timeTo)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div ref={chartRef} className="h-[550px] w-full ">
              {graphType === 'bar' ? (
                isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">{language === 'TH' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                      {language === 'TH' ? 'ไม่มีข้อมูลในช่วงเวลาที่เลือก' : 'No data available for the selected time range'}
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 10, bottom: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        allowDuplicatedCategory={false}
                        domain={getXAxisConfig().domain}
                        type="number"
                        ticks={getXAxisConfig().ticks}
                        tickFormatter={(value) => {
                          if (typeFilter === '1year') {
                            return `${value}`;
                          } else if (typeFilter === '1month') {
                            // แสดงเป็นเลขเดือน 1-12
                            return `${value}`;
                          } else {
                            // Format as "14:00" for day view
                            return `${value}:00`;
                          }
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000) {
                            return `${(value / 1000).toFixed(1)}k`;
                          }
                          return value.toString();
                        }}
                      />
                      <Tooltip
                        labelFormatter={(value) => {
                          if (typeof value === 'number') {
                            if (typeFilter === '1year') {
                              return `เดือน: ${value}`;
                            } else if (typeFilter === '1month') {
                              return `วันที่: ${value}`;
                            } else {
                              const hours = Math.floor(value);
                              const minutes = Math.round((value % 1) * 60);
                              return `เวลา: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            }
                          }
                          return `เวลา: ${value}`;
                        }}
                        formatter={(value, name) => {
                          if (typeof value === 'number') {
                            if (value >= 1000) {
                              return [`${(value / 1000).toFixed(1)}k`, name];
                            }
                            return [value.toFixed(2), name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{
                          marginTop: 80,
                          fontSize: 12
                        }}
                      />
                      {/* แสดงแท่งกราฟตามคอลัมน์ที่เลือก */}
                      {selectedColumns.slice(0, 4).map((column, index) => {
                        // แมปคอลัมน์กับ dataKey
                        const metricsMap: { [key: string]: string } = {
                          'Demand W': 'wattTotal',
                          'Demand Var': 'varTotal',
                          'Demand VA': 'vaTotal',
                          'Import kWh': 'wattTotal',
                          'Export kWh': 'varTotal',
                          'Import kVarh': 'vaTotal',
                          'Export kVarh': 'wattTotal'
                        };
                        
                        const dataKey = metricsMap[column];
                        if (!dataKey) return null;
                        
                        // สีสำหรับแต่ละแท่ง
                        const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];
                        const color = colors[index % colors.length];
                        
                        return (
                          <Bar
                            key={column}
                            dataKey={dataKey}
                            name={column}
                            fill={color}
                          />
                        );
                      })}
                    </RechartsBarChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="h-full">
                  {chart1Data.length === 0 && chart2Data.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">
                        {language === 'TH' ? 'กรุณาเลือกค่าเพื่อแสดงกราฟ' : 'Please select values to display chart'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full p-4">
                      {/* First Chart Card */}
                      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center">
                        <div className="flex justify-center w-full">
                          <ResponsiveContainer width="100%" height={350} style={{ fontSize: '12px' }}>
                            <PieChart>
                              <Pie
                                data={chart1Data}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, value, percent }) => {
                                  const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(2);
                                  return `${name}: ${formattedValue} (${(percent * 100).toFixed(1)}%)`;
                                }}
                                outerRadius="70%"
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chart1Data.map((entry, index) => (
                                  <Cell key={`cell-1-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name, props) => {
                                  if (typeof value === 'number') {
                                    if (value >= 1000) {
                                      return [`${(value / 1000).toFixed(1)}k`, name];
                                    }
                                    return [value.toFixed(2), name];
                                  }
                                  return [value, name];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      {/* Second Chart Card */}
                      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center">
                        <div className="flex justify-center w-full">
                          <ResponsiveContainer width="100%" height={350} style={{ fontSize: '12px' }}>
                            <PieChart>
                              <Pie
                                data={chart2Data}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, value, percent }) => {
                                  const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(2);
                                  return `${name}: ${formattedValue} (${(percent * 100).toFixed(1)}%)`;
                                }}
                                outerRadius="70%"
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chart2Data.map((entry, index) => (
                                  <Cell key={`cell-2-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name, props) => {
                                  if (typeof value === 'number') {
                                    if (value >= 1000) {
                                      return [`${(value / 1000).toFixed(1)}k`, name];
                                    }
                                    return [value.toFixed(2), name];
                                  }
                                  return [value, name];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Print Modal */}
        <PrintModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          onSendReport={handleSendReport}
          isLoaded={isLoaded}
          hasData={chartData.length > 0}
          isLoading={isLoading}
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