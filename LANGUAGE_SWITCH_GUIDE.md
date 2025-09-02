# คู่มือการเปลี่ยนภาษา WebMeter Dashboard

## การใช้งาน

### 1. การเปลี่ยนภาษา
- คลิกที่ปุ่มธงชาติในแถบ navigation (มุมขวาบน)
- ธงไทย = ภาษาไทย
- ธงอังกฤษ = ภาษาอังกฤษ

### 2. ข้อความที่รองรับการแปล

#### หน้า HubDashboard (/home)
- **หัวข้อหลัก**: "ยินดีต้อนรับสู่ WebMeter" / "Welcome to WebMeter"
- **คำอธิบาย**: ข้อความแนะนำเทคโนโลยี WebMeter
- **หมายเหตุ**: "ทดลองใช้งานได้จากเมนูด้านบน" / "Demo or Trial yourself from top menu"
- **ส่วนต่างๆ**: Plaza, Building, Residence, Factory, Utility, Web Browser, AMR, Complex

### 3. โครงสร้างไฟล์

#### `src/lib/translations.ts`
ไฟล์เก็บข้อความแปลทั้งหมด
```typescript
export const translations = {
  TH: {
    welcome: { ... },
    sections: { ... }
  },
  EN: {
    welcome: { ... },
    sections: { ... }
  }
};
```

#### `src/context/LanguageContext.tsx`
Context สำหรับจัดการสถานะภาษา

#### `src/components/dashboard/HubDashboard.tsx`
คอมโพเนนต์ที่ใช้การแปลภาษา

### 4. การเพิ่มข้อความแปลใหม่

1. เพิ่มข้อความใน `src/lib/translations.ts`
2. ใช้ `useLanguage()` hook ในคอมโพเนนต์
3. เข้าถึงข้อความผ่าน `translations[language]`

### 5. ตัวอย่างการใช้งาน

```typescript
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

function MyComponent() {
  const { language } = useLanguage();
  const t = translations[language];
  
  return (
    <div>
      <h1>{t.welcome.title}</h1>
      <p>{t.welcome.description1}</p>
    </div>
  );
}
```

## การทดสอบ

1. รันโปรเจค: `npm run dev`
2. ไปที่หน้า `/home`
3. คลิกปุ่มธงชาติเพื่อเปลี่ยนภาษา
4. ตรวจสอบว่าข้อความเปลี่ยนตามภาษาที่เลือก
