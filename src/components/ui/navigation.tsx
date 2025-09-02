import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Database, 
  BarChart3, 
  Settings, 
  Users, 
  Download,
  Globe,
  Activity,
  Clock,
  FileText,
  Bell,
  Mail,
  MessageSquare,
  User,
  GitBranch,
  ChevronDown,
  TrendingUp,
  Zap,
  BarChart,
  DollarSign,
  LogOut,
  UserPlus,
  Menu,
  X,
  Table,
  ChartNoAxesCombined,
  LayoutDashboard,
  ChartPie,
  FolderTree,
  Calendar as CalendarIcon
} from 'lucide-react';
import { TbWavesElectricity, TbSolarElectricity, TbFileExport, TbUserShare } from 'react-icons/tb';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
  children?: { title: string; href: string; icon?: React.ComponentType<any> }[];
}


function getNavItems(language: 'TH' | 'EN'): NavItem[] {
  return [
    {
      title: language === 'TH' ? 'หน้าแรก' : 'Home',
      href: '/home',
      icon: Home,
      description: language === 'TH' ? 'แนะนำสินค้า' : 'Product Introduction'
    },
    {
      title: language === 'TH' ? 'แดชบอร์ด' : 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: language === 'TH' ? 'แดชบอร์ดรวม' : 'Dashboard Overview'
    },
    {
      title: language === 'TH' ? 'ข้อมูลย้อนหลัง' : 'Table Data',
      href: '/table-data',
      icon: Table,
      description: language === 'TH' ? 'ตารางข้อมูลย้อนหลัง' : 'Historical Table Data'
    },

    {
      title: language === 'TH' ? 'ข้อมูลเรียลไทม์' : 'Online Data',
      href: '/online-data',
      icon: Activity,
      description: language === 'TH' ? 'ข้อมูลมิเตอร์แบบเรียลไทม์' : 'Real-time Meter Data'
    },
    {
      title: language === 'TH' ? 'กราฟข้อมูล' : 'Graph Data',
      href: '/graph-data',
      icon: BarChart3,
      description: language === 'TH' ? 'กราฟแสดงข้อมูล' : 'Data Graphs',
      children: [
        { title: language === 'TH' ? 'กราฟเส้น' : 'Line Graph', href: '/graph-data/line', icon: ChartNoAxesCombined },
        { title: language === 'TH' ? 'กราฟดีมานด์' : 'Demand Graph', href: '/graph-data/demand', icon: Activity },
        { title: language === 'TH' ? 'กราฟพลังงาน' : 'Energy Graph', href: '/graph-data/energy', icon: TbWavesElectricity },
        { title: language === 'TH' ? 'กราฟเปรียบเทียบ' : 'Compare Graph', href: '/graph-data/compare', icon: GitBranch },
      ],
    },
    {
      title: language === 'TH' ? 'TOU' : 'TOU',
      href: '/tou',
      icon: Clock,
      description: language === 'TH' ? 'การใช้ไฟตามช่วงเวลา' : 'Time of Use',
      children: [
        { title: language === 'TH' ? 'กราฟดีมานด์' : 'Demand Graph', href: '/tou-demand', icon: TrendingUp },
        { title: language === 'TH' ? 'กราฟพลังงาน' : 'Energy Graph', href: '/tou-energy', icon: TbSolarElectricity },
        { title: language === 'TH' ? 'กราฟเปรียบเทียบ' : 'Compare Graph', href: '/tou-compare', icon: ChartPie },
        { title: language === 'TH' ? 'คำนวณค่าไฟ' : 'Charge', href: '/charge', icon: DollarSign },
      ],
    },
    {
      title: language === 'TH' ? 'เหตุการณ์' : 'Event',
      href: '/event',
      icon: Bell,
      description: language === 'TH' ? 'เหตุการณ์ที่เกิดขึ้น' : 'Events'
    },
    {
      title: language === 'TH' ? 'ตั้งค่า' : 'Config',
      href: '/config',
      icon: Settings,
      description: language === 'TH' ? 'การตั้งค่าระบบ' : 'System Settings',
      children: [
        { title: language === 'TH' ? 'ส่งออกข้อมูล' : 'Export Data', href: '/export', icon: TbFileExport },
        { title: language === 'TH' ? 'อีเมล/ไลน์' : 'Email , Line', href: '/config/email', icon: Mail },
        { title: language === 'TH' ? 'จัดการผู้ใช้' : 'User Management', href: '/users', icon: User },
        { title: language === 'TH' ? 'โครงสร้างมิเตอร์' : 'Meter Tree', href: '/meter-tree', icon: FolderTree },
        { title: language === 'TH' ? 'วันหยุดและ FT' : 'Holiday & FT', href: '/holiday', icon: CalendarIcon },
      ],
    },
  ];
}

export function MainNavigation() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { language, setLanguage } = useLanguage();
  const navItems = getNavItems(language);

  // ดึง username และ level จาก localStorage
  let username = localStorage.getItem('userUsername') || localStorage.getItem('userEmail') || '';
  let isGuest = localStorage.getItem('isGuest') === 'true';
  let userLevel = isGuest ? 'read only' : 'user';
  if (isGuest) username = 'guest';

  const handleLanguageSwitch = () => {
    setLanguage(language === 'TH' ? 'EN' : 'TH');
  };

  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('userEmail');
    
    // Navigate to login page
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <div className="flex items-center justify-between w-full px-2 sm:px-4 py-0 bg-primary text-black h-12">
        {/* Logo Section */}
        <div className="flex items-center">
          <img src="/Amptron.png" alt="WebMeter Logo" className="w-12 h-6 sm:w-16 sm:h-8 md:w-20 md:h-9" />
          <div className="flex flex-col justify-center -ml-1 sm:-ml-3">
            <h1 className="text-xs sm:text-sm font-bold tracking-wide text-white">WEBMETER</h1>
            <p className="text-[8px] sm:text-[10px] opacity-90 text-white hidden sm:block">Track your Energy , Anywhere Anytime</p>
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 h-full">
          {navItems.map((item) => (
            <div key={item.href} className="relative h-full group/dropdown">
              {item.children ? (
                <div className="relative h-full">
                  <div
                    className={cn(
                      "px-1 xl:px-2 py-1 h-full rounded-none flex items-center space-x-1 xl:space-x-2 text-xs xl:text-sm font-medium transition-colors duration-200 cursor-pointer",
                      "text-white hover:bg-white/80 hover:text-primary",
                      "group-hover/dropdown:bg-white/80 group-hover/dropdown:text-primary"
                    )}
                    style={{height: '100%'}}
                  >
                    <item.icon className="w-4 h-4 text-white hover:text-primary group-hover/dropdown:text-primary transition-colors duration-200" />
                    <span className="whitespace-nowrap">{item.title}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-white hover:text-primary group-hover/dropdown:text-primary transition-all duration-200 hover:rotate-180 group-hover/dropdown:rotate-180" />
                  </div>
                  
                  {/* Dropdown Menu - แสดงเมื่อ hover */}
                  <div className="absolute top-full left-0 min-w-[200px] bg-white border border-gray-200 shadow-lg rounded-none p-2 z-50 mt-1 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200"
                       onMouseEnter={() => {}} onMouseLeave={() => {}}>
                    <div className="flex flex-col space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) =>
                            cn(
                              "px-3 py-2 rounded-none text-sm text-primary hover:bg-primary/10 hover:text-primary active:text-primary active:bg-primary/20 transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap",
                              isActive ? "bg-primary/10 text-primary font-medium" : ""
                            )
                          }
                        >
                          {child.icon && <child.icon className="w-4 h-4 flex-shrink-0 text-primary" />}
                          <span>{child.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group px-1 xl:px-2 h-full flex items-center space-x-1 xl:space-x-2 text-xs xl:text-sm font-medium text-white relative transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? "bg-white text-primary font-semibold h-full shadow-none"
                        : "hover:bg-white/80 hover:text-primary active:text-primary h-full"
                    )
                  }
                  style={{height: '100%'}}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn(
                        "w-4 h-4 transition-colors duration-200",
                        isActive ? "text-primary" : "text-white group-hover:text-primary group-active:text-primary"
                      )} />
                      <span>{item.title}</span>
                    </>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden text-white p-2 hover:bg-white/20 rounded transition-colors duration-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

          {/* Right Section - Language & User Controls */}
          <div className="hidden lg:flex items-center rounded-none space-x-3">
          {/* User Info Display - Hide for guest users */}
          {!isGuest && (
            <div className="flex flex-col items-end text-white">
              <span className="text-xs xl:text-sm font-medium">{username}</span>
              <span className="text-[10px] xl:text-xs opacity-80">admin</span>
            </div>
          )}
          
          <div className="flex items-center space-x-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white bg-transparent px-3 py-1 transition-all duration-200 hover:bg-white/10 rounded-none"
              onClick={handleLanguageSwitch}
            >
              <img 
                src={language === 'TH' ? 'https://flagcdn.com/w20/th.png' : 'https://flagcdn.com/w20/gb.png'} 
                alt={language === 'TH' ? 'Thai Flag' : 'UK Flag'}
                className="w-3 h-3 xl:w-5 xl:h-4 rounded-sm"
              />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="relative text-white bg-transparent w-8 h-8 xl:w-10 xl:h-10  rounded-none flex items-center justify-center p-0 hover:bg-white/10 transition-all duration-200 border-none group"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <TbUserShare className="w-8 h-8 xl:w-10 xl:h-10 text-white font-bold" />
              {/* Tooltip */}
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5  bg-gray-800 text-white text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 rounded-none">
              Logout
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white/20 backdrop-blur-sm z-40" onClick={toggleMobileMenu}>
          <div className="absolute top-12 left-0 right-0 bg-white shadow-lg border-t border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 space-y-3">
              {/* Mobile Language & Logout Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary bg-transparent px-3 py-2 rounded-full transition-all duration-200 hover:bg-primary/10"
                  onClick={handleLanguageSwitch}
                >
                  <img 
                    src={language === 'TH' ? 'https://flagcdn.com/w20/th.png' : 'https://flagcdn.com/w20/gb.png'} 
                    alt={language === 'TH' ? 'Thai Flag' : 'UK Flag'}
                    className="w-6 h-4 rounded-sm mr-2"
                  />
                  <span className="text-sm">{language}</span>
                </Button>
                {!isGuest && (
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-primary">{username}</span>
                    <span className="text-xs opacity-80 text-primary">admin</span>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary bg-transparent px-3 py-2 rounded-full hover:bg-primary/10 transition-all duration-200"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <TbUserShare className="w-5 h-5 mr-2 font-bold" />
                  <span className="text-sm">Logout</span>
                </Button>
              </div>

              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <div key={item.href} className="space-y-2">
                  {item.children ? (
                    <>
                      <div className="flex items-center space-x-3 px-3 py-3 text-primary font-medium border-b border-gray-100">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="text-base">{item.title}</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors duration-200",
                                isActive 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                              )
                            }
                          >
                            {child.icon && <child.icon className="w-4 h-4 flex-shrink-0" />}
                            <span>{child.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </>
                  ) : (
                    <NavLink
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center space-x-3 px-3 py-3 rounded-md text-base transition-colors duration-200",
                          isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-gray-700 hover:bg-primary/5 hover:text-primary"
                        )
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}