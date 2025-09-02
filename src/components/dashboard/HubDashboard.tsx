import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { 
  Globe, 
  Building2, 
  Factory, 
  Home as HomeIcon, 
  MonitorSpeaker, 
  Zap, 
  Chrome,
  Settings,
  LogIn,
  LogOut,
  Languages,
  Menu,
  X
} from 'lucide-react';

export function Home() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const centerSections = [
    { label: t.sections.plaza, icon: Building2, position: 'top-left' },
    { label: t.sections.building, icon: Building2, position: 'top-right' },
    { label: t.sections.residence, icon: HomeIcon, position: 'right' },
    { label: t.sections.factory, icon: Factory, position: 'bottom-right' },
    { label: t.sections.utility, icon: Zap, position: 'bottom' },
    { label: t.sections.webBrowser, icon: Chrome, position: 'bottom-left' },
    { label: t.sections.amr, icon: MonitorSpeaker, position: 'left' },
    { label: t.sections.complex, icon: Building2, position: 'top' }
  ];

  const DOTS_PER_SECTION = 15; // เพิ่มจำนวนจุดให้มากขึ้น
  const DOT_RADIUS = 3; // ลดขนาดจุด
  const ICON_RADIUS = 120;
  const TRAIL_RADIUS = 136;
  const [activeSection, setActiveSection] = useState(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  
  // Clock hand animation state
  const [clockProgress, setClockProgress] = useState(0);
  const [currentClockSection, setCurrentClockSection] = useState(0);

  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const duration = 4000; // ลดเวลาลงให้เร็วขึ้น
    function animate(now: number) {
      const elapsed = now - last;
      last = now;
      setProgress(prev => {
        let next = prev + direction * (elapsed / (duration / 2));
        if (next >= 1) {
          next = 1;
          setDirection(-1);
        } else if (next <= 0) {
          next = 0;
          setDirection(1);
        }
        return next;
      });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [direction]);

  // Clock hand animation effect
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const sectionDuration = 2500; // ลดเวลาลง
    const totalSections = centerSections.length;
    
    function animateClock(now: number) {
      const elapsed = now - last;
      last = now;
      
      setClockProgress(prev => {
        let next = prev + (elapsed / sectionDuration);
        if (next >= 1) {
          // Move to next section
          const nextSection = (currentClockSection + 1) % totalSections;
          setCurrentClockSection(nextSection);
          return 0;
        }
        return next;
      });
      
      raf = requestAnimationFrame(animateClock);
    }
    
    raf = requestAnimationFrame(animateClock);
    return () => cancelAnimationFrame(raf);
  }, [currentClockSection]);

  // เอฟเฟต์ active section จะเกิดขึ้นเมื่อ clockProgress ใกล้ถึง 1 (ไปถึง section)
  const shouldShowActiveEffect = (sectionIndex: number) => {
    return sectionIndex === currentClockSection && clockProgress > 0.8; // เริ่มเอฟเฟต์เมื่อใกล้ถึง section
  };

  return (
    <PageLayout>
      <div className="w-full h-[calc(100vh-50px)] flex flex-col justify-center items-center bg-gradient-to-b from-white via-primary/10 to-primary/20">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center gap-2">
          {/* Center Hub */}
          <div className="relative flex flex-col md:flex-row justify-center items-center min-h-[180px] md:min-h-[420px] mb-2">
            {/* Central Globe */}
            <div className="relative z-10">
                <img src="/icon_webmeter02.svg" alt="Globe" className="w-40 h-40 md:w-50 md:h-50 text-white" />
            </div>

            {/* Orbiting Sections */}
            {centerSections.map((section, index) => {
              const angle = (index * 360) / centerSections.length;
              const radius = 180;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const isActive = shouldShowActiveEffect(index);

              return (
                <div
                  key={section.label}
                  className="absolute hover-lift cursor-pointer"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <div 
                    className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-white/80 to-primary/20 backdrop-blur-md rounded-full flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-500 ${
                      isActive 
                        ? 'shadow-2xl shadow-primary/50 ring-4 ring-primary/30 scale-110 animate-pulse' 
                        : ''
                    }`}
                    style={{
                      filter: isActive ? 'drop-shadow(0 0 20px var(--color-primary, #06b6d4))' : 'none',
                    }}
                  >
                    <section.icon 
                      className={`w-5 h-5 md:w-6 md:h-6 mb-1 transition-all duration-500 ${
                        isActive ? 'text-primary scale-125' : 'text-primary'
                      }`}
                    />
                    <span className={`text-[10px] font-medium text-center leading-tight transition-all duration-500 ${
                      isActive ? 'text-primary font-bold' : 'text-gray-800'
                    }`}>
                      {section.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Connection Dots Animation - เปลี่ยนเป็นเส้นประ */}
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="340" height="340" style={{zIndex:1}}>
              {centerSections.map((_, sectionIdx) => {
                const angle = (sectionIdx * 360) / centerSections.length;
                const center = 170;
                const isActive = shouldShowActiveEffect(sectionIdx);
                
                return Array.from({ length: DOTS_PER_SECTION }).map((_, dotIdx) => {
                  const dotProgress = dotIdx / (DOTS_PER_SECTION - 1);
                  const x2 = center + Math.cos((angle * Math.PI) / 180) * TRAIL_RADIUS;
                  const y2 = center + Math.sin((angle * Math.PI) / 180) * TRAIL_RADIUS;
                  const dotX = center + (x2 - center) * dotProgress;
                  const dotY = center + (y2 - center) * dotProgress;
                  const currentTrail = progress * (DOTS_PER_SECTION - 1);
                  
                  // สีของจุด - เปลี่ยนเป็นสีที่แตกต่างกัน
                  let fill = isActive ? '#f59e0b' : 'var(--color-primary, #06b6d4)'; // สีส้มเมื่อ active
                  let fillOpacity = 0.15;
                  
                  if (dotIdx < currentTrail) {
                    fillOpacity = 0.3;
                  } else if (Math.abs(dotIdx - currentTrail) < 0.5) {
                    fillOpacity = 1;
                    fill = isActive ? '#ef4444' : '#06b6d4'; // สีแดงเมื่อเป็นจุดปัจจุบันและ active
                  }
                  
                  return (
                    <circle
                      key={sectionIdx + '-' + dotIdx}
                      cx={dotX}
                      cy={dotY}
                      r={DOT_RADIUS}
                      fill={fill}
                      fillOpacity={fillOpacity}
                      style={{
                        filter: fillOpacity > 0.8 ? `drop-shadow(0 0 6px ${fill})` : 'none',
                        transition: 'cx 0.1s, cy 0.1s',
                      }}
                    />
                  );
                });
              })}
            </svg>

            {/* Clock Hand Animation - เปลี่ยนเป็นเส้นประ */}
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="340" height="340" style={{zIndex: 2}}>
              {/* Clock hand pointing to current section */}
              {(() => {
                const angle = (currentClockSection * 360) / centerSections.length;
                const center = 170;
                const handLength = 140;
                const handEndX = center + Math.cos((angle * Math.PI) / 180) * handLength * clockProgress;
                const handEndY = center + Math.sin((angle * Math.PI) / 180) * handLength * clockProgress;
                
                // สร้างเส้นประ
                const segments = 25; // เพิ่มจำนวน segment
                const dashLength = (handLength * clockProgress) / segments;
                const isActive = shouldShowActiveEffect(currentClockSection);
                
                // คำนวณสีและความเข้มตาม progress
                const getStrokeColor = (progress: number) => {
                  if (progress < 0.25) {
                    // เริ่มต้น: สีเขียวเข้ม (หัววงกลม)
                    return '#004030';
                  } else if (progress < 0.5) {
                    // เขียวสว่าง
                    return '#93DA97';
                  } else if (progress < 0.75) {
                    // เขียวกลาง
                    return '#B4E50D';
                  } else {
                    // เขียวเข้ม
                    return '#78C841';
                  }
                };
                
                const strokeColor = getStrokeColor(clockProgress);
                const strokeOpacity = 0.3 + (clockProgress * 0.7); // ค่อยๆเพิ่มความเข้ม
                
                return Array.from({ length: segments }).map((_, i) => {
                  const segmentProgress = (i + 1) / segments;
                  if (segmentProgress > clockProgress) return null;
                  
                  const x1 = center + Math.cos((angle * Math.PI) / 180) * handLength * (i / segments);
                  const y1 = center + Math.sin((angle * Math.PI) / 180) * handLength * (i / segments);
                  const x2 = center + Math.cos((angle * Math.PI) / 180) * handLength * ((i + 0.5) / segments);
                  const y2 = center + Math.sin((angle * Math.PI) / 180) * handLength * ((i + 0.5) / segments);
                  
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeOpacity={strokeOpacity}
                      strokeDasharray="3,3" // ทำให้เป็นเส้นประ
                      style={{
                        filter: `drop-shadow(0 0 4px ${strokeColor})`,
                      }}
                    />
                  );
                });
              })()}
              
              {/* Clock hand tip indicator */}
              {(() => {
                const angle = (currentClockSection * 360) / centerSections.length;
                const center = 170;
                const handLength = 140;
                const tipX = center + Math.cos((angle * Math.PI) / 180) * handLength * clockProgress;
                const tipY = center + Math.sin((angle * Math.PI) / 180) * handLength * clockProgress;
                const isActive = shouldShowActiveEffect(currentClockSection);
                
                // สีของหัวตาม progress
                const getTipColor = (progress: number) => {
                  if (progress < 0.25) {
                    return '#004030'; // สีเขียวเข้ม (หัววงกลม)
                  } else if (progress < 0.5) {
                    return '#93DA97'; // เขียวสว่าง
                  } else if (progress < 0.75) {
                    return '#B4E50D'; // เขียวกลาง
                  } else {
                    return '#78C841'; // เขียวเข้ม
                  }
                };
                
                const fillColor = isActive ? '#004030' : getTipColor(clockProgress);
                
                return (
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={6}
                    fill={fillColor}
                    fillOpacity={clockProgress > 0.1 ? 1 : 0}
                    style={{
                      filter: `drop-shadow(0 0 8px ${fillColor})`,
                      transform: `scale(${0.5 + clockProgress * 0.5})`,
                      transformOrigin: `${tipX}px ${tipY}px`,
                    }}
                  />
                );
              })()}
            </svg>
          </div>

          {/* Welcome Section */}
          <div className="text-center mb-2 px-2">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 md:p-3 shadow-xl max-w-xs sm:max-w-md md:max-w-xl mx-auto">
              <h1 className="text-xl md:text-2xl font-bold text-primary mb-3">
                {t.welcome.title}
              </h1>
              <div className="space-y-1 text-gray-600 leading-relaxed text-xs">
                <p>
                  {t.welcome.description1}
                </p>
                <p>
                  {t.welcome.description2}
                </p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  {t.welcome.demoNote}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}