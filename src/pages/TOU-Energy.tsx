import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { Search, Printer, FileText, Image as ImageIcon, LineChart, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TableColumnContext } from '../components/ui/sidebar-menu';
import { useMeterTree } from '@/context/MeterTreeContext';
import { api, TableDataRow as ApiTableDataRow, handleApiError } from '@/services/api';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  ReferenceArea
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TimeInput24 } from '@/components/ui/time-input-24';
import { DateNavigation } from '@/components/ui/date-navigation';
import { PrintModal } from '@/components/ui/print-modal';
import { useDateNavigation } from '@/hooks/use-date-navigation';


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

// Custom Tooltip สำหรับแสดงค่าทั้งหมดของทุกเส้นที่เวลาเดียวกัน
const CustomLineTooltip = ({ active, payload, label, typeFilter }: {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name: string;
    color: string;
  }>;
  label?: number | string;
  typeFilter: '24h' | '1month' | '1year';
}) => {
  // Get language from context
  const { language } = useLanguage();
  if (active && payload && payload.length > 0) {
    let timeLabel = '';
    if (typeof label === 'number') {
      if (typeFilter === '1year') {
        timeLabel = language === 'TH' ? `เดือน: ${label}` : `Month: ${label}`;
      } else if (typeFilter === '1month') {
        timeLabel = language === 'TH' ? `วันที่: ${label}` : `Day: ${label}`;
      } else {
        const hours = Math.floor(label);
        const minutes = Math.round((label % 1) * 60);
        timeLabel = language === 'TH'
          ? `เวลา: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          : `Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } else {
      timeLabel = language === 'TH' ? `เวลา: ${label}` : `Time: ${label}`;
    }

    return (
      <div style={{ background: 'white', border: '1px solid #ccc', padding: 8, borderRadius: 4 }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{language === 'TH' ? 'ค่าทั้งหมดที่เวลาเดียวกัน' : 'All values'}</div>
        <div style={{ fontSize: '12px' }}>{timeLabel}</div>
        {payload.map((entry, index) => {
          const value = entry.value;
          return (
            <div key={`tooltip-item-${index}`} style={{ fontWeight: 'normal', fontSize: '12px' }}>
              <span style={{ color: entry.color }}>{entry.name}</span>: <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ฟังก์ชันหาข้อมูล node ที่เลือก
function findNodeById(nodes: any[], id: string): any {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function TOU_Energy() {
  const { language } = useLanguage();
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState(getCurrentTimeString());
  const [typeFilter, setTypeFilter] = useState<'24h' | '1month' | '1year'>('24h');
  const [graphType, setGraphType] = useState<'line' | 'bar'>('line');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<ApiTableDataRow[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
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

  // ใช้ context สำหรับ selected columns และ meter tree
  const context = useContext(TableColumnContext);
  const contextSelectedColumns = context?.selectedColumns || [];
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
  const selectedNode = selectedNodeId && treeData ? findNodeById(treeData, selectedNodeId) : null;
  const meterName = selectedNode?.name || 'AMR-BF-01';

  // คอลัมน์ที่บังคับให้แสดงเสมอ
  const mandatoryColumns = ['WATT', 'VAR', 'VA'];
  
  // ใช้เฉพาะ 3 ค่าแรกจากคอลัมน์ที่เลือก หรือคอลัมน์บังคับหากไม่มีการเลือก
  const displayColumns = contextSelectedColumns.length > 0
    ? contextSelectedColumns.slice(0, 3)
    : mandatoryColumns.slice(0, 3);

  // Export handler (PDF, CSV, Image)
  async function handleExport(type: 'pdf' | 'csv' | 'image') {
    // Get current date in DDMMYYYY format
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileDate = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const baseName = `TOU-Energy-${fileDate}`;
    
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
        type: 'tou-energy',
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

  // โหลดข้อมูลจาก API
  // ฟังก์ชันโหลดข้อมูลจาก API
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
        columns: contextSelectedColumns.length > 0 ? contextSelectedColumns : undefined,
        meterId: selectedNodeId || undefined,
        // interval: '15min', // Do not filter by interval in backend, fetch all data in range
      };

      console.log('🔍 ส่งพารามิเตอร์ไปยัง API (EnergyGraph):', params);
      console.log('📅 วันที่ From:', dateFrom, '-> formatted:', format(dateFrom, 'yyyy-MM-dd'));
      console.log('📅 วันที่ To:', dateTo, '-> formatted:', format(dateTo || dateFrom, 'yyyy-MM-dd'));
      console.log('⏰ เวลา From-To:', timeFrom, '-', timeTo);
      console.log('🏢 Meter ID:', selectedNodeId);
      console.log('📊 Selected Columns:', contextSelectedColumns);
      console.log('⚠️ ปิดการใช้ interval parameter ชั่วคราวเพื่อทดสอบ');
      
      const response = await apiClient.getTableData(params);
      
      console.log('📊 ผลลัพธ์จาก API (EnergyGraph):', response);
      console.log('✅ API Response Success:', response.success);
      console.log('📋 API Response Message:', response.message);
      console.log('🎯 API Response Data Type:', typeof response.data, 'Is Array:', Array.isArray(response.data));
      
      if (response.success && response.data) {
        // ตรวจสอบว่า response.data เป็น array หรือ object
        if (Array.isArray(response.data)) {
          console.log('✅ ข้อมูลที่ได้รับ (array):', response.data);
          console.log('📊 จำนวนข้อมูลทั้งหมด:', response.data.length);
          
          // แสดง timestamp ของข้อมูลแต่ละรายการ
          response.data.forEach((item, index) => {
            console.log(`📅 ข้อมูลแถวที่ ${index + 1}:`, {
              time: item.time,
              reading_timestamp: item.reading_timestamp,
              all_keys: Object.keys(item),
              sample_values: Object.entries(item).slice(0, 5)
            });
          });
          
          // ตรวจสอบช่วงเวลาของข้อมูลที่ได้รับ
          const timeValues = response.data.map(item => item.time || item.reading_timestamp).filter(Boolean);
          if (timeValues.length > 0) {
            console.log('🕐 ช่วงเวลาในข้อมูลที่ได้รับ:');
            console.log('  - เวลาแรก:', timeValues[0]);
            console.log('  - เวลาสุดท้าย:', timeValues[timeValues.length - 1]);
            console.log('  - เวลาที่เลือก:', timeFrom, '-', timeTo);
            console.log('  - จำนวนข้อมูลทั้งหมด:', timeValues.length);
            
            // หาข้อมูลที่อยู่ในช่วงเวลาที่เลือก
            const filteredByTime = timeValues.filter(timeStr => {
              if (!timeStr) return false;
              const timeOnly = timeStr.includes(' ') ? timeStr.split(' ').find(part => part.includes(':')) : timeStr;
              if (!timeOnly) return false;
              
              const [hours, minutes] = timeOnly.split(':').map(Number);
              const totalMinutes = hours * 60 + minutes;
              const startMinutes = parseInt(timeFrom.split(':')[0]) * 60 + parseInt(timeFrom.split(':')[1]);
              const endMinutes = parseInt(timeTo.split(':')[0]) * 60 + parseInt(timeTo.split(':')[1]);
              
              return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
            });
            
            console.log('🎯 จำนวนข้อมูลที่อยู่ในช่วงเวลาที่เลือก:', filteredByTime.length);
            console.log('🎯 ตัวอย่างข้อมูลในช่วงเวลา:', filteredByTime.slice(0, 5));
          }
          
          // เพิ่ม log ตรวจสอบช่วงเวลา
          if (response.data.length > 1) {
            const timeDifferences = [];
            for (let i = 1; i < response.data.length; i++) {
              const prevTime = response.data[i-1].time || response.data[i-1].reading_timestamp;
              const currTime = response.data[i].time || response.data[i].reading_timestamp;
              console.log(`⏰ เปรียบเทียบเวลา [${i-1}] -> [${i}]:`, {
                prev: prevTime,
                curr: currTime
              });
              
              if (prevTime && currTime) {
                try {
                  const diff = (new Date(`1970-01-01T${currTime}`).getTime() -
                              new Date(`1970-01-01T${prevTime}`).getTime()) / (1000 * 60);
                  timeDifferences.push(diff);
                } catch (e) {
                  console.log('❌ ไม่สามารถคำนวณความแตกต่างของเวลาได้:', e);
                }
              }
            }
            console.log('⏱️ ช่วงห่างระหว่างข้อมูล (นาที):', timeDifferences);
          }
          setTableData(response.data);
        } else {
          // ถ้าเป็น object ให้ดูว่าข้อมูลอยู่ที่ไหน
          const dataArray = Array.isArray(response.data.data) ? response.data.data :
                           Array.isArray(response.data) ? response.data : [];
          console.log('✅ ข้อมูลที่ได้รับ (object):', dataArray);
          console.log('📊 จำนวนข้อมูลทั้งหมด:', dataArray.length);
          
          // แสดง timestamp ของข้อมูลแต่ละรายการ
          dataArray.forEach((item, index) => {
            console.log(`📅 ข้อมูลแถวที่ ${index + 1}:`, {
              time: item.time,
              reading_timestamp: item.reading_timestamp,
              all_keys: Object.keys(item),
              sample_values: Object.entries(item).slice(0, 5)
            });
          });
          
          // ตรวจสอบช่วงเวลาของข้อมูลที่ได้รับ
          const timeValues = dataArray.map(item => item.time || item.reading_timestamp).filter(Boolean);
          if (timeValues.length > 0) {
            console.log('🕐 ช่วงเวลาในข้อมูลที่ได้รับ:');
            console.log('  - เวลาแรก:', timeValues[0]);
            console.log('  - เวลาสุดท้าย:', timeValues[timeValues.length - 1]);
            console.log('  - เวลาที่เลือก:', timeFrom, '-', timeTo);
            console.log('  - จำนวนข้อมูลทั้งหมด:', timeValues.length);
            
            // หาข้อมูลที่อยู่ในช่วงเวลาที่เลือก
            const filteredByTime = timeValues.filter(timeStr => {
              if (!timeStr) return false;
              const timeOnly = timeStr.includes(' ') ? timeStr.split(' ').find(part => part.includes(':')) : timeStr;
              if (!timeOnly) return false;
              
              const [hours, minutes] = timeOnly.split(':').map(Number);
              const totalMinutes = hours * 60 + minutes;
              const startMinutes = parseInt(timeFrom.split(':')[0]) * 60 + parseInt(timeFrom.split(':')[1]);
              const endMinutes = parseInt(timeTo.split(':')[0]) * 60 + parseInt(timeTo.split(':')[1]);
              
              return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
            });
            
            console.log('🎯 จำนวนข้อมูลที่อยู่ในช่วงเวลาที่เลือก:', filteredByTime.length);
            console.log('🎯 ตัวอย่างข้อมูลในช่วงเวลา:', filteredByTime.slice(0, 5));
          }
          
          // เพิ่ม log ตรวจสอบช่วงเวลา
          if (dataArray.length > 1) {
            const timeDifferences = [];
            for (let i = 1; i < dataArray.length; i++) {
              const prevTime = dataArray[i-1].time || dataArray[i-1].reading_timestamp;
              const currTime = dataArray[i].time || dataArray[i].reading_timestamp;
              console.log(`⏰ เปรียบเทียบเวลา [${i-1}] -> [${i}]:`, {
                prev: prevTime,
                curr: currTime
              });
              
              if (prevTime && currTime) {
                try {
                  const diff = (new Date(`1970-01-01T${currTime}`).getTime() -
                              new Date(`1970-01-01T${prevTime}`).getTime()) / (1000 * 60);
                  timeDifferences.push(diff);
                } catch (e) {
                  console.log('❌ ไม่สามารถคำนวณความแตกต่างของเวลาได้:', e);
                }
              }
            }
            console.log('⏱️ ช่วงห่างระหว่างข้อมูล (นาที):', timeDifferences);
          }
          setTableData(dataArray);
        }
        
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

  // ฟังก์ชันแปลงข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    if (!tableData || tableData.length === 0) {
      console.log('⚠️ ไม่มีข้อมูลสำหรับสร้างกราฟ');
      return [];
    }

    console.log('🔍 ข้อมูลดิบจาก API:', tableData);
    console.log('📊 กำลังแปลงข้อมูล จำนวน:', tableData.length, 'รายการ');
    console.log('⏰ ช่วงเวลาที่เลือก:', timeFrom, '-', timeTo);

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
    console.log('🗓️ กำลังประมวลผลข้อมูลสำหรับ Year View');
    
    // จัดกลุ่มข้อมูลตามเดือนและรวมค่าทุกแถวในแต่ละเดือน
    const monthlyData: { [key: number]: any } = {};
    
    tableData.forEach((row, index) => {
      console.log(`📄 ประมวลผลแถวที่ ${index + 1}:`, {
        reading_timestamp: row.reading_timestamp,
        time: row.time,
        keys: Object.keys(row)
      });
      
      // ใช้ reading_timestamp เป็นหลัก ถ้าไม่มีให้ใช้ time
      const timeField = row.reading_timestamp || row.time;
      
      if (timeField && typeof timeField === 'string') {
        let date: Date | null = null;
        
        // ลองแปลง timestamp หลายรูปแบบ
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeField)) {
          // ISO format: 2024-01-15T14:30:00
          date = new Date(timeField);
          console.log(`📅 แปลง ISO format: ${timeField} -> ${date}`);
        } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(timeField)) {
          // MySQL format: 2024-01-15 14:30:00
          date = new Date(timeField.replace(' ', 'T'));
          console.log(`📅 แปลง MySQL format: ${timeField} -> ${date}`);
        } else if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(timeField)) {
          // DD/MM/YYYY HH:MM format
          const parts = timeField.split(' ');
          const datePart = parts[0].split('/');
          const timePart = parts[1];
          date = new Date(`${datePart[2]}-${datePart[1]}-${datePart[0]}T${timePart}:00`);
          console.log(`📅 แปลง DD/MM/YYYY format: ${timeField} -> ${date}`);
        }
        
        if (date && !isNaN(date.getTime())) {
          const month = date.getMonth() + 1; // 1-12
          console.log(`📊 เดือน: ${month} จากวันที่: ${date.toISOString()}`);
          
          if (!monthlyData[month]) {
            monthlyData[month] = {
              time: month,
              month: month,
              count: 0 // นับจำนวนข้อมูลในเดือนนั้น
            };
            
            // Initialize all columns (not just displayColumns)
            Object.keys(row).forEach(key => {
              if (key !== 'time' && key !== 'reading_timestamp') {
                monthlyData[month][key] = 0;
              }
            });
            
            console.log(`🆕 สร้างเดือนใหม่: ${month}`, monthlyData[month]);
          }
          
          // Sum values for all numeric columns
          Object.keys(row).forEach(key => {
            if (key !== 'time' && key !== 'reading_timestamp') {
              const value = row[key];
              if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                monthlyData[month][key] += parseFloat(value);
                console.log(`➕ เพิ่มค่า ${key}: ${value} -> รวม: ${monthlyData[month][key]}`);
              } else if (typeof value === 'number' && !isNaN(value)) {
                monthlyData[month][key] += value;
                console.log(`➕ เพิ่มค่า ${key}: ${value} -> รวม: ${monthlyData[month][key]}`);
              }
            }
          });
          
          monthlyData[month].count++;
        } else {
          console.warn(`❌ ไม่สามารถแปลงวันที่: ${timeField}`);
        }
      } else {
        console.warn(`❌ ไม่พบข้อมูล timestamp ในแถวที่ ${index + 1}:`, row);
      }
    });
    
    // แปลง object เป็น array และเรียงลำดับตามเดือน
    const result = Object.values(monthlyData).sort((a: any, b: any) => a.month - b.month);
    
    console.log('📊 ผลลัพธ์ Year view:', result);
    console.log('📊 จำนวนเดือนที่มีข้อมูล:', result.length);
    
    // แสดงข้อมูลแต่ละเดือน
    result.forEach((item: any) => {
      console.log(`📅 เดือน ${item.month}:`, {
        count: item.count,
        sampleData: Object.entries(item).slice(0, 5)
      });
    });
    
    return result;
  }
    // สำหรับ day view ใช้ logic เดิม
    else {
      // ฟังก์ชันแปลงเวลาเป็นนาที
      const parseTimeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // เรียงข้อมูลตามเวลา
      const sortedTable = [...tableData].sort((a, b) => {
        const tA = a.reading_timestamp || a.time;
        const tB = b.reading_timestamp || b.time;
        return new Date(tA).getTime() - new Date(tB).getTime();
      });

      // หาค่าแรกที่มีข้อมูลในช่วงที่เลือก
      let firstRow = null;
      let firstMinutes = null;
      for (const row of sortedTable) {
        const timeField = row.reading_timestamp || row.time;
        if (!timeField || typeof timeField !== 'string') continue;
        let timeString = timeField;
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeField)) {
          const localDate = new Date(timeField);
          const h = localDate.getHours().toString().padStart(2, '0');
          const m = localDate.getMinutes().toString().padStart(2, '0');
          timeString = `${h}:${m}`;
        } else if (timeField.includes(' ')) {
          const parts = timeField.split(' ');
          timeString = parts.find(part => part.includes(':')) || parts[parts.length - 1];
        }
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) continue;
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const totalMinutes = hours * 60 + minutes;
        const startMinutes = parseTimeToMinutes(timeFrom);
        const endMinutes = parseTimeToMinutes(timeTo);
        if (totalMinutes >= startMinutes && totalMinutes <= endMinutes) {
          firstRow = row;
          firstMinutes = totalMinutes;
          break;
        }
      }

      if (!firstRow || firstMinutes === null) return [];

      // สร้าง array ของ targetTimes โดยบวกทีละ 15 นาที
      const startMinutes = parseTimeToMinutes(timeFrom);
      const endMinutes = parseTimeToMinutes(timeTo);
      let targetTimes: number[] = [];
      let t = firstMinutes;
      while (t <= endMinutes) {
        targetTimes.push(t);
        t += 15;
      }

      // สำหรับแต่ละ targetTime หาข้อมูลที่ใกล้ที่สุด
      const processedRows: any[] = [];
      for (const targetMinute of targetTimes) {
        let closestRow: any = null;
        let minDiff = Number.MAX_VALUE;
        for (const row of sortedTable) {
          const timeField = row.reading_timestamp || row.time;
          if (!timeField || typeof timeField !== 'string') continue;
          let timeString = timeField;
          if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeField)) {
            const localDate = new Date(timeField);
            const h = localDate.getHours().toString().padStart(2, '0');
            const m = localDate.getMinutes().toString().padStart(2, '0');
            timeString = `${h}:${m}`;
          } else if (timeField.includes(' ')) {
            const parts = timeField.split(' ');
            timeString = parts.find(part => part.includes(':')) || parts[parts.length - 1];
          }
          const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
          if (!timeMatch) continue;
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes < startMinutes || totalMinutes > endMinutes) continue;
          const diff = Math.abs(totalMinutes - targetMinute);
          if (diff < minDiff) {
            minDiff = diff;
            closestRow = {
              row,
              timeField,
              timeString,
              hours,
              minutes,
              totalMinutes
            };
          }
        }
        // ถ้าพบข้อมูลที่ใกล้ที่สุด, เพิ่มลงใน processedRows
        if (closestRow && minDiff <= 7) {
          const hourValue = closestRow.hours + (closestRow.minutes / 60);
          const chartRow: any = {
            time: hourValue,
            displayLabel: closestRow.timeField,
            originalTime: closestRow.timeString,
          };
          Object.keys(closestRow.row).forEach(key => {
            if (key !== 'time' && key !== 'reading_timestamp') {
              const value = closestRow.row[key];
              if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                chartRow[key] = parseFloat(value);
              } else if (typeof value === 'number') {
                chartRow[key] = value;
              } else {
                chartRow[key] = value;
              }
            }
          });
          processedRows.push(chartRow);
        }
      }
      return processedRows;
    }
  };

  // useEffect สำหรับอัปเดต monthDays เมื่อ tableData หรือ typeFilter เปลี่ยนแปลง
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
        return {
          domain: [Math.min(...monthDays) - 1, Math.max(...monthDays) + 1], // เพิ่มขอบเล็กน้อย
          ticks: monthDays
        };
      } else {
        // ถ้าไม่มีข้อมูลให้ใช้ domain ตามปกติ
        return {
          domain: [1, 30],
          ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
        };
      }
    } else {
      // สำหรับ Day view ให้แสดงแกน X เป็น 0-24 เสมอ
      return {
        domain: [0, 24],
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      };
    }
  };

  // ฟังก์ชันสำหรับสร้าง TOU background areas
  const getTOUAreas = () => {
    // ตรวจสอบว่าวันที่เลือกเป็นวันเสาร์หรืออาทิตย์หรือไม่
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = อาทิตย์, 6 = เสาร์
    };

    if (typeFilter === '24h') {
      // สำหรับ Day view แสดง TOU areas
      if (isWeekend(dateFrom)) {
        // วันเสาร์หรืออาทิตย์ - แสดงเฉพาะ Off Peak (สีเขียว) ตลอด 24 ชั่วโมง
        return [
          <ReferenceArea
            key="off-peak-weekend"
            x1={0}
            x2={24}
            fill="#4ade80"
            fillOpacity={0.3}
          />
        ];
      } else {
        // วันธรรมดา - แสดง TOU areas ปกติ
        return [
          // Off Peak: 22:00 - 09:00 (สีเขียวเข้ม)
          <ReferenceArea
            key="off-peak-1"
            x1={0}
            x2={9}
            fill="#4ade80"
            fillOpacity={0.3}
          />,
          <ReferenceArea
            key="off-peak-2"
            x1={22}
            x2={24}
            fill="#4ade80"
            fillOpacity={0.3}
          />,
          // On Peak: 09:00 - 22:00 (สีส้มเข้ม)
          <ReferenceArea
            key="on-peak"
            x1={9}
            x2={22}
            fill="#fb923c"
            fillOpacity={0.3}
          />
        ];
      }
    } else if (typeFilter === '1month') {
      // สำหรับ Month view แสดง TOU areas ตามวัน
      const areas = [];
      const daysInMonth = monthDays.length > 0 ? monthDays : Array.from({length: 30}, (_, i) => i + 1);
      
      daysInMonth.forEach(day => {
        // สร้างวันที่สำหรับตรวจสอบว่าเป็นวันเสาร์หรืออาทิตย์หรือไม่
        const currentDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), day);
        const isWeekendDay = isWeekend(currentDate);
        
        if (isWeekendDay) {
          // วันเสาร์หรืออาทิตย์ - แสดงเฉพาะ Off Peak (สีเขียว)
          areas.push(
            <ReferenceArea
              key={`off-peak-weekend-day-${day}`}
              x1={day - 0.4}
              x2={day + 0.4}
              fill="#4ade80"
              fillOpacity={0.3}
            />
          );
        } else {
          // วันธรรมดา - แสดง TOU areas ปกติ
          // Off Peak: 22:00 - 09:00 (สีเขียวเข้ม)
          areas.push(
            <ReferenceArea
              key={`off-peak-1-day-${day}`}
              x1={day - 0.4}
              x2={day - 0.1}
              fill="#4ade80"
              fillOpacity={0.3}
            />
          );
          // On Peak: 09:00 - 22:00 (สีส้มเข้ม)
          areas.push(
            <ReferenceArea
              key={`on-peak-day-${day}`}
              x1={day - 0.1}
              x2={day + 0.1}
              fill="#fb923c"
              fillOpacity={0.3}
            />
          );
          // Off Peak: 22:00 - 09:00 (สีเขียวเข้ม)
          areas.push(
            <ReferenceArea
              key={`off-peak-2-day-${day}`}
              x1={day + 0.1}
              x2={day + 0.4}
              fill="#4ade80"
              fillOpacity={0.3}
            />
          );
        }
      });
      
      return areas;
    } else if (typeFilter === '1year') {
      // สำหรับ Year view แสดง TOU areas ตามเดือน
      const areas = [];
      
      for (let month = 1; month <= 12; month++) {
        // Off Peak: 22:00 - 09:00 (สีเขียวเข้ม)
        areas.push(
          <ReferenceArea
            key={`off-peak-1-month-${month}`}
            x1={month - 0.4}
            x2={month - 0.1}
            fill="#4ade80"
            fillOpacity={0.3}
          />
        );
        // On Peak: 09:00 - 22:00 (สีส้มเข้ม)
        areas.push(
          <ReferenceArea
            key={`on-peak-month-${month}`}
            x1={month - 0.1}
            x2={month + 0.1}
            fill="#fb923c"
            fillOpacity={0.3}
          />
        );
        // Off Peak: 22:00 - 09:00 (สีเขียวเข้ม)
        areas.push(
          <ReferenceArea
            key={`off-peak-2-month-${month}`}
            x1={month + 0.1}
            x2={month + 0.4}
            fill="#4ade80"
            fillOpacity={0.3}
          />
        );
      }
      
      return areas;
    }
    return [];
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageLayout>
      <div className="pt-0 pb-6 animate-fade-in ml-0 sm:ml-2 md:ml-4 lg:ml-8">
        {/* Header */}
        <div className="flex justify-center mt-0">
          {/* Filters */}
          <Card className="bg-transparent shadow-none border-none w-full max-w-5xl rounded-t-xl rounded-b-none">
            <CardContent className="p-2 bg-transparent shadow-none">
              <div className="flex flex-wrap items-center gap-1 bg-white rounded-t-xl rounded-b-none px-2 py-1 justify-center text-xs">
                {/* Toggle Graph Type */}
                {/* Toggle Graph Type */}
                               <ToggleGroup type="single" value={graphType} onValueChange={v => v && setGraphType(v as 'line' | 'bar')} className="mr-1">
                                 <ToggleGroupItem value="line" aria-label="Line Graph" className="flex items-center gap-1 px-2 py-0 h-7 rounded-none text-xs data-[state=on]:bg-primary data-[state=on]:text-white">
                                   <LineChart className="w-4 h-4" />
                                   <span className="hidden sm:inline">{language === 'TH' ? 'เส้น' : 'Line'}</span>
                                 </ToggleGroupItem>
                                 <ToggleGroupItem value="bar" aria-label="Bar Graph" className="flex items-center gap-1 px-2 py-0 h-7 rounded-none text-xs data-[state=on]:bg-primary data-[state=on]:text-white">
                                   <BarChart3 className="w-4 h-4" />
                                   <span className="hidden sm:inline">{language === 'TH' ? 'แท่ง' : 'Bar'}</span>
                                 </ToggleGroupItem>
                               </ToggleGroup>
                {/* Type Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{language === 'TH' ? 'ประเภท' : 'Type'}</span>
                  <Select value={typeFilter} onValueChange={v => { 
                    const newTypeFilter = v as '24h' | '1month' | '1year';
                    setTypeFilter(newTypeFilter); 
                    
                    // เมื่อเปลี่ยนเป็น Day view ให้ set dateTo เป็นวันเดียวกับ dateFrom
                    if (newTypeFilter === '24h' && dateFrom) {
                      setDateTo(dateFrom);
                    }
                    
                    setIsLoaded(false); 
                  }}>
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
                        {dateFrom ? format(dateFrom, "dd MMMM yyyy") : "--/--/----"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={date => { 
                          setDateFrom(date); 
                          // สำหรับ Day view ให้ set dateTo เป็นวันเดียวกัน
                          if (typeFilter === '24h' && date) {
                            setDateTo(date);
                          }
                          setIsLoaded(false); 
                        }}
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
                  {isLoading ? (language === 'TH' ? 'กำลังโหลด...' : 'Loading...') : (language === 'TH' ? 'โหลดข้อมูล' : 'Load')}
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

        {/* Data Table - ปรับให้ชิดกับส่วน filter */}
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
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {isLoaded ? 'ไม่มีข้อมูลในช่วงเวลาที่เลือก' : 'กรุณากดปุ่ม Load เพื่อโหลดข้อมูล'}
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {graphType === 'line' ? (
                    <RechartsLineChart
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
                      <Tooltip content={<CustomLineTooltip typeFilter={typeFilter} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{
                          marginTop: 80,
                          fontSize: 12
                        }}
                      />
                      {/* TOU Background Areas */}
                      {getTOUAreas()}
                      {/* แสดงเส้นกราฟตามคอลัมน์ที่เลือก */}
                      {displayColumns.slice(0, 3).map((column, index) => {
                        // สีสำหรับแต่ละเส้น
                        const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];
                        return (
                          <Line
                            key={column}
                            type="monotone"
                            dataKey={column}
                            name={column}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            connectNulls={true}
                          />
                        );
                      })}
                    </RechartsLineChart>
                  ) : (
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
                              return `เดือน: ${value}`;
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
                      {/* TOU Background Areas */}
                      {getTOUAreas()}
                      {/* แสดงแท่งกราฟตามคอลัมน์ที่เลือก */}
                      {displayColumns.slice(0, 3).map((column, index) => {
                        // สีสำหรับแต่ละแท่ง
                        const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];
                        return (
                          <Bar
                            key={column}
                            dataKey={column}
                            name={column}
                            fill={colors[index % colors.length]}
                          />
                        );
                      })}
                    </RechartsBarChart>
                  )}
                </ResponsiveContainer>
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