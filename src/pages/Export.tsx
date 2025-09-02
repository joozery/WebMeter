import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { CalendarIcon, Download, FileSpreadsheet, FileText, Database, Upload, FolderOpen, Clock, Eye, Power, Trash2, Menu, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { useMeterTree } from '@/context/MeterTreeContext';
import { TimeInput24 } from '@/components/ui/time-input-24';
import { api } from '@/services/api';

export default function Export() {
  // Helper function for padding numbers
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const { buildingNodes, systemNodes, loading: meterTreeLoading } = useMeterTree();

  // ใช้ buildingNodes เป็นหลัก ถ้าไม่มีให้ใช้ systemNodes
  const rootNodes = buildingNodes && buildingNodes.length > 0 ? buildingNodes : systemNodes;

  // Debug: ดูข้อมูล rootNodes
  console.log('rootNodes:', rootNodes);
  console.log('rootNodes length:', rootNodes?.length);
  console.log('buildingNodes:', buildingNodes);
  console.log('systemNodes:', systemNodes);
  console.log('meterTreeLoading:', meterTreeLoading);

  // Check if meter data is loading from database
  const isMeterDataLoading = meterTreeLoading || !rootNodes || rootNodes.length === 0;

  // Sample data สำหรับทดสอบ
  const sampleData = [
    {
      id: 'aj-factory',
      name: 'AJ Factory',
      iconType: 'folder',
      children: [
        {
          id: 'ground-floor',
          name: 'Ground Floor',
          iconType: 'folder',
          children: [
            { id: 'meter-1', name: 'AMR-B1-I/C1.2', iconType: 'meter' },
            { id: 'meter-2', name: 'AMR-B1-F4', iconType: 'meter' }
          ]
        },
        {
          id: 'warehouse',
          name: 'Warehouse',
          iconType: 'folder',
          children: [
            { id: 'meter-3', name: 'Meter 01', iconType: 'meter' }
          ]
        }
      ]
    },
    {
      id: 'bonchon',
      name: 'Bonchon',
      iconType: 'folder',
      children: [
        { id: 'meter-4', name: 'Bonchon Main Meter', iconType: 'meter' }
      ]
    }
  ];

  // ใช้ข้อมูลจาก database ถ้ามี หรือใช้ sample data เป็น fallback
  const treeData = rootNodes && rootNodes.length > 0 ? rootNodes : sampleData;

  // ฟังก์ชันดึงชื่อมิเตอร์ทั้งหมดจาก tree (iconType === 'meter') พร้อม location
  function getAllMetersFromTree(nodes, parentPath = '') {
    let meters = [];
    for (const node of nodes) {
      const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
      if (node.iconType === 'meter' && node.name) {
        meters.push({ 
          id: node.id, 
          name: node.name,
          location: parentPath || 'Root'
        });
      }
      if (node.children) {
        meters = meters.concat(getAllMetersFromTree(node.children, currentPath));
      }
    }
    return meters;
  }
  const meterList = getAllMetersFromTree(treeData || []);

  console.log('meterList:', meterList);

  // State for real data from database
  const [emailListData, setEmailListData] = useState([]);
  const [lineListData, setLineListData] = useState([]);
  const [dbGroups, setDbGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users (emails)
        const usersResponse = await apiClient.getUsers({
          page: 1,
          limit: 1000,
          sortBy: 'id',
          sortOrder: 'ASC'
        });
        
        if (usersResponse.success && usersResponse.data) {
          // Transform user data to email format
          const emailData = usersResponse.data.map((user: any) => ({
            id: user.id,
            displayName: user.username || '',
            email: user.email || '',
            groups: user.group_name ? [user.group_name] : [],
            name: `${user.name || ''} ${user.surname || ''}`.trim(),
            phone: user.phone || '',
            lineId: user.line_id || '',
            enabled: user.status === 'active'
          }));
          setEmailListData(emailData);
        }
        
        // Fetch groups
        const groupsResponse = await apiClient.getGroups();
        if (groupsResponse.success && groupsResponse.data) {
          setDbGroups(groupsResponse.data);
        }
        
        // For now, use email data as line data (since we don't have separate line API)
        if (usersResponse.success && usersResponse.data) {
          const lineData = usersResponse.data.map((user: any) => ({
            id: user.id,
            lineId: user.lineId || user.line_id || `LINE-${user.id.toString().padStart(3, '0')}`,
            displayName: user.username || '',
            username: user.username || '',
            groups: user.group_name ? [user.group_name] : [],
            name: `${user.name || ''} ${user.surname || ''}`.trim(),
            token: `line${user.id}_token_${Math.random().toString(36).substr(2, 9)}`,
            enabled: user.status === 'active'
          }));
          setLineListData(lineData);
        }
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Effect to expand all groups when data is loaded
  useEffect(() => {
    if (dbGroups.length > 0) {
      const groupNames = dbGroups.map(group => group.name);
      setExpandedEmailGroups(new Set(groupNames));
      setExpandedLineGroups(new Set(groupNames));
    }
  }, [dbGroups]);





  // state สำหรับ search และ meter selection
  const [searchTerm, setSearchTerm] = useState('');
  const [meterSelection, setMeterSelection] = useState({});
  
  // Filter meters based on search term
  const filteredMeterList = meterList.filter(meter => {
    const matchesSearch = meter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meter.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  // sync meterSelection กับ meterList
  React.useEffect(() => {
    const initial = {};
    meterList.forEach(m => { initial[m.id] = meterSelection[m.id] ?? false; });
    setMeterSelection(initial);
    // eslint-disable-next-line
  }, [JSON.stringify(meterList)]);
  
  const toggleMeter = (id) => {
    setMeterSelection(sel => ({ ...sel, [id]: !sel[id] }));
  };

  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateTo, setDateTo] = useState<Date>(() => new Date());
  const [timeFrom, setTimeFrom] = useState(() => {
    // กำหนด default เป็น 00:00 เสมอ และบังคับให้เป็น 24-hour format
    return '00:00';
  });
  const [timeTo, setTimeTo] = useState(() => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [selectedMeter, setSelectedMeter] = useState('msb-ew-1');
  const [exportType, setExportType] = useState('normal');
  const [readTime, setReadTime] = useState('15min');
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedEmailList, setSelectedEmailList] = useState([]);
  const [selectedLineList, setSelectedLineList] = useState([]);
  const [listType, setListType] = useState('email'); // 'email' or 'line'
  
  // Email group management for email format
  const [expandedEmailGroups, setExpandedEmailGroups] = useState<Set<string>>(new Set());
  const [selectedEmailGroups, setSelectedEmailGroups] = useState<Set<string>>(new Set());
  
  // Line group management for line format
  const [expandedLineGroups, setExpandedLineGroups] = useState<Set<string>>(new Set());
  const [selectedLineGroups, setSelectedLineGroups] = useState<Set<string>>(new Set());
  
  const [autoExportFrequency, setAutoExportFrequency] = useState('daily');
  const [autoExportTime, setAutoExportTime] = useState('08:00');
  const [autoExportDay, setAutoExportDay] = useState('monday'); // For weekly
  const [autoExportDate, setAutoExportDate] = useState(1); // For monthly (1-31)
  
  // Define type for auto export schedule
  type AutoExportSchedule = {
    id: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    day?: string;
    date?: number;
    exportType: string;
    exportFormat: string;
    readTime: string;
    meters: string[];
    parameters: string[];
    filePath: string;
    emailList: number[] | null;
    lineList: number[] | null;
    enabled: boolean;
    created: string;
    createdBy: string;
  };

  // Store configured auto export schedules
  const [autoExportSchedules, setAutoExportSchedules] = useState<AutoExportSchedule[]>([
    { 
      id: 1, 
      frequency: 'daily' as const, 
      time: '08:00', 
      exportType: 'normal', 
      exportFormat: 'excel',
      readTime: '15min',
      meters: ['meter-1', 'meter-2'],
      parameters: ['frequency', 'volt_an', 'current_a'],
      filePath: 'C:\\My Report\\auto_daily.xlsx',
      emailList: null,
      lineList: null,
      enabled: true, 
      created: '2025-07-20',
      createdBy: 'Admin User'
    },
    { 
      id: 2, 
      frequency: 'weekly' as const, 
      time: '09:00', 
      day: 'monday', 
      exportType: 'comparison', 
      exportFormat: 'email',
      readTime: '1min',
      meters: ['meter-4'],
      parameters: ['demand_w', 'import_kwh'],
      filePath: 'Email will be sent to: System Administrator (admin@webmeter.com), John Smith (john.smith@webmeter.com)',
      emailList: [1, 2],
      lineList: null,
      enabled: false, 
      created: '2025-07-18',
      createdBy: 'Manager User'
    },
    { 
      id: 3, 
      frequency: 'monthly' as const, 
      time: '10:00', 
      date: 15, 
      exportType: 'tou_pe', 
      exportFormat: 'line',
      readTime: '5min',
      meters: ['meter-3'],
      parameters: ['demand_w', 'demand_var', 'demand_va', 'import_kwh'],
      filePath: 'Line notification will be sent to: System Admin Line (LINE-001), John Smith Line (LINE-002)',
      emailList: null,
      lineList: [1, 2],
      enabled: true, 
      created: '2025-07-15',
      createdBy: 'System User'
    }
  ]);

  // Modal state for schedule details
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfiguredSchedules, setShowConfiguredSchedules] = useState(true);
  
  // Generate default file path with current date
  const generateDefaultFilePath = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateString = `${day}${month}${year}`;
    
    if (exportFormat === 'email') {
      if (listType === 'email') {
        const selectedEmails = emailListData.filter(email => selectedEmailList.includes(email.id));
        if (selectedEmails.length > 0) {
          return `Email will be sent to: ${selectedEmails.map(email => `${email.displayName} (${email.email})`).join(', ')}`;
        }
        return 'No email recipients selected';
      } else {
        // When listType is 'line' but exportFormat is 'email', show email groups
        const selectedEmails = emailListData.filter(email => selectedEmailList.includes(email.id));
        if (selectedEmails.length > 0) {
          return `Email group notification will be sent to: ${selectedEmails.map(email => `${email.displayName} (${email.email})`).join(', ')}`;
        }
        return 'No email groups selected';
      }
    } else if (exportFormat === 'line') {
      if (listType === 'email') {
        const selectedEmails = emailListData.filter(email => selectedEmailList.includes(email.id));
        if (selectedEmails.length > 0) {
          return `Email will be sent to: ${selectedEmails.map(email => `${email.displayName} (${email.email})`).join(', ')}`;
        }
        return 'No email recipients selected';
      } else {
        const selectedLines = lineListData.filter(line => selectedLineList.includes(line.id));
        if (selectedLines.length > 0) {
          return `Line notification will be sent to: ${selectedLines.map(line => `${line.displayName} (Line ID: ${line.lineId})`).join(', ')}`;
        }
        return 'No Line recipients selected';
      }
    } else {
      const extension = exportFormat === 'pdf' ? 'pdf' : 'xlsx';
      return `C:\\My Report\\export_${dateString}.${extension}`;
    }
  };
  
  const [filePath, setFilePath] = useState(generateDefaultFilePath());
  

  
  // Group emails by their groups
  const getGroupedEmails = () => {
    const grouped = new Map<string, typeof emailListData>();
    const groupNames = dbGroups.map(group => group.name);
    
    emailListData.forEach(email => {
      email.groups.forEach(group => {
        if (groupNames.includes(group)) {
          if (!grouped.has(group)) {
            grouped.set(group, []);
          }
          grouped.get(group)!.push(email);
        }
      });
    });
    
    return grouped;
  };
  
  // Toggle email group expansion
  const toggleEmailGroup = (groupName: string) => {
    setExpandedEmailGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };
  
  // Toggle entire email group selection
  const toggleEmailGroupSelection = (groupName: string) => {
    const groupEmails = getGroupedEmails().get(groupName) || [];
    const groupEmailIds = groupEmails.map(email => email.id);
    
    const allSelected = groupEmailIds.every(id => selectedEmailList.includes(id));
    
    if (allSelected) {
      // Unselect all emails in this group
      setSelectedEmailList(prev => prev.filter(id => !groupEmailIds.includes(id)));
      setSelectedEmailGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupName);
        return newSet;
      });
    } else {
      // Select all emails in this group
      setSelectedEmailList(prev => {
        const newIds = groupEmailIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
      setSelectedEmailGroups(prev => {
        const newSet = new Set(prev);
        newSet.add(groupName);
        return newSet;
      });
    }
  };
  
  // Toggle individual email selection
  const toggleEmailSelection = (emailId: number) => {
    setSelectedEmailList(prev => {
      if (prev.includes(emailId)) {
        return prev.filter(id => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };
  
  // Group lines by their groups
  const getGroupedLines = () => {
    const grouped = new Map<string, typeof lineListData>();
    const groupNames = dbGroups.map(group => group.name);
    
    lineListData.forEach(line => {
      line.groups.forEach(group => {
        if (groupNames.includes(group)) {
          if (!grouped.has(group)) {
            grouped.set(group, []);
          }
          grouped.get(group)!.push(line);
        }
      });
    });
    
    return grouped;
  };
  
  // Toggle line group expansion
  const toggleLineGroup = (groupName: string) => {
    setExpandedLineGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };
  
  // Toggle entire line group selection
  const toggleLineGroupSelection = (groupName: string) => {
    const groupLines = getGroupedLines().get(groupName) || [];
    const groupLineIds = groupLines.map(line => line.id);
    
    const allSelected = groupLineIds.every(id => selectedLineList.includes(id));
    
    if (allSelected) {
      // Unselect all lines in this group
      setSelectedLineList(prev => prev.filter(id => !groupLineIds.includes(id)));
      setSelectedLineGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupName);
        return newSet;
      });
    } else {
      // Select all lines in this group
      setSelectedLineList(prev => {
        const newIds = groupLineIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
      setSelectedLineGroups(prev => {
        const newSet = new Set(prev);
        newSet.add(groupName);
        return newSet;
      });
    }
  };
  
  // Toggle individual line selection
  const toggleLineSelection = (lineId: number) => {
    setSelectedLineList(prev => {
      if (prev.includes(lineId)) {
        return prev.filter(id => id !== lineId);
      } else {
        return [...prev, lineId];
      }
    });
  };
  
  // Auto export settings for each export type
  const [autoExportSettings, setAutoExportSettings] = useState({
    normal: { enabled: false, time: '00:00' },
    comparison: { enabled: false, time: '00:00' },
    daily: { enabled: false, time: '00:00' },
    monthly: { enabled: false, time: '00:00' },
    tou: { enabled: false, time: '00:00' }
  });

  // Update file path when export format changes
  React.useEffect(() => {
    setFilePath(generateDefaultFilePath());
  }, [exportFormat, selectedEmailList, selectedLineList, listType]);

  const parameterList = [
    { id: 'frequency', label: 'Frequency' },
    { id: 'volt_an', label: 'Volt AN' },
    { id: 'volt_bn', label: 'Volt BN' },
    { id: 'volt_cn', label: 'Volt CN' },
    { id: 'volt_ln_avg', label: 'Volt LN Avg' },
    { id: 'volt_ab', label: 'Volt AB' },
    { id: 'volt_bc', label: 'Volt BC' },
    { id: 'volt_ca', label: 'Volt CA' },
    { id: 'volt_ll_avg', label: 'Volt LL Avg' },
    { id: 'current_a', label: 'Current A' },
    { id: 'current_b', label: 'Current B' },
    { id: 'current_c', label: 'Current C' },
    { id: 'current_avg', label: 'Current Avg' },
    { id: 'current_in', label: 'Current IN' },
    { id: 'watt_a', label: 'Watt A' },
    { id: 'watt_b', label: 'Watt B' },
    { id: 'watt_c', label: 'Watt C' },
    { id: 'watt_total', label: 'Watt Total' },
    { id: 'var_a', label: 'Var A' },
    { id: 'var_b', label: 'Var B' },
    { id: 'var_c', label: 'Var C' },
    { id: 'var_total', label: 'Var total' },
    { id: 'va_a', label: 'VA A' },
    { id: 'va_b', label: 'VA B' },
    { id: 'va_c', label: 'VA C' },
    { id: 'va_total', label: 'VA Total' },
    { id: 'pf_a', label: 'PF A' },
    { id: 'pf_b', label: 'PF B' },
    { id: 'pf_c', label: 'PF C' },
    { id: 'pf_total', label: 'PF Total' },
    { id: 'demand_w', label: 'Demand W' },
    { id: 'demand_var', label: 'Demand Var' },
    { id: 'demand_va', label: 'Demand VA' },
    { id: 'import_kwh', label: 'Import kWh' },
    { id: 'export_kwh', label: 'Export kWh' },
    { id: 'import_kvarh', label: 'Import kVarh' },
    { id: 'export_kvarh', label: 'Export kVarh' },
    { id: 'thdv', label: 'THDV' },
    { id: 'thdi', label: 'THDI' },
  ];
  const [selectedParameters, setSelectedParameters] = useState(parameterList.map(p => p.id));
  const allSelected = selectedParameters.length === parameterList.length;
  const toggleSelectAll = () => {
    setSelectedParameters(allSelected ? [] : parameterList.map(p => p.id));
  };
  const toggleParameter = (id: string) => {
    setSelectedParameters(selectedParameters.includes(id)
      ? selectedParameters.filter(pid => pid !== id)
      : [...selectedParameters, id]);
  };

  const handleExport = async () => {
    // Export functionality would be implemented here
    const selectedMeterIds = Object.keys(meterSelection).filter(id => meterSelection[id]);
    
    // Validate selections
    if (selectedMeterIds.length === 0) {
      alert('Error: Please select at least one meter before exporting.');
      return;
    }
    
    if (selectedParameters.length === 0) {
      alert('Error: Please select at least one parameter before exporting.');
      return;
    }
    
    // Additional validation for email and line formats
    if ((exportFormat === 'email' || exportFormat === 'line') && listType === 'email' && selectedEmailList.length === 0) {
      alert('Error: Please select at least one email recipient.');
      return;
    }
    
    if ((exportFormat === 'email' || exportFormat === 'line') && listType === 'line' && selectedLineList.length === 0) {
      alert('Error: Please select at least one Line group.');
      return;
    }
    
    const exportData = {
      meters: selectedMeterIds,
      parameters: selectedParameters,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      exportType,
      exportFormat,
      readTime,
      emailList: (exportFormat === 'email' || exportFormat === 'line') && listType === 'email' ? selectedEmailList : null,
      lineList: (exportFormat === 'email' || exportFormat === 'line') && listType === 'line' ? selectedLineList : null,
      autoExport: autoExportSettings[exportType].enabled ? {
        time: autoExportSettings[exportType].time,
        type: exportType
      } : null,
      filePath
    };
    
    try {
      // Create directory if it doesn't exist
        const fs = typeof require === 'function' ? require('fs') : null;
        const path = typeof require === 'function' ? require('path') : null;
      
      if (fs && path) {
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Created directory: ${dirPath}`);
        }
        
        // Generate export content based on format
        if (exportFormat === 'email' || exportFormat === 'line') {
          if (listType === 'email') {
            // For Email export - send email to selected recipients
            const emailContent = `Export Report via Email
Generated: ${new Date().toLocaleString()}
Export Type: ${exportType}
Date Range: ${dateFrom?.toLocaleDateString()} - ${dateTo?.toLocaleDateString()}
Time Range: ${timeFrom} - ${timeTo}
Read Time: ${readTime}

Selected Email Recipients:
${selectedEmailList.map(emailId => {
  const email = emailListData.find(e => e.id === emailId);
  return `- ${email?.displayName} (${email?.email})`;
}).join('\n')}

Selected Meters:
${selectedMeterIds.map(id => {
  const meter = meterList.find(m => m.id === id);
  return `- ${meter?.name} (${meter?.location})`;
}).join('\n')}

Selected Parameters:
${selectedParameters.map(paramId => {
  const param = parameterList.find(p => p.id === paramId);
  return `- ${param?.label}`;
}).join('\n')}`;
            
            console.log('Email content:', emailContent);
            alert(`Email sent successfully to ${selectedEmailList.length} recipients`);
          } else {
            // For Line export - send Line notification to selected groups
            const lineContent = `Export Report via Line
Generated: ${new Date().toLocaleString()}
Export Type: ${exportType}
Date Range: ${dateFrom?.toLocaleDateString()} - ${dateTo?.toLocaleDateString()}
Time Range: ${timeFrom} - ${timeTo}
Read Time: ${readTime}

Selected Line Recipients:
${selectedLineList.map(lineId => {
  const line = lineListData.find(l => l.id === lineId);
  return `- ${line?.displayName} (Line ID: ${line?.lineId})`;
}).join('\n')}

Selected Meters:
${selectedMeterIds.map(id => {
  const meter = meterList.find(m => m.id === id);
  return `- ${meter?.name} (${meter?.location})`;
}).join('\n')}

Selected Parameters:
${selectedParameters.map(paramId => {
  const param = parameterList.find(p => p.id === paramId);
  return `- ${param?.label}`;
}).join('\n')}`;
            
            console.log('Line content:', lineContent);
            alert(`Line notification sent successfully to ${selectedLineList.length} groups`);
          }
          
        } else if (exportFormat === 'pdf') {
          // For PDF export - create a simple text content for demo
          const pdfContent = `Export Report
Generated: ${new Date().toLocaleString()}
Export Type: ${exportType}
Date Range: ${dateFrom?.toLocaleDateString()} - ${dateTo?.toLocaleDateString()}
Time Range: ${timeFrom} - ${timeTo}
Read Time: ${readTime}

Selected Meters:
${selectedMeterIds.map(id => {
  const meter = meterList.find(m => m.id === id);
  return `- ${meter?.name} (${meter?.location})`;
}).join('\n')}

Selected Parameters:
${selectedParameters.map(paramId => {
  const param = parameterList.find(p => p.id === paramId);
  return `- ${param?.label}`;
}).join('\n')}`;
          
          fs.writeFileSync(filePath, pdfContent, 'utf8');
        } else {
          // For Excel export - create CSV content for demo
          const csvHeaders = ['Timestamp', 'Meter', 'Location', ...selectedParameters.map(paramId => {
            const param = parameterList.find(p => p.id === paramId);
            return param?.label || paramId;
          })];
          
          let csvContent = csvHeaders.join(',') + '\n';
          
          // Add sample data rows
          selectedMeterIds.forEach(meterId => {
            const meter = meterList.find(m => m.id === meterId);
            const sampleRow = [
              new Date().toISOString(),
              `"${meter?.name || meterId}"`,
              `"${meter?.location || 'Unknown'}"`,
              ...selectedParameters.map(() => Math.random() * 100)
            ];
            csvContent += sampleRow.join(',') + '\n';
          });
          
          fs.writeFileSync(filePath, csvContent, 'utf8');
        }
        
        console.log(`File exported successfully to: ${filePath}`);
        alert(`File exported successfully to: ${filePath}`);
        
      } else {
        // Fallback for web environments - trigger download
        const content = JSON.stringify(exportData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = filePath.split('\\').pop().split('/').pop() || 'export.json';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('File downloaded as fallback');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
    
    console.log('Exporting data...', exportData);
  };

  // Add new auto export schedule
  const handleAddAutoExport = () => {
    const selectedMeterIds = Object.keys(meterSelection).filter(id => meterSelection[id]);
    
    // Validate selections before adding schedule
    if (selectedMeterIds.length === 0) {
      alert('Error: Please select at least one meter before adding auto export schedule.');
      return;
    }
    
    if (selectedParameters.length === 0) {
      alert('Error: Please select at least one parameter before adding auto export schedule.');
      return;
    }
    
    const newSchedule: AutoExportSchedule = {
      id: Date.now(),
      frequency: autoExportFrequency as 'daily' | 'weekly' | 'monthly',
      time: autoExportTime,
      day: autoExportFrequency === 'weekly' ? autoExportDay : undefined,
      date: autoExportFrequency === 'monthly' ? autoExportDate : undefined,
      exportType,
      exportFormat,
      readTime,
      meters: selectedMeterIds,
      parameters: selectedParameters,
      filePath,
      emailList: (exportFormat === 'email' || exportFormat === 'line') && listType === 'email' ? selectedEmailList : null,
      lineList: (exportFormat === 'email' || exportFormat === 'line') && listType === 'line' ? selectedLineList : null,
      enabled: true,
      created: new Date().toISOString().split('T')[0],
      createdBy: 'Current User' // This would typically come from user context/authentication
    };
    
    setAutoExportSchedules(prev => [...prev, newSchedule]);
    alert('Auto export schedule added successfully!');
  };

  // Toggle schedule enabled/disabled
  const toggleSchedule = (id) => {
    setAutoExportSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id 
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    );
  };

  // Remove schedule
  const removeSchedule = (id) => {
    setAutoExportSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };

  // Get readable frequency text
  const getFrequencyText = (schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        return `Weekly on ${schedule.day} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.date} at ${schedule.time}`;
      default:
        return schedule.frequency;
    }
  };

  // Get schedule display info
  const getScheduleDisplayInfo = (schedule) => {
    let exportTypeText = schedule.exportType.charAt(0).toUpperCase() + schedule.exportType.slice(1);
    
    // Handle special cases for export type display
    if (schedule.exportType === 'tou_pe') {
      exportTypeText = 'TOU PE';
    } else if (schedule.exportType === 'compare_pe') {
      exportTypeText = 'Compare PE';
    }
    
    const exportFormatText = schedule.exportFormat.toUpperCase();
    const frequencyText = schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1);
    
    let displayText = `${exportTypeText} • ${exportFormatText} • ${frequencyText} • H:${schedule.time}`;
    
    if (schedule.frequency === 'monthly') {
      displayText = `${exportTypeText} • ${exportFormatText} • ${frequencyText} • D:${schedule.date} H:${schedule.time}`;
    } else if (schedule.frequency === 'weekly') {
      const dayText = schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1);
      displayText = `${exportTypeText} • ${exportFormatText} • ${frequencyText} • ${dayText} H:${schedule.time}`;
    }
    
    return {
      firstLine: displayText,
      secondLine: `Read Time: ${schedule.readTime}`
    };
  };

  // Show schedule detail modal
  const showScheduleDetail = (schedule) => {
    setSelectedScheduleDetail(schedule);
    setShowDetailModal(true);
  };

  const handleClear = () => {
    // Clear all selections and reset to defaults
    
    // Reset meter selection (ล้างการเลือกมิเตอร์ทั้งหมด)
    const clearedMeterSelection = {};
    meterList.forEach(m => { clearedMeterSelection[m.id] = false; });
    setMeterSelection(clearedMeterSelection);
    
    // Reset search term (ล้างคำค้นหา)
    setSearchTerm('');
    
    // Reset parameters to none selected (ล้างการเลือก parameters ทั้งหมด)
    setSelectedParameters([]);
    
    // Reset dates to default (รีเซ็ตวันที่กลับไปเป็นค่าเริ่มต้น)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDateFrom(today);
    setDateTo(new Date());
    
    // Reset times to default (รีเซ็ตเวลากลับไปเป็นค่าเริ่มต้น)
    setTimeFrom('00:00');
    setTimeTo(`${pad(today.getHours())}:${pad(today.getMinutes())}`);
    
    // Reset export type to default (รีเซ็ต export type กลับไปเป็น Normal)
    setExportType('normal');
    
    // Reset export format to default (รีเซ็ต export format กลับไปเป็น Excel)
    setExportFormat('excel');
    
    // Reset read time to default (รีเซ็ต read time กลับไปเป็น 15 นาที)
    setReadTime('15min');
    
    // Reset auto export settings (รีเซ็ตการตั้งค่า auto export)
    setAutoExportFrequency('daily');
    setAutoExportTime('08:00');
    setAutoExportDay('monday');
    setAutoExportDate(1);
    
    // Reset auto export settings for all types
    setAutoExportSettings({
      normal: { enabled: false, time: '00:00' },
      comparison: { enabled: false, time: '00:00' },
      daily: { enabled: false, time: '00:00' },
      monthly: { enabled: false, time: '00:00' },
      tou: { enabled: false, time: '00:00' }
    });
    
    // Reset email and line list selections
    setSelectedEmailList([]);
    setSelectedLineList([]);
    
    // Reset email group states
    const groupNames = dbGroups.map(group => group.name);
    setExpandedEmailGroups(new Set(groupNames));
    setSelectedEmailGroups(new Set());
    
    // Reset line group states
    setExpandedLineGroups(new Set(groupNames));
    setSelectedLineGroups(new Set());
    
    // Reset list type to email
    setListType('email');
  };

  const handleBrowseFile = () => {
    // For email and line formats, browse function is not applicable
    if (exportFormat === 'email' || exportFormat === 'line') {
      alert(`Browse file is not applicable for ${exportFormat} format`);
      return;
    }
    
    // สร้าง input element สำหรับเลือกไฟล์
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = exportFormat === 'pdf' ? '.pdf' : '.xlsx,.xls';
    input.multiple = false;
    
    // เมื่อเลือกไฟล์แล้ว
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // ใช้ชื่อไฟล์ที่เลือก แต่เปลี่ยน path เป็น default path
        const fileName = file.name;
        const defaultPath = 'C:\\My Report\\';
        setFilePath(defaultPath + fileName);
      }
    };
    
    // เปิด file dialog
    input.click();
  };

  const toggleAutoExport = (type: string) => {
    setAutoExportSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  const updateAutoExportTime = (type: string, time: string) => {
    setAutoExportSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        time: time
      }
    }));
  };

  function ParamCheckbox({ id, label }: { id: string; label: string }) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          id={id}
          className="accent-primary rounded-none border h-3 w-3 border-gray-300"
          checked={selectedParameters.includes(id)}
          onChange={() => toggleParameter(id)}
        />
        <label htmlFor={id} className="text-xs cursor-pointer select-none break-words">{label}</label>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-9xl mx-auto">
          <div className="bg-white rounded-none shadow-sm">
            <div className="flex items-center gap-2 p-4">
              <Upload className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-gray-900">Export Data</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-full min-h-0 p-4 pt-0">
              {loading ? (
                <div className="col-span-4 flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading data...</p>
                  </div>
                </div>
              ) : (
                <div className="col-span-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                  {/* Meter Selection */}
                  <div className="border border-gray-200 bg-white p-2 flex flex-col flex-1 min-h-[575px] shadow-sm">
                    <div className="font-semibold text-black mb-3 flex items-center justify-between text-sm h-8">
                      <span className="text-sm">Meter Selection</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={Object.values(meterSelection).every(Boolean) ? "default" : "outline"}
                          className={`h-6 px-2 text-xs rounded-none ${
                            Object.values(meterSelection).every(Boolean) 
                              ? 'bg-primary text-white hover:bg-primary/90' 
                              : 'text-gray-500 border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            const allSelected = Object.values(meterSelection).every(Boolean);
                            const newSelection = {};
                            meterList.forEach(m => { newSelection[m.id] = !allSelected; });
                            setMeterSelection(newSelection);
                          }}
                        >
                          All
                        </Button>
                      </div>
                    </div> 
                    {/* Search Box */}
                    <div className="mb-2">
                      <Input
                        placeholder="Search..."
                        className="h-7 text-xs rounded-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    


                    {/* All Meters List */}
                    <div className="flex-1 max-h-[400px] overflow-y-auto border border-gray-100">
                      <div className="space-y-1 p-1">
                        {isMeterDataLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-xs text-gray-600">Loading meters from database...</p>
                          </div>
                        ) : (
                          <>
                                                        {filteredMeterList.map(meter => (
                              <div 
                                key={meter.id} 
                                className="border border-gray-200 bg-white p-2 hover:bg-gray-50 cursor-pointer"
                                title={`${meter.name}
Location: ${meter.location}`}
                              >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={meter.id}
                                className="accent-primary border h-3 w-3 border-gray-300"
                                checked={!!meterSelection[meter.id]}
                                onChange={() => toggleMeter(meter.id)}
                              />
                                                              <div className="flex-1 min-w-0">
                                  <label htmlFor={meter.id} className="text-xs cursor-pointer block truncate font-medium">
                                    {meter.name}
                                  </label>
                                  <span className="text-xs text-gray-500 block truncate">
                                    {meter.location}
                                  </span>
                                </div>
                            </div>
                          </div>
                        ))}
                        
                        {filteredMeterList.length === 0 && (
                          <div className="text-gray-500 text-xs p-3 text-center border border-gray-200 bg-gray-50">
                            {searchTerm ? 'No meters found matching your search' : 'No meters available'}
                          </div>
                        )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
        
                  {/* Parameters */}
                  <div className="border border-gray-200 rounded-none bg-white p-2 flex flex-col flex-1 min-h-[500px] shadow-sm">
                    <div className="flex items-center justify-between mb-1 h-8">
                      <div className="font-semibold text-black flex items-center gap-1 text-sm">
                        <FileText className="w-3 h-3" />
                        <span className="text-sm">Parameters</span>
                      </div>
                      <Button
                        size="sm"
                        variant={allSelected ? "default" : "outline"}
                        className={`h-6 px-2 text-xs rounded-none ${
                          allSelected 
                            ? 'bg-primary text-white hover:bg-primary/90' 
                            : 'text-gray-500 border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={toggleSelectAll}
                      >
                        All
                      </Button>
                    </div>
                    <div className="text-xs">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-1">
                          {parameterList.slice(0, Math.ceil(parameterList.length / 2)).map(param => (
                            <ParamCheckbox 
                              key={param.id}
                              id={param.id} 
                              label={param.label}
                            />
                          ))}
                        </div>
                        
                        {/* Column 2 */}
                        <div className="flex flex-col gap-1">
                          {parameterList.slice(Math.ceil(parameterList.length / 2)).map(param => (
                            <ParamCheckbox 
                              key={param.id}
                              id={param.id} 
                              label={param.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Settings */}
                  <div className="border border-gray-200 rounded-none bg-white p-4 flex flex-col flex-1 min-h-[500px] shadow-sm">
                    <div className="font-semibold text-black mb-3 flex items-center gap-2 text-sm h-4">
                      <Upload className="w-3 h-3" />
                      <span className="text-sm">Export Manual</span>
                    </div>
                    <div className="space-y-2">
                      {/* From */}
                      <div>
                        <Label className="text-xs font-bold text-gray-700 mb-1 block">From</Label>
                        <div className="flex gap-2 items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-34 justify-start text-left font-normal text-xs h-7 bg-white border-gray-300 rounded-none px-2",
                                  !dateFrom && "text-muted-foreground"
                                )}
                              >
                                {dateFrom ? format(dateFrom, 'dd MMMM yyyy') : 'Select'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" style={{ minWidth: '280px' }}>
                              <Calendar
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {/* Replace TimeInput24 with regular input for now */}
                          <input
                            type="time"
                            value={timeFrom}
                            onChange={(e) => setTimeFrom(e.target.value)}
                            className="border rounded-none px-2 py-1 text-xs h-7 w-20 bg-white border-gray-300" 
                          />
                        </div>
                      </div>
                      {/* To */}
                      <div>
                        <Label className="text-xs font-bold text-gray-700 mb-1 block">To</Label>
                        <div className="flex gap-2 items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-34 justify-start text-left font-normal text-xs h-7 bg-white border-gray-300 rounded-none px-2",
                                  !dateTo && "text-muted-foreground"
                                )}
                              >
                                {dateTo ? format(dateTo, 'dd MMMM yyyy') : 'Select'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" style={{ minWidth: '280px' }}>
                              <Calendar
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {/* Replace TimeInput24 with regular input for now */}
                          <input
                            type="time"
                            value={timeTo} 
                            onChange={(e) => setTimeTo(e.target.value)} 
                            className="border rounded-none px-2 py-1 text-xs h-7 w-20 bg-white border-gray-300" 
                          />
                        </div>
                      </div>
                      
                      {/* Read Time */}
                      <div>
                        <Label className="text-xs font-semibold mb-1 block rounded-none">Read Time</Label>
                        <Select value={readTime} onValueChange={setReadTime}>
                          <SelectTrigger className="h-8 text-xs bg-white border-gray-300 rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1min" className="text-xs">1 Minute</SelectItem>
                            <SelectItem value="3min" className="text-xs">3 Minute</SelectItem>
                            <SelectItem value="5min" className="text-xs">5 Minute</SelectItem>
                            <SelectItem value="15min" className="text-xs">15 Minute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Export Type */}
                      <div>
                        <Label className="text-xs font-semibold mb-1 block rounded-none">Export Type</Label>
                        <div className="flex flex-col gap-1">
                          {[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'compare_pe', label: 'Compare PE' },
                            { value: 'tou_pe', label: 'TOU PE' },
                          ].map(opt => (
                            <div key={opt.value} className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-normal flex-1">
                                <input 
                                  type="radio" 
                                  name="exportType" 
                                  value={opt.value}
                                  checked={exportType === opt.value}
                                  onChange={() => {
                                    setExportType(opt.value);
                                    // Auto-select parameters for Daily, Weekly, Monthly - select all parameters
                                    if (opt.value === 'daily' || opt.value === 'weekly' || opt.value === 'monthly') {
                                      setSelectedParameters(parameterList.map(p => p.id));
                                    }
                                    // Auto-select parameters for Compare PE
                                    if (opt.value === 'compare_pe') {
                                      setSelectedParameters(['demand_w', 'demand_var', 'demand_va', 'import_kwh', 'export_kwh', 'import_kvarh', 'export_kvarh']);
                                    }
                                    // Auto-select parameters for TOU PE
                                    if (opt.value === 'tou_pe') {
                                      setSelectedParameters(['demand_w', 'demand_var', 'demand_va', 'import_kwh', 'export_kwh', 'import_kvarh', 'export_kvarh']);
                                    }
                                  }}
                                  className="accent-primary w-3 h-3 border border-gray-300 focus:ring-2 focus:ring-primary rounded-none"
                                />
                                <span>{opt.label}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Export Format */}
                      <div>
                        <Label className="text-xs font-semibold mb-1 block rounded-none">Export Format</Label>
                        <div className="flex gap-3 flex-wrap">
                          <label className="flex items-center gap-1 cursor-pointer text-xs font-normal">
                            <input 
                              type="radio" 
                              name="exportFormat" 
                              value="excel"
                              checked={exportFormat === 'excel'}
                              onChange={() => setExportFormat('excel')}
                              className="accent-primary w-3 h-3 border border-gray-300 focus:ring-2 focus:ring-primary rounded-none"
                            />
                            <span>Excel</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer text-xs font-normal">
                            <input 
                              type="radio" 
                              name="exportFormat" 
                              value="pdf"
                              checked={exportFormat === 'pdf'}
                              onChange={() => setExportFormat('pdf')}
                              className="accent-primary w-3 h-3 border border-gray-300 focus:ring-2 focus:ring-primary rounded-none"
                            />
                            <span>PDF</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer text-xs font-normal">
                            <input 
                              type="radio" 
                              name="exportFormat" 
                              value="email"
                              checked={exportFormat === 'email'}
                              onChange={() => setExportFormat('email')}
                              className="accent-primary w-3 h-3 border border-gray-300 focus:ring-2 focus:ring-primary rounded-none"
                            />
                            <span>Email</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer text-xs font-normal">
                            <input 
                              type="radio" 
                              name="exportFormat" 
                              value="line"
                              checked={exportFormat === 'line'}
                              onChange={() => setExportFormat('line')}
                              className="accent-primary w-3 h-3 border border-gray-300 focus:ring-2 focus:ring-primary rounded-none"
                            />
                            <span>Line</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Email/Line List Selection - shown when email or line format is selected */}
                      {(exportFormat === 'email' || exportFormat === 'line') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-semibold block rounded-none">
                              {exportFormat === 'email' ? 'Email Recipients' : 'Line Recipients'}
                            </Label>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setListType(listType === 'email' ? 'line' : 'email')}
                                  className={`text-xs px-3 py-1.5 transition-colors ${
                                    listType === 'email'
                                      ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                                      : 'text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'
                                  }`}
                                >
                                  {listType === 'email' 
                                    ? (exportFormat === 'email' ? 'Email List' : 'Line List')
                                    : 'Group List'
                                  }
                                </button>
                              </div>
                              
                              {/* Select All button */}
                              {(listType === 'email' || listType === 'line') && (
                                <button
                                  onClick={() => {
                                    if (listType === 'email') {
                                      const allSelected = emailListData.every(email => selectedEmailList.includes(email.id));
                                      if (allSelected) {
                                        setSelectedEmailList([]);
                                      } else {
                                        setSelectedEmailList(emailListData.map(email => email.id));
                                      }
                                    } else {
                                      // For line format
                                      if (exportFormat === 'line') {
                                        // Use different logic based on current display mode
                                        if (listType === 'line') {
                                          // Line Group mode - select all lines from all groups
                                          const groupedLines = getGroupedLines();
                                          const allGroupLines = Array.from(groupedLines.values()).flat();
                                          const allSelected = allGroupLines.every(line => selectedLineList.includes(line.id));
                                          if (allSelected) {
                                            setSelectedLineList([]);
                                          } else {
                                            setSelectedLineList(allGroupLines.map(line => line.id));
                                          }
                                        } else {
                                          // Line List mode - select all individual lines
                                          const allSelected = lineListData.every(line => selectedLineList.includes(line.id));
                                          if (allSelected) {
                                            setSelectedLineList([]);
                                          } else {
                                            setSelectedLineList(lineListData.map(line => line.id));
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  className={`text-xs px-3 py-1.5 transition-colors ${
                                    (listType === 'email' && exportFormat === 'email' && emailListData.every(email => selectedEmailList.includes(email.id))) ||
                                    (listType === 'line' && exportFormat === 'email' && (() => {
                                      const groupedEmails = getGroupedEmails();
                                      const allGroupEmails = Array.from(groupedEmails.values()).flat();
                                      return allGroupEmails.every(email => selectedEmailList.includes(email.id));
                                    })()) ||
                                    (listType === 'email' && exportFormat === 'line' && lineListData.every(line => selectedLineList.includes(line.id))) ||
                                    (listType === 'line' && exportFormat === 'line' && (() => {
                                      const groupedLines = getGroupedLines();
                                      const allGroupLines = Array.from(groupedLines.values()).flat();
                                      return allGroupLines.every(line => selectedLineList.includes(line.id));
                                    })())
                                      ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                                      : 'text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'
                                  }`}
                                >
                                  All
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto border border-gray-200 bg-gray-50">
                            {listType === 'email' && exportFormat === 'email' ? (
                              // Email List View - Show as flat list
                              <div className="space-y-1 p-2">
                                {emailListData.map(email => (
                                  <div key={email.id} className="flex items-center gap-2 bg-white p-2 border border-gray-100 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`email-${email.id}`}
                                      className="accent-primary border h-3 w-3 border-gray-300"
                                      checked={selectedEmailList.includes(email.id)}
                                      onChange={() => toggleEmailSelection(email.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label htmlFor={`email-${email.id}`} className="text-xs cursor-pointer block truncate font-medium">
                                        {email.displayName}
                                      </label>
                                      <span className="text-xs text-gray-500 block truncate">
                                        {email.email}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : listType === 'email' && exportFormat === 'line' ? (
                              // Line List View - Show as flat list with lineId and displayName
                              <div className="space-y-1 p-2">
                                {lineListData.map(line => (
                                  <div key={line.id} className="flex items-center gap-2 bg-white p-2 border border-gray-100 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`line-${line.id}`}
                                      className="accent-primary border h-3 w-3 border-gray-300"
                                      checked={selectedLineList.includes(line.id)}
                                      onChange={() => toggleLineSelection(line.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label htmlFor={`line-${line.id}`} className="text-xs cursor-pointer block truncate font-medium">
                                        {line.displayName}
                                      </label>
                                      <span className="text-xs text-gray-500 block truncate">
                                        Line ID: {line.lineId}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : listType === 'line' && exportFormat === 'email' ? (
                              // Show Email Groups when exportFormat is email and listType is line
                              <div className="space-y-1 p-2">
                                {Array.from(getGroupedEmails().entries()).map(([group, emails]) => (
                                  <div key={group} className="flex items-center gap-2 bg-white p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer"
                                       onClick={() => toggleEmailGroupSelection(group)}>
                                    <input
                                      type="checkbox"
                                      id={`email-group-${group}`}
                                      className="accent-primary border h-3 w-3 border-gray-300"
                                      checked={emails.every(email => selectedEmailList.includes(email.id))}
                                      onChange={() => toggleEmailGroupSelection(group)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label htmlFor={`email-group-${group}`} className="text-xs cursor-pointer block truncate font-medium">
                                        {group}
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : listType === 'line' && exportFormat === 'line' ? (
                              // Show Line Groups when exportFormat is line and listType is line
                              <div className="space-y-1 p-2">
                                {Array.from(getGroupedLines().entries()).map(([group, lines]) => (
                                  <div key={group} className="flex items-center gap-2 bg-white p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer"
                                       onClick={() => toggleLineGroupSelection(group)}>
                                    <input
                                      type="checkbox"
                                      id={`line-group-${group}`}
                                      className="accent-primary border h-3 w-3 border-gray-300"
                                      checked={lines.every(line => selectedLineList.includes(line.id))}
                                      onChange={() => toggleLineGroupSelection(group)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label htmlFor={`line-group-${group}`} className="text-xs cursor-pointer block truncate font-medium">
                                        {group}
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Show Line Groups when exportFormat is line and listType is line
                              <div className="space-y-1 p-2">
                                {Array.from(getGroupedLines().entries()).map(([group, lines]) => (
                                  <div key={group} className="flex items-center gap-2 bg-white p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer"
                                       onClick={() => toggleLineGroupSelection(group)}>
                                    <input
                                      type="checkbox"
                                      id={`line-group-${group}`}
                                      className="accent-primary border h-3 w-3 border-gray-300"
                                      checked={lines.every(line => selectedLineList.includes(line.id))}
                                      onChange={() => toggleLineGroupSelection(group)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <label htmlFor={`line-group-${group}`} className="text-xs cursor-pointer block truncate font-medium">
                                        {group}
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* File Path */}
                      <div>
                        <Label className="text-xs font-semibold mb-1 block rounded-none">
                          {(exportFormat === 'email' || exportFormat === 'line') 
                            ? (listType === 'email' ? (exportFormat === 'email' ? 'Email Recipients' : 'Line Recipients') : exportFormat === 'email' ? 'Email Groups' : 'Line Recipients') 
                            : 'File Path'}
                        </Label>
                        <div className="flex gap-1">
                          <Input 
                            value={
                              (exportFormat === 'email' || exportFormat === 'line')
                                ? (() => {
                                    if (exportFormat === 'email' && listType === 'email') {
                                      const selectedEmails = emailListData.filter(email => selectedEmailList.includes(email.id));
                                      return selectedEmails.length > 0 
                                        ? `Email will be sent to: ${selectedEmails.map(e => e.displayName).join(', ')}`
                                        : 'No email recipients selected';
                                    } else if (exportFormat === 'line' && listType === 'email') {
                                      const selectedLines = lineListData.filter(line => selectedLineList.includes(line.id));
                                      return selectedLines.length > 0 
                                        ? `Line will be sent to: ${selectedLines.map(l => `${l.displayName} (Line ID: ${l.lineId})`).join(', ')}`
                                        : 'No line recipients selected';
                                    } else if (exportFormat === 'email' && listType === 'line') {
                                      const groupedEmails = getGroupedEmails();
                                      const selectedGroups = Array.from(groupedEmails.entries())
                                        .filter(([group, emails]) => emails.every(email => selectedEmailList.includes(email.id)))
                                        .map(([group]) => group);
                                      return selectedGroups.length > 0 
                                        ? `Email groups: ${selectedGroups.join(', ')}`
                                        : 'No email groups selected';
                                    } else if (exportFormat === 'line' && listType === 'line') {
                                      const groupedLines = getGroupedLines();
                                      const selectedGroups = Array.from(groupedLines.entries())
                                        .filter(([group, lines]) => lines.every(line => selectedLineList.includes(line.id)))
                                        .map(([group]) => group);
                                      return selectedGroups.length > 0 
                                        ? `Line groups: ${selectedGroups.join(', ')}`
                                        : 'No line groups selected';
                                    }
                                    return 'Enter file path...';
                                  })()
                                : filePath
                            }
                            onChange={(e) => setFilePath(e.target.value)}
                            className="text-xs h-8 bg-white border-gray-300 rounded-none flex-1"
                            disabled={exportFormat === 'email' || exportFormat === 'line'}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2 text-xs rounded-none border-gray-300 bg-white hover:bg-primary flex items-center justify-center"
                            onClick={handleBrowseFile}
                            disabled={exportFormat === 'email' || exportFormat === 'line'}
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Export Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 h-8 text-xs rounded-none shadow"
                          onClick={handleExport}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {Object.values(autoExportSettings).some(setting => setting.enabled) ? 'Schedule Export' : 'Export'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full h-8 text-xs rounded-none border-gray-300 bg-white"
                          onClick={handleClear}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Auto Export Card */}
                  <div className="border border-gray-200 rounded-none bg-white p-4 flex flex-col flex-1 min-h-[500px] shadow-sm">
                    <div className="font-semibold text-black mb-3 flex items-center gap-2 text-sm h-4">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">Export Auto</span>
                      <button
                        onClick={() => setShowConfiguredSchedules(!showConfiguredSchedules)}
                        className="ml-auto p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-none"
                        title={showConfiguredSchedules ? "Hide Configured Schedules" : "Show Configured Schedules"}
                      >
                        <Menu className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-4 text-xs">
                      {/* Auto Export Configuration */}
                      {/* Frequency Selection */}
                      <div className="flex gap-4 mb-3">
                        <div className="flex-[2]">
                          <Label className="text-xs font-semibold mb-1 block">Export Type</Label>
                          <Select value={autoExportFrequency} onValueChange={setAutoExportFrequency}>
                            <SelectTrigger className="h-8 text-xs bg-white border-gray-300 rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                              <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                              <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1">
                          <Label className="text-xs font-semibold mb-1 block">Time</Label>
                          {/* Replace TimeInput24 with regular input for now */}
                          <input
                            type="time"
                            value={autoExportTime}
                            onChange={(e) => setAutoExportTime(e.target.value)}
                            className="w-full border rounded-none px-2 py-1 text-xs h-8 bg-white border-gray-300"
                          />
                        </div>
                      </div>

                      {/* Day Selection for Weekly */}
                      {autoExportFrequency === 'weekly' && (
                        <div className="mb-3">
                          <Label className="text-xs font-semibold mb-1 block">Day of Week</Label>
                          <Select value={autoExportDay} onValueChange={setAutoExportDay}>
                            <SelectTrigger className="h-8 text-xs bg-white border-gray-300 rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday" className="text-xs">Monday</SelectItem>
                              <SelectItem value="tuesday" className="text-xs">Tuesday</SelectItem>
                              <SelectItem value="wednesday" className="text-xs">Wednesday</SelectItem>
                              <SelectItem value="thursday" className="text-xs">Thursday</SelectItem>
                              <SelectItem value="friday" className="text-xs">Friday</SelectItem>
                              <SelectItem value="saturday" className="text-xs">Saturday</SelectItem>
                              <SelectItem value="sunday" className="text-xs">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Date Selection for Monthly */}
                      {autoExportFrequency === 'monthly' && (
                        <div className="mb-3">
                          <Label className="text-xs font-semibold mb-1 block">Day of Month</Label>
                          <Select value={autoExportDate.toString()} onValueChange={(value) => setAutoExportDate(parseInt(value))}>
                            <SelectTrigger className="h-8 text-xs bg-white border-gray-300 rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <SelectItem key={day} value={day.toString()} className="text-xs">
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Add Schedule Button */}
                      <Button
                        type="button"
                        className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 rounded-none"
                        onClick={handleAddAutoExport}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Add Schedule
                      </Button>
                    </div>

                    {/* Existing Schedules */}
                    {autoExportSchedules.length > 0 && showConfiguredSchedules && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold block">Export List ({autoExportSchedules.length})</Label>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {autoExportSchedules.map((schedule, index) => {
                            const displayInfo = getScheduleDisplayInfo(schedule);
                            return (
                              <div key={schedule.id} className="border border-gray-200 bg-white text-xs rounded-none">
                                {/* Schedule Header */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 font-medium min-w-[16px] text-center">
                                        {index + 1}.
                                      </span>
                                      <div className="font-medium text-gray-800">{displayInfo.firstLine}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => toggleSchedule(schedule.id)}
                                      className={`px-2 py-1 text-xs rounded-none flex items-center gap-1 ${
                                        schedule.enabled 
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                      title={schedule.enabled ? 'Disable Schedule' : 'Enable Schedule'}
                                    >
                                      <Power className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => showScheduleDetail(schedule)}
                                      className="px-2 py-1 text-xs bg-primary text-white rounded-none hover:bg-primary/90 flex items-center gap-1"
                                      title="View Details"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => removeSchedule(schedule.id)}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-none hover:bg-red-200 flex items-center gap-1"
                                      title="Delete Schedule"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {autoExportSchedules.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <div className="text-xs">No auto export schedules configured</div>
                        <div className="text-xs mt-1">Enable auto export to create your first schedule</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && selectedScheduleDetail && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Schedule Details</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Schedule Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Created by</Label>
                  <div className="text-sm text-gray-800">{selectedScheduleDetail.createdBy}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Status</Label>
                  <div className={`text-sm font-medium ${
                    selectedScheduleDetail.enabled ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {selectedScheduleDetail.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Frequency</Label>
                  <div className="text-sm text-gray-800">{getFrequencyText(selectedScheduleDetail)}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Created Date</Label>
                  <div className="text-sm text-gray-800">{selectedScheduleDetail.created}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Export Type</Label>
                  <div className="text-sm text-gray-800 capitalize">{selectedScheduleDetail.exportType}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Export Format</Label>
                  <div className="text-sm text-gray-800 uppercase">{selectedScheduleDetail.exportFormat}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-1">Read Time</Label>
                  <div className="text-sm text-gray-800">{selectedScheduleDetail.readTime}</div>
                </div>
              </div>

              {/* File Path */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 block mb-1">File Path</Label>
                <div className="text-sm text-gray-800 bg-gray-50 p-2 border border-gray-200 break-all">
                  {selectedScheduleDetail.filePath}
                </div>
              </div>

              {/* Selected Meters */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 block mb-2">
                  Selected Meters ({selectedScheduleDetail.meters?.length || 0})
                </Label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 bg-gray-50">
                  {selectedScheduleDetail.meters?.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {selectedScheduleDetail.meters.map(meterId => {
                        const meter = meterList.find(m => m.id === meterId);
                        return (
                          <div key={meterId} className="flex items-center justify-between bg-white p-2 border border-gray-100">
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {meter?.name || meterId}
                              </div>
                              <div className="text-xs text-gray-500">
                                {meter?.location || 'Unknown location'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No meters selected
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Email/Line Recipients */}
              {(selectedScheduleDetail.emailList?.length > 0 || selectedScheduleDetail.lineList?.length > 0) && (
                <div>
                  <Label className="text-sm font-semibold text-gray-600 block mb-2">
                    {selectedScheduleDetail.emailList?.length > 0 ? 'Selected Email Recipients' : 'Selected Line Recipients'} 
                    ({selectedScheduleDetail.emailList?.length || selectedScheduleDetail.lineList?.length || 0})
                  </Label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 bg-gray-50">
                    {selectedScheduleDetail.emailList?.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {selectedScheduleDetail.emailList.map(emailId => {
                          const email = emailListData.find(e => e.id === emailId);
                          return (
                            <div key={emailId} className="flex items-center justify-between bg-white p-2 border border-gray-100">
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {email?.displayName || emailId}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {email?.email || 'Unknown email'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedScheduleDetail.lineList?.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {selectedScheduleDetail.lineList.map(lineId => {
                          const line = lineListData.find(l => l.id === lineId);
                          return (
                            <div key={lineId} className="flex items-center justify-between bg-white p-2 border border-gray-100">
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {line?.displayName || lineId}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Line ID: {line?.lineId || 'Unknown line ID'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No recipients selected
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Parameters */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 block mb-2">
                  Selected Parameters ({selectedScheduleDetail.parameters?.length || 0})
                </Label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 bg-gray-50">
                  {selectedScheduleDetail.parameters?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {selectedScheduleDetail.parameters.map(paramId => {
                        const param = parameterList.find(p => p.id === paramId);
                        return (
                          <div key={paramId} className="bg-white p-2 border border-gray-100 text-sm">
                            {param?.label || paramId}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No parameters selected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
