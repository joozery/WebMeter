import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon,
  Settings,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Info,
  AlertCircle,
  Search as SearchIcon,
  Edit
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { holidayService, type Holiday } from '@/services/holidayService';
import { ftConfigService, type FTConfig } from '@/services/ftConfigService';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ThaiHoliday {
  id?: number;
  date: Date;
  name: string;
  nameEn: string;
  type: 'national' | 'religious' | 'observance';
  category: 'special' | 'annual';
  isWeekend: boolean;
}

interface LocalFTConfig {
  id: string;
  name: string;
  value: number;
  unit: string;
  description: string;
  startMonth: string;
  endMonth: string;
  startDay: number;
  endDay: number;
}

// Convert database holiday to ThaiHoliday format
const convertHolidayToThaiHoliday = (holiday: Holiday): ThaiHoliday => {
  const date = new Date(holiday.date);
  return {
    id: holiday.id,
    date: date,
    name: holiday.name_holiday,
    nameEn: holiday.name_holiday, // Use same name for both Thai and English
    type: 'national', // Default type since we removed it from database
    category: holiday.category,
    isWeekend: date.getDay() === 0 || date.getDay() === 6
  };
};

const defaultFTConfigs: LocalFTConfig[] = [
  {
    id: 'ft1',
    name: 'FT Rate 1',
    value: 0.0,
    unit: 'Baht/Unit',
    description: 'อัตราค่าไฟฟ้าฐาน',
    startMonth: 'Jan',
    endMonth: 'Dec',
    startDay: 1,
    endDay: 31
  },
  {
    id: 'ft2',
    name: 'FT Rate 2',
    value: 0.0,
    unit: 'Baht/Unit',
    description: 'อัตราค่าไฟฟ้าปรับ',
    startMonth: 'Jan',
    endMonth: 'Dec',
    startDay: 1,
    endDay: 31
  },
  {
    id: 'ft3',
    name: 'FT Rate 3',
    value: 0.0,
    unit: 'Baht/Unit',
    description: 'อัตราค่าไฟฟ้าเพิ่มเติม',
    startMonth: 'Jan',
    endMonth: 'Dec',
    startDay: 1,
    endDay: 31
  }
];

export default function Holiday() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'special' | 'annual'>('all');
  const [ftYear, setFtYear] = useState(new Date().getFullYear());
  const [ftConfigs, setFtConfigs] = useState<FTConfig[]>([]);

  const [loadingFT, setLoadingFT] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customHolidays, setCustomHolidays] = useState<ThaiHoliday[]>([]);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [showSetFT, setShowSetFT] = useState(false);
  const [activeTab, setActiveTab] = useState('holiday');
  const [holidays, setHolidays] = useState<ThaiHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayDate, setDisplayDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [selectedHolidayForEdit, setSelectedHolidayForEdit] = useState<ThaiHoliday | null>(null);
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editHoliday, setEditHoliday] = useState({
    name: '',
    nameEn: '',
    date: new Date(),
    type: 'observance' as 'observance' | 'national' | 'religious',
    category: 'special' as 'special' | 'annual'
  });
  const [editSelectedDate, setEditSelectedDate] = useState<Date>(new Date());
  const [editDisplayDate, setEditDisplayDate] = useState<string>('');
  const [editCurrentDate, setEditCurrentDate] = useState<string>('');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    nameEn: '',
    date: new Date(),
    type: 'observance' as const,
    category: 'special' as 'special' | 'annual'
  });
  const [newFTConfig, setNewFTConfig] = useState({
    startDate: new Date(),
    endDate: new Date(),
    value: 0.0,
    unit: 'Baht/Unit',
    name: '',
    description: ''
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
  const [displayStartDate, setDisplayStartDate] = useState<string>('');
  const [displayEndDate, setDisplayEndDate] = useState<string>('');
  const [addingFTConfig, setAddingFTConfig] = useState(false);

  
  // Edit FT states
  const [selectedFTForEdit, setSelectedFTForEdit] = useState<FTConfig | null>(null);

  // Fetch holidays from database
  const fetchHolidays = async (year: number) => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidaysByYear(year);
      if (response.success) {
        const convertedHolidays = response.data.map(convertHolidayToThaiHoliday);
        setHolidays(convertedHolidays);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load holidays when year changes
  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  // Fetch FT configurations from database
  const fetchFTConfigs = async (year: number) => {
    try {
      setLoadingFT(true);
      const response = await ftConfigService.getFTConfigsByYear(year);
      if (response.success) {
        setFtConfigs(response.data);
      }
    } catch (error) {
      console.error('Error fetching FT configurations:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล FT' : 'Error loading FT data',
        variant: 'destructive',
      });
    } finally {
      setLoadingFT(false);
    }
  };

  // Load FT configurations when year changes
  useEffect(() => {
    fetchFTConfigs(ftYear);
  }, [ftYear]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      console.log('Click outside detected, target:', target);
      console.log('showStartDatePicker:', showStartDatePicker);
      console.log('closest .date-picker-container:', target.closest('.date-picker-container'));
      
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
      if (showStartDatePicker && !target.closest('.date-picker-container')) {
        console.log('Closing showStartDatePicker due to click outside');
        setShowStartDatePicker(false);
      }
      if (showEndDatePicker && !target.closest('.date-picker-container')) {
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showStartDatePicker, showEndDatePicker]);

  // Debug selectedDate changes
  useEffect(() => {
    console.log('selectedDate changed to:', selectedDate);
  }, [selectedDate]);

  // Initialize displayDate
  useEffect(() => {
    if (!displayDate) {
      const initialDate = `${selectedDate.getDate()} ${selectedDate.toLocaleDateString('en-US', { month: 'long' })} ${selectedDate.getFullYear()}`;
      setDisplayDate(initialDate);
      setCurrentDate(initialDate);
    }
  }, []);

  // Update displayDate when selectedDate changes
  useEffect(() => {
    const newDisplayDate = `${selectedDate.getDate()} ${selectedDate.toLocaleDateString('en-US', { month: 'long' })} ${selectedDate.getFullYear()}`;
    console.log('Updating displayDate to:', newDisplayDate);
    setDisplayDate(newDisplayDate);
  }, [selectedDate]);



  // Initialize and update displayStartDate and displayEndDate
  useEffect(() => {
    console.log('selectedStartDate changed to:', selectedStartDate);
    const initialStartDate = `${selectedStartDate.getDate()} ${selectedStartDate.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { month: 'long' })} ${selectedStartDate.getFullYear()}`;
    console.log('Setting displayStartDate to:', initialStartDate);
    setDisplayStartDate(initialStartDate);
  }, [selectedStartDate, language]);

  // Debug showStartDatePicker changes
  useEffect(() => {
    console.log('showStartDatePicker changed to:', showStartDatePicker);
  }, [showStartDatePicker]);

  useEffect(() => {
    console.log('selectedEndDate changed to:', selectedEndDate);
    const initialEndDate = `${selectedEndDate.getDate()} ${selectedEndDate.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { month: 'long' })} ${selectedEndDate.getFullYear()}`;
    console.log('Setting displayEndDate to:', initialEndDate);
    setDisplayEndDate(initialEndDate);
  }, [selectedEndDate, language]);

  const allHolidays = [...holidays, ...customHolidays];
  const currentYearHolidays = allHolidays.filter(h => 
    h.date.getFullYear() === selectedYear && 
    (selectedCategory === 'all' || h.category === selectedCategory)
  );

  const getHolidayTypeColor = (type: string) => {
    // Since we removed type from database, use default color
        return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getHolidayCategoryColor = (category: string) => {
    switch (category) {
      case 'special':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'annual':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFTChange = (id: string, field: keyof FTConfig, value: string | number) => {
    setFtConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
  };

  const addNewFTConfig = async () => {
    try {
      setAddingFTConfig(true);
      
      // Get selected dates from the form
      const startDate = selectedStartDate || new Date();
      const endDate = selectedEndDate || new Date();
      
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      
      const ftConfigData = {
        year: ftYear,
      name: `FT Rate ${ftConfigs.length + 1}`,
        value: newFTConfig.value,
        unit: 'Baht/Unit',
        description: `FT Rate for ${startMonth} ${startDay} - ${endMonth} ${endDay}`,
        start_month: startMonth,
        end_month: endMonth,
        start_day: startDay,
        end_day: endDay,
        is_active: false,
        created_by: 'user'
      };
      
      const response = await ftConfigService.createFTConfig(ftConfigData);
      
      if (response && response.success) {
        // Refresh FT configurations from database
        await fetchFTConfigs(ftYear);
        
        // Reset form
        setNewFTConfig({
          startDate: new Date(),
          endDate: new Date(),
      value: 0.0,
      unit: 'Baht/Unit',
          name: '',
          description: ''
        });
        setSelectedStartDate(new Date());
        setSelectedEndDate(new Date());
        setDisplayStartDate('');
        setDisplayEndDate('');
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowSetFT(false);
        
        // Show success message
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'เพิ่ม FT Rate สำเร็จ' : 'FT Rate added successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการเพิ่ม FT Rate' : 'Error adding FT Rate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding FT config:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการเพิ่ม FT Rate' : 'Error adding FT Rate',
        variant: 'destructive',
      });
    } finally {
      setAddingFTConfig(false);
    }
  };

  const removeFTConfig = async (id: number) => {
    try {
      const response = await ftConfigService.deleteFTConfig(id);
      if (response.success) {
        await fetchFTConfigs(ftYear);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'ลบ FT Rate สำเร็จ' : 'FT Rate deleted successfully',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error removing FT config:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการลบ FT Rate' : 'Error deleting FT Rate',
        variant: 'destructive',
      });
    }
  };

  const saveFTConfig = () => {
    setIsEditing(false);
    toast({
      title: language === 'TH' ? 'สำเร็จ' : 'Success',
      description: language === 'TH' ? 'บันทึกการแก้ไขสำเร็จ' : 'Edit mode saved successfully',
      variant: 'default',
    });
  };

  const resetFTConfig = () => {
    setIsEditing(false);
    fetchFTConfigs(ftYear);
    toast({
      title: language === 'TH' ? 'สำเร็จ' : 'Success',
      description: language === 'TH' ? 'รีเซ็ตการแก้ไขสำเร็จ' : 'Reset successful',
      variant: 'default',
    });
  };

  const handleToggleFTActive = async (ftConfig: FTConfig) => {
    try {
      console.log('Toggle FT active clicked:', ftConfig);
      
      if (!ftConfig.id) {
        console.log('FT config has no ID');
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'ไม่พบข้อมูล FT ที่ต้องการแก้ไข' : 'FT config not found',
          variant: 'destructive',
        });
        return;
      }

      // If this FT config is already active, deactivate it
      if (ftConfig.is_active) {
        // Deactivate in database
        const deactivateResponse = await ftConfigService.updateFTConfig(ftConfig.id, {
          is_active: false,
          updated_by: 'user'
        });
        
        if (deactivateResponse.success) {
          await fetchFTConfigs(ftYear);
          toast({
            title: language === 'TH' ? 'สำเร็จ' : 'Success',
            description: language === 'TH' ? 'ยกเลิกการใช้งาน FT สำเร็จ' : 'FT deactivated successfully',
            variant: 'default',
          });
        } else {
          toast({
            title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
            description: language === 'TH' ? 'เกิดข้อผิดพลาดในการยกเลิกการใช้งาน' : 'Error deactivating FT',
            variant: 'destructive',
          });
        }
        return;
      }

      // First, deactivate all other FT configs
      for (const config of ftConfigs) {
        if (config.id !== ftConfig.id) {
          await ftConfigService.updateFTConfig(config.id, {
            is_active: false,
            updated_by: 'user'
          });
        }
      }

      // Then activate this FT config
      const activateResponse = await ftConfigService.updateFTConfig(ftConfig.id, {
        is_active: true,
        updated_by: 'user'
      });
      
      if (activateResponse.success) {

        await fetchFTConfigs(ftYear);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'ตั้งค่า FT เป็นใช้งานสำเร็จ' : 'FT activated successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการตั้งค่าการใช้งาน' : 'Error activating FT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling FT active status:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' : 'Error updating status',
        variant: 'destructive',
      });
    }
  };

  const handleEditFT = (ftConfig: FTConfig) => {
    console.log('Edit FT clicked:', ftConfig);
    
    if (!ftConfig.id) {
      console.log('FT config has no ID');
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'ไม่พบข้อมูล FT ที่ต้องการแก้ไข' : 'FT config not found',
        variant: 'destructive',
      });
      return;
    }
    
    // Set the data for Set FT Dialog
    setSelectedFTForEdit(ftConfig);
    
    // Convert start date
    const startDate = new Date(ftConfig.year, getMonthIndex(ftConfig.start_month), ftConfig.start_day);
    setSelectedStartDate(startDate);
    setDisplayStartDate(`${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getFullYear()}`);
    
    // Convert end date
    const endDate = new Date(ftConfig.year, getMonthIndex(ftConfig.end_month), ftConfig.end_day);
    setSelectedEndDate(endDate);
    setDisplayEndDate(`${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'long' })} ${endDate.getFullYear()}`);
    
    // Set FT rate value
    setNewFTConfig({
      ...newFTConfig,
      value: ftConfig.value
    });
    
    setShowSetFT(true);
  };

  // Helper function to convert month name to index
  const getMonthIndex = (monthName: string): number => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthName);
  };

  const handleUpdateFTFromDialog = async () => {
    try {
      setAddingFTConfig(true);
      
      if (!selectedFTForEdit || !selectedFTForEdit.id) {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'ไม่พบข้อมูล FT ที่ต้องการแก้ไข' : 'FT config not found',
          variant: 'destructive',
        });
        return;
      }

      // Get selected dates from the form
      const startDate = selectedStartDate || new Date();
      const endDate = selectedEndDate || new Date();
      
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      
      // Prepare updated FT data
      const updatedFTData = {
        name: `FT Rate ${startDay} ${startMonth} - ${endDay} ${endMonth}`,
        value: newFTConfig.value,
        unit: 'Baht/Unit',
        description: `FT Rate for ${startMonth} ${startDay} - ${endMonth} ${endDay}`,
        start_month: startMonth,
        end_month: endMonth,
        start_day: startDay,
        end_day: endDay,
        updated_by: 'user'
      };

      console.log('Updating FT config with ID:', selectedFTForEdit.id);
      console.log('Updated FT data:', updatedFTData);

      const updateResponse = await ftConfigService.updateFTConfig(selectedFTForEdit.id, updatedFTData);
      
      console.log('Update response:', updateResponse);
      
      if (updateResponse.success) {
        await fetchFTConfigs(ftYear);
        setShowSetFT(false);
        setSelectedFTForEdit(null);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'แก้ไข FT Rate สำเร็จ' : 'FT Rate updated successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการแก้ไข FT Rate' : 'Error updating FT Rate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating FT config:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการแก้ไข FT Rate' : 'Error updating FT Rate',
        variant: 'destructive',
      });
    } finally {
      setAddingFTConfig(false);
    }
  };

  const handleDeleteFT = async (ftConfig: FTConfig) => {
    try {
      console.log('Delete FT clicked:', ftConfig);
      
      if (!ftConfig.id) {
        console.log('FT config has no ID');
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'ไม่พบข้อมูล FT ที่ต้องการลบ' : 'FT config not found',
          variant: 'destructive',
        });
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        language === 'TH' 
          ? `คุณต้องการลบ FT Rate "${ftConfig.name}" ใช่หรือไม่?` 
          : `Are you sure you want to delete FT Rate "${ftConfig.name}"?`
      );

      if (!confirmed) {
        return;
      }

      const deleteResponse = await ftConfigService.deleteFTConfig(ftConfig.id);
      
      if (deleteResponse.success) {
        await fetchFTConfigs(ftYear);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'ลบ FT สำเร็จ' : 'FT deleted successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการลบ FT' : 'Error deleting FT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting FT:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการลบ FT' : 'Error deleting FT',
        variant: 'destructive',
      });
    }
  };





  const handleDateClick = () => {
    console.log('Date field clicked, current selectedDate:', selectedDate);
    setShowDatePicker(true);
  };

  const handleEditDateClick = () => {
    console.log('Edit date field clicked, current editSelectedDate:', editSelectedDate);
    setShowEditDatePicker(true);
  };

  const handleEditCalendarSelect = (date: Date | undefined) => {
    console.log('Edit calendar onSelect called with:', date);
    if (date) {
      console.log('Edit date selected:', date);
      const newDisplayDate = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      console.log('New edit display date:', newDisplayDate);
      setEditSelectedDate(date);
      setEditHoliday(prev => ({...prev, date: date}));
      setEditCurrentDate(newDisplayDate);
      setShowEditDatePicker(false);
    }
  };

  const handleEditHoliday = (holiday: ThaiHoliday) => {
    console.log('Edit holiday clicked:', holiday);
    
    if (!holiday.id) {
      console.log('Holiday has no ID');
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'ไม่พบข้อมูลวันหยุดที่ต้องการแก้ไข' : 'Holiday not found',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedHolidayId(holiday.id);
    setSelectedHolidayForEdit(holiday);
    setEditHoliday({
      name: holiday.name,
      nameEn: holiday.nameEn,
      date: holiday.date,
      type: holiday.type,
      category: holiday.category
    });
    setEditSelectedDate(holiday.date);
    const editDateString = `${holiday.date.getDate()} ${holiday.date.toLocaleDateString('en-US', { month: 'long' })} ${holiday.date.getFullYear()}`;
    setEditDisplayDate(editDateString);
    setEditCurrentDate(editDateString);
    setShowEditDialog(true);
  };

  const handleUpdateHoliday = async () => {
    try {
      setEditingHoliday(true);
      
      // Validate required fields
      if (!editHoliday.name.trim()) {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'กรุณากรอกชื่อวันหยุด' : 'Please enter holiday name',
          variant: 'destructive',
        });
        return;
      }

      if (!selectedHolidayForEdit || !selectedHolidayId) {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'ไม่พบข้อมูลวันหยุดที่ต้องการแก้ไข' : 'Holiday not found',
          variant: 'destructive',
        });
        return;
      }

      console.log('Updating holiday with ID:', selectedHolidayId);
      
      // Prepare updated holiday data
      const updatedHolidayData = {
        date: editHoliday.date.toISOString().split('T')[0],
        name_holiday: editHoliday.name.trim(),
        category: editHoliday.category,
      };

      console.log('Updated holiday data:', updatedHolidayData);

      const updateResponse = await holidayService.updateHoliday(selectedHolidayId, updatedHolidayData);
      
      console.log('Update response:', updateResponse);
      
      if (updateResponse.success) {
        await fetchHolidays(selectedYear);
        setShowEditDialog(false);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'แก้ไขวันหยุดสำเร็จ' : 'Holiday updated successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการแก้ไขวันหยุด' : 'Error updating holiday',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการแก้ไขวันหยุด' : 'Error updating holiday',
        variant: 'destructive',
      });
    } finally {
      setEditingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (holiday: ThaiHoliday) => {
    try {
      console.log('Delete holiday clicked:', holiday);
      
      if (!holiday.id) {
        console.log('Holiday has no ID');
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'ไม่พบข้อมูลวันหยุดที่ต้องการลบ' : 'Holiday not found',
          variant: 'destructive',
        });
        return;
      }

      // Confirm deletion
      const confirmDelete = window.confirm(
        language === 'TH' 
          ? `คุณต้องการลบวันหยุด "${holiday.name}" ใช่หรือไม่?` 
          : `Are you sure you want to delete "${holiday.name}"?`
      );

      if (!confirmDelete) {
        return;
      }

      console.log('Deleting holiday with ID:', holiday.id);
      
      const deleteResponse = await holidayService.deleteHoliday(holiday.id);
      
      console.log('Delete response:', deleteResponse);
      
      if (deleteResponse.success) {
        await fetchHolidays(selectedYear);
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'ลบวันหยุดสำเร็จ' : 'Holiday deleted successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการลบวันหยุด' : 'Error deleting holiday',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการลบวันหยุด' : 'Error deleting holiday',
        variant: 'destructive',
      });
    }
  };

  const addCustomHoliday = async () => {
    try {
      setAddingHoliday(true);
      
      // Validate required fields
      if (!newHoliday.name.trim()) {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'กรุณากรอกชื่อวันหยุด' : 'Please enter holiday name',
          variant: 'destructive',
        });
        return;
      }

      // Prepare holiday data for database
      const holidayData = {
        date: newHoliday.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        name_holiday: newHoliday.name.trim(),
        category: newHoliday.category,
        created_by: 'user' // You can get this from user context
      };

      // Save to database
      const response = await holidayService.createHoliday(holidayData);
      
      if (response.success) {
        // Refresh holidays list
        await fetchHolidays(selectedYear);
        
        // Reset form
    setNewHoliday({
      name: '',
      nameEn: '',
      date: new Date(),
      type: 'observance',
      category: 'special'
    });
        setSelectedDate(new Date());
        setDisplayDate('');
        setCurrentDate('');
    setShowAddHoliday(false);
        setShowDatePicker(false);
        
        // Show success message
        toast({
          title: language === 'TH' ? 'สำเร็จ' : 'Success',
          description: language === 'TH' ? 'เพิ่มวันหยุดสำเร็จ' : 'Holiday added successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
          description: language === 'TH' ? 'เกิดข้อผิดพลาดในการเพิ่มวันหยุด' : 'Error adding holiday',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: language === 'TH' ? 'ข้อผิดพลาด' : 'Error',
        description: language === 'TH' ? 'เกิดข้อผิดพลาดในการเพิ่มวันหยุด' : 'Error adding holiday',
        variant: 'destructive',
      });
    } finally {
      setAddingHoliday(false);
    }
  };

  const removeCustomHoliday = (index: number) => {
    setCustomHolidays(customHolidays.filter((_, i) => i !== index));
  };



  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-full mx-auto">
          {/* Main Content */}
          <div className="bg-white rounded-none shadow-sm">
            {/* Holiday Management Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold text-gray-900">
                  {language === 'TH' ? 'จัดการวันหยุดและตั้งค่า FT' : 'Holiday & FT'}
                </h1>
              </div>
            </div>

            <Tabs defaultValue="holiday" className="w-full" onValueChange={setActiveTab}>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 px-0 pt-0">
                <TabsList className="h-10 p-1 bg-gray-100 rounded-none">
                  <TabsTrigger 
                    value="holiday" 
                    className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-none"
                  >
                    {language === 'TH' ? 'รายการวันหยุด' : 'Holiday'}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ft" 
                    className="text-xs h-8 px-4 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-none"
                  >
                    {language === 'TH' ? 'ตั้งค่า FT' : 'FT'}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Holiday Tab */}
              <TabsContent value="holiday" className="p-6 space-y-4">
                <div className="space-y-4">
                  {/* Action Bar - Year Selector and Add Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label className="text-lg font-medium text-primary whitespace-nowrap">
                        {language === 'TH' ? 'ปี': 'Year'}
                      </Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-20 text-sm border-0 focus:ring-0 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => 2023 + i).map(year => (
                            <SelectItem key={year} value={year.toString()} className="text-sm">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      onClick={() => setShowAddHoliday(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white text-xs h-8 rounded-none"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {language === 'TH' ? 'เพิ่มวันหยุด' : 'Add Holiday'}
                    </Button>
                  </div>

                                    {/* Holiday List - Two Columns Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Annual Holidays Column */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-blue-600">
                          {language === 'TH' ? 'วันหยุดประจำปี' : 'Annual Holidays'} ({allHolidays.filter(h => h.date.getFullYear() === selectedYear && h.category === 'annual').length})
                        </h3>
                      </div>
                      <ScrollArea className="h-96">
                        <div className="space-y-1">
                          {loading ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="text-sm text-gray-500">กำลังโหลด...</div>
                            </div>
                          ) : currentYearHolidays
                            .filter(holiday => holiday.category === 'annual')
                            .map((holiday, index) => (
                              <ContextMenu key={index}>
                                <ContextMenuTrigger asChild>
                                  <div className="flex items-center justify-between p-2 rounded-none border bg-card hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center space-x-2">
                                      <div className="text-xs font-medium text-blue-600">
                                    {holiday.date.getDate()} {holiday.date.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { 
                                      month: 'short' 
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {holiday.name}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {customHolidays.includes(holiday) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomHoliday(customHolidays.indexOf(holiday))}
                                      className="text-destructive hover:text-destructive p-1 h-6 w-6"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => handleEditHoliday(holiday)}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    {language === 'TH' ? 'แก้ไข' : 'Edit'}
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => handleDeleteHoliday(holiday)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {language === 'TH' ? 'ลบ' : 'Delete'}
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Special Holidays Column */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-amber-600">
                          {language === 'TH' ? 'วันหยุดไม่ประจำปี' : 'Special Holidays'} ({allHolidays.filter(h => h.date.getFullYear() === selectedYear && h.category === 'special').length})
                        </h3>
                      </div>
                      <ScrollArea className="h-96">
                        <div className="space-y-1">
                          {loading ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="text-sm text-gray-500">กำลังโหลด...</div>
                            </div>
                          ) : currentYearHolidays
                            .filter(holiday => holiday.category === 'special')
                            .map((holiday, index) => (
                              <ContextMenu key={index}>
                                <ContextMenuTrigger asChild>
                                  <div className="flex items-center justify-between p-2 rounded-none border bg-card hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center space-x-2">
                                      <div className="text-xs font-medium text-amber-600">
                                    {holiday.date.getDate()} {holiday.date.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { 
                                      month: 'short' 
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {holiday.name}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {customHolidays.includes(holiday) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomHoliday(customHolidays.indexOf(holiday))}
                                      className="text-destructive hover:text-destructive p-1 h-6 w-6"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => handleEditHoliday(holiday)}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    {language === 'TH' ? 'แก้ไข' : 'Edit'}
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => handleDeleteHoliday(holiday)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {language === 'TH' ? 'ลบ' : 'Delete'}
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* FT Configuration Tab */}
              <TabsContent value="ft" className="p-6 space-y-4">
                <div className="space-y-4">
                  {/* Action Bar - Year Selector and Set FT Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label className="text-lg font-medium text-primary whitespace-nowrap">
                        {language === 'TH' ? 'ปี': 'Year'}
                      </Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-20 text-sm border-0 focus:ring-0 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => 2023 + i).map(year => (
                            <SelectItem key={year} value={year.toString()} className="text-sm">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => setShowSetFT(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white text-xs h-8 rounded-none"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Set FT
                    </Button>
                  </div>

                  {/* FT Rate List */}
                  <ScrollArea className="h-96">
                    {loadingFT ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-sm text-gray-500">Loading FT configurations...</div>
                      </div>
                    ) : ftConfigs.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-sm text-gray-500">
                          {language === 'TH' ? 'ไม่มีข้อมูล FT สำหรับปีที่เลือก' : 'No FT data for selected year'}
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-2">
                      {ftConfigs.map((config, index) => (
                        <ContextMenu key={config.id}>
                          <ContextMenuTrigger asChild>
                            <div className={`flex items-center justify-between p-2 rounded-none border cursor-pointer ${
                              config.is_active 
                                ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                : 'bg-card border-gray-300 hover:bg-gray-50'
                            }`}>
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-600 w-6 flex-shrink-0">
                              {index + 1}.
                            </div>
                                <div className="text-xs font-medium text-blue-700 truncate">
                                  FT Rate {config.start_day} {config.start_month} - {config.end_day} {config.end_month} {config.year}
                            </div>
                          </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="text-xs font-semibold text-green-600">
                                  {typeof config.value === 'number' ? config.value.toFixed(4) : parseFloat(config.value).toFixed(4)} ฿/unit
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFTConfig(config.id)}
                                    className="text-destructive hover:text-destructive p-1 h-4 w-4"
                              >
                                    <Trash2 className="w-2 h-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleEditFT(config)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {language === 'TH' ? 'แก้ไข' : 'Edit'}
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleToggleFTActive(config)}>
                              <div className={`w-4 h-4 mr-2 rounded-full border-2 ${
                                config.is_active 
                                  ? 'border-green-500 bg-green-500' 
                                  : 'border-gray-400 bg-gray-200'
                              }`} />
                              {config.is_active 
                                ? (language === 'TH' ? 'ยกเลิกการใช้งาน' : 'Deactivate')
                                : (language === 'TH' ? 'ใช้งาน' : 'Activate')
                              }
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleDeleteFT(config)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === 'TH' ? 'ลบ' : 'Delete'}
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                    )}
                  </ScrollArea>

                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

                 {/* Add Holiday Dialog */}
         <Dialog open={showAddHoliday} onOpenChange={setShowAddHoliday}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle className="text-sm">
                 {language === 'TH' ? 'เพิ่มวันหยุด' : 'Add Holiday'}
               </DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'ชื่อวันหยุด' : 'Holiday Name'}
                 </Label>
                 <Input
                   value={newHoliday.name}
                   onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value, nameEn: e.target.value})}
                   placeholder={language === 'TH' ? 'ชื่อวันหยุด' : 'Holiday name'}
                   className="text-xs rounded-none"
                 />
               </div>
               
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'ประเภท' : 'Category'}
                 </Label>
                 <Select 
                   value={newHoliday.category} 
                   onValueChange={(value) => setNewHoliday({...newHoliday, category: value as 'special' | 'annual'})}
                 >
                   <SelectTrigger className="text-xs rounded-none">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="annual" className="text-xs">
                       {language === 'TH' ? 'วันหยุดประจำปี' : 'Annual Holiday'}
                     </SelectItem>
                     <SelectItem value="special" className="text-xs">
                       {language === 'TH' ? 'วันหยุดไม่ประจำปี' : 'Special Holiday'}
                     </SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'วันที่' : 'Date'}
                 </Label>
                 <div className="relative date-picker-container">
                 <Input
                     value={editCurrentDate || editDisplayDate}
                     readOnly
                     placeholder={language === 'TH' ? 'เลือกวันที่' : 'Select date'}
                     className="text-xs rounded-none cursor-pointer"
                     onClick={handleEditDateClick}
                   />
                   <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                 </div>
                 {showEditDatePicker && (
                   <div className="absolute z-[9999] mt-0 -right-20 top-0 bg-white border rounded-lg shadow-lg">
                     <Calendar
                       mode="single"
                       selected={editSelectedDate}
                       onSelect={handleEditCalendarSelect}
                       className="rounded-lg border"
                       classNames={{
                         day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                         day_today: "bg-accent text-accent-foreground",
                       }}
                     />
                   </div>
                 )}
               </div>
               
               <div className="flex justify-end space-x-2">
                 <Button 
                   variant="outline" 
                   onClick={() => setShowAddHoliday(false)} 
                   className="text-xs rounded-none"
                   disabled={addingHoliday}
                 >
                   {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                 </Button>
                 <Button 
                   onClick={addCustomHoliday} 
                   className="text-xs rounded-none"
                   disabled={addingHoliday}
                 >
                   {addingHoliday ? (
                     <>
                       <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                       {language === 'TH' ? 'กำลังเพิ่ม...' : 'Adding...'}
                     </>
                   ) : (
                     language === 'TH' ? 'เพิ่ม' : 'Add'
                   )}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>



        
         {/* Edit Holiday Dialog */}
         <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle className="text-sm">
                 {language === 'TH' ? 'แก้ไขวันหยุด' : 'Edit Holiday'}
               </DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'ชื่อวันหยุด' : 'Holiday Name'}
                 </Label>
                 <Input
                   value={editHoliday.name}
                   onChange={(e) => setEditHoliday({...editHoliday, name: e.target.value, nameEn: e.target.value})}
                   placeholder={language === 'TH' ? 'ชื่อวันหยุด' : 'Holiday name'}
                   className="text-xs rounded-none"
                 />
               </div>
               
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'ประเภท' : 'Category'}
                 </Label>
                 <Select 
                   value={editHoliday.category} 
                   onValueChange={(value) => setEditHoliday({...editHoliday, category: value as 'special' | 'annual'})}
                 >
                   <SelectTrigger className="text-xs rounded-none">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="annual" className="text-xs">
                       {language === 'TH' ? 'วันหยุดประจำปี' : 'Annual Holiday'}
                     </SelectItem>
                     <SelectItem value="special" className="text-xs">
                       {language === 'TH' ? 'วันหยุดไม่ประจำปี' : 'Special Holiday'}
                     </SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               <div>
                 <Label className="text-xs font-medium">
                   {language === 'TH' ? 'วันที่' : 'Date'}
                 </Label>
                 <div className="relative date-picker-container">
                   <Input
                     value={editCurrentDate || editDisplayDate}
                     readOnly
                     placeholder={language === 'TH' ? 'เลือกวันที่' : 'Select date'}
                     className="text-xs rounded-none cursor-pointer"
                     onClick={handleEditDateClick}
                   />
                   <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                 </div>
                 {showEditDatePicker && (
                   <div className="absolute z-[9999] mt-0 -right-20 top-0 bg-white border rounded-lg shadow-lg">
                     <Calendar
                       mode="single"
                       selected={editSelectedDate}
                       onSelect={handleEditCalendarSelect}
                       className="rounded-lg border"
                       classNames={{
                         day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                         day_today: "bg-accent text-accent-foreground",
                       }}
                     />
                   </div>
                 )}
               </div>
               
               <div className="flex justify-end space-x-2">
                 <Button 
                   variant="outline" 
                   onClick={() => setShowEditDialog(false)} 
                   className="text-xs rounded-none"
                   disabled={editingHoliday}
                 >
                   {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                 </Button>
                 <Button 
                   onClick={handleUpdateHoliday} 
                   className="text-xs rounded-none"
                   disabled={editingHoliday}
                 >
                   {editingHoliday ? (
                     <>
                       <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                       {language === 'TH' ? 'กำลังแก้ไข...' : 'Updating...'}
                     </>
                   ) : (
                     language === 'TH' ? 'บันทึก' : 'Save'
                   )}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>

         {/* Set FT Dialog */}
                   <Dialog open={showSetFT} onOpenChange={setShowSetFT}>
            <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle className="text-sm">
                 {language === 'TH' ? 'ตั้งค่า FT Rate' : 'Set FT Rate'}
               </DialogTitle>
             </DialogHeader>
                           <div className="space-y-4">
                                <div className="flex justify-between gap-4 w-full">
                   <div className="flex-1">
                     <Label className="text-xs font-medium">
                    {language === 'TH' ? 'จาก' : 'From'}
                     </Label>
                  <div className="relative date-picker-container">
                    <Input
                      value={displayStartDate}
                      readOnly
                      placeholder={language === 'TH' ? 'เลือกวันที่' : 'Select date'}
                      className="text-xs rounded-none cursor-pointer w-full"
                      onClick={() => {
                        console.log('From input clicked, current showStartDatePicker:', showStartDatePicker);
                        setShowStartDatePicker(!showStartDatePicker);
                      }}
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                                    {showStartDatePicker && (
                    <div className="absolute z-[9999] mt-0 -right-20 top-0 bg-white border rounded-lg shadow-lg date-picker-container">
                     <Calendar
                       mode="single"
                        selected={selectedStartDate}
                                                 onSelect={(date) => {
                           console.log('Calendar onSelect called with date:', date);
                           if (date) {
                             console.log('Setting selectedStartDate to:', date);
                             setSelectedStartDate(date);
                             setShowStartDatePicker(false);
                           }
                         }}
                        onDayClick={(day) => {
                          console.log('Calendar onDayClick called with day:', day);
                          setSelectedStartDate(day);
                          setShowStartDatePicker(false);
                        }}
                        className="rounded-lg border"
                       classNames={{
                         day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                         day_today: "bg-accent text-accent-foreground",
                       }}
                     />
                    </div>
                  )}
                   </div>
                   <div className="flex-1">
                     <Label className="text-xs font-medium">
                    {language === 'TH' ? 'ถึง' : 'To'}
                     </Label>
                  <div className="relative date-picker-container">
                    <Input
                      value={displayEndDate}
                      readOnly
                      placeholder={language === 'TH' ? 'เลือกวันที่' : 'Select date'}
                      className="text-xs rounded-none cursor-pointer w-full"
                      onClick={() => {
                        console.log('To input clicked, current showEndDatePicker:', showEndDatePicker);
                        setShowEndDatePicker(!showEndDatePicker);
                      }}
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {showEndDatePicker && (
                    <div className="absolute z-[9999] mt-0 -right-20 top-0 bg-white border rounded-lg shadow-lg date-picker-container">
                     <Calendar
                       mode="single"
                        selected={selectedEndDate}
                                                                         onSelect={(date) => {
                          console.log('Calendar onSelect called with date:', date);
                          if (date) {
                            console.log('Setting selectedEndDate to:', date);
                            setSelectedEndDate(date);
                            setShowEndDatePicker(false);
                          }
                        }}
                        className="rounded-lg border"
                       classNames={{
                         day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                         day_today: "bg-accent text-accent-foreground",
                       }}
                     />
                    </div>
                  )}
                   </div>
                  </div>
               
                               <div>
                  <Label className="text-xs font-medium">
                   {language === 'TH' ? 'อัตรา' : 'Rate'}
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newFTConfig.value}
                    onChange={(e) => setNewFTConfig({...newFTConfig, value: parseFloat(e.target.value) || 0})}
                    placeholder="0.0000"
                    className="text-xs rounded-none"
                  />
                </div>
               
               <div className="flex justify-end space-x-2 pt-4">
                 <Button
                   variant="outline"
                   onClick={() => {
                     setShowSetFT(false);
                     setSelectedFTForEdit(null);
                   }}
                   className="text-xs rounded-none"
                   disabled={addingFTConfig}
                 >
                   {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                 </Button>
                 <Button
                   onClick={selectedFTForEdit ? handleUpdateFTFromDialog : addNewFTConfig}
                   disabled={addingFTConfig}
                   className="bg-primary hover:bg-primary/90 text-white text-xs rounded-none"
                 >
                   {addingFTConfig ? (
                     <>
                       <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                       {selectedFTForEdit ? (language === 'TH' ? 'กำลังแก้ไข...' : 'Updating...') : (language === 'TH' ? 'กำลังบันทึก...' : 'Saving...')}
                     </>
                   ) : (
                     selectedFTForEdit ? (language === 'TH' ? 'แก้ไข' : 'Update') : (language === 'TH' ? 'บันทึก' : 'Save')
                   )}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
      </div>
      <Toaster />
    </PageLayout>
  );
}
