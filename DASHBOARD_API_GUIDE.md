# Dashboard API Guide

## Overview
Dashboard API เป็น API ใหม่ที่สร้างขึ้นเฉพาะสำหรับหน้า Dashboard โดยรวมการดึงข้อมูลทั้งหมดไว้ใน endpoint เดียวกัน และดึงข้อมูลทั้งหมด 39 columns จากฐานข้อมูล parameters_db > table parameters_value

## Endpoint

### GET /api/dashboard

ดึงข้อมูลทั้งหมดสำหรับหน้า Dashboard ในครั้งเดียว

#### Parameters
- `from` (optional): เวลาเริ่มต้นในรูปแบบ HH:MM (default: 00:00)
- `to` (optional): เวลาสิ้นสุดในรูปแบบ HH:MM (default: เวลาปัจจุบัน)
- ช่วงเวลาที่ดึงข้อมูล: จาก 00:00:00 ของวันปัจจุบัน ถึงเวลาปัจจุบันที่กำลังเดินอยู่

#### Example Request
```bash
# ใช้เวลาปัจจุบัน (default)
GET /api/dashboard

# ระบุ time range
GET /api/dashboard?from=14:00&to=14:05
```

#### Response Format
```json
{
  "success": true,
  "data": {
         "currentValues": {
       "watt": 0,
       "var": 0,
       "va": 0,
       "powerFactor": 0,
       "voltLN": 0,
       "voltLL": 0,
       "currentAvg": 0,
       "frequency": 0,
       "voltAN": 0,
       "voltBN": 0,
       "voltCN": 0,
       "voltAB": 0,
       "voltBC": 0,
       "voltCA": 0,
       "currentA": 0,
       "currentB": 0,
       "currentC": 0,
       "currentN": 0,
       "wattA": 0,
       "wattB": 0,
       "wattC": 0,
       "varA": 0,
       "varB": 0,
       "varC": 0,
       "vaA": 0,
       "vaB": 0,
       "vaC": 0,
       "pfA": 0,
       "pfB": 0,
       "pfC": 0,
       "thdv": 0,
       "thdi": 0
     },
    "energyData": {
      "importKwh": 0,
      "exportKwh": 0,
      "importKvarh": 0,
      "exportKvarh": 0
    },
    "demandData": [
      {
        "hour": 0,
        "watt": 0,
        "var": 0,
        "va": 0
      }
      // ... 25 entries (0-24 hours)
    ],
    "touData": [
      {
        "hour": 0,
        "onPeak": 0,
        "offPeak": 0
      }
      // ... 25 entries (0-24 hours)
    ],
    "chartData": {
      "watt": [0, 0, 0, 0, 0, 0],
      "var": [0, 0, 0, 0, 0, 0],
      "va": [0, 0, 0, 0, 0, 0],
      "powerFactor": [0, 0, 0, 0, 0, 0]
    },
    "yesterdayData": {
      "watt": 0,
      "var": 0,
      "va": 0,
      "powerFactor": 0
    }
  }
}
```

## ข้อมูลที่ส่งกลับ

### currentValues
ค่าปัจจุบันของมิเตอร์ (ข้อมูลจาก 39 columns):
- `watt`: กำลังไฟฟ้าจริงรวม (Watt)
- `var`: กำลังไฟฟ้ารีแอคทีฟรวม (Var)
- `va`: กำลังไฟฟ้าแอปเปอร์เรนต์รวม (VA)
- `powerFactor`: แฟกเตอร์กำลังไฟฟ้ารวม
- `voltLN`: แรงดันไฟฟ้า Line to Neutral เฉลี่ย (V)
- `voltLL`: แรงดันไฟฟ้า Line to Line เฉลี่ย (V)
- `currentAvg`: กระแสไฟฟ้าเฉลี่ย (A)
- `frequency`: ความถี่ (Hz)
- `voltAN`, `voltBN`, `voltCN`: แรงดันไฟฟ้า Phase to Neutral (V)
- `voltAB`, `voltBC`, `voltCA`: แรงดันไฟฟ้า Line to Line (V)
- `currentA`, `currentB`, `currentC`: กระแสไฟฟ้าแต่ละ Phase (A)
- `currentN`: กระแสไฟฟ้า Neutral (A)
- `wattA`, `wattB`, `wattC`: กำลังไฟฟ้าจริงแต่ละ Phase (Watt)
- `varA`, `varB`, `varC`: กำลังไฟฟ้ารีแอคทีฟแต่ละ Phase (Var)
- `vaA`, `vaB`, `vaC`: กำลังไฟฟ้าแอปเปอร์เรนต์แต่ละ Phase (VA)
- `pfA`, `pfB`, `pfC`: แฟกเตอร์กำลังไฟฟ้าแต่ละ Phase
- `thdv`: Total Harmonic Distortion Voltage (%)
- `thdi`: Total Harmonic Distortion Current (%)

### energyData
ข้อมูลพลังงานสะสม:
- `importKwh`: พลังงานไฟฟ้านำเข้า (kWh)
- `exportKwh`: พลังงานไฟฟ้าส่งออก (kWh)
- `importKvarh`: พลังงานรีแอคทีฟนำเข้า (kVarh)
- `exportKvarh`: พลังงานรีแอคทีฟส่งออก (kVarh)

### demandData
ข้อมูล Demand แบบต่อเนื่องตาม time range ที่เลือก (ความถี่ 1 นาที):
- `hour`: ชั่วโมง (0-24) หรือทศนิยม (เช่น 14.5 = 14:30)
- `watt`: Demand Watt
- `var`: Demand Var
- `va`: Demand VA

**หมายเหตุ**: ข้อมูลจะแสดงในตำแหน่งเวลาที่ถูกต้องบนแกน X (0-24) และจะเติมข้อมูล 0 สำหรับชั่วโมงที่เหลือ

### touData
ข้อมูล Time of Use 24 ชั่วโมง (25 จุด 0-24, 7 ค่า):
- `hour`: ชั่วโมง (0-24)
- `demandW`: Demand Watt
- `demandVar`: Demand Var
- `demandVA`: Demand VA (คำนวณจาก SQR2(Demand W^2 + Demand Var^2))
- `importKwh`: Import kWh
- `exportKwh`: Export kWh
- `importKvarh`: Import kVarh
- `exportKvarh`: Export kVarh

### chartData
ข้อมูลสำหรับ Sparkline Charts (6 จุดล่าสุด):
- `watt`: ข้อมูล Watt สำหรับ sparkline
- `var`: ข้อมูล Var สำหรับ sparkline
- `va`: ข้อมูล VA สำหรับ sparkline
- `powerFactor`: ข้อมูล Power Factor สำหรับ sparkline

### yesterdayData
ข้อมูลเมื่อวานสำหรับเปรียบเทียบ:
- `watt`: กำลังไฟฟ้าจริงเมื่อวาน
- `var`: กำลังไฟฟ้ารีแอคทีฟเมื่อวาน
- `va`: กำลังไฟฟ้าแอปเปอร์เรนต์เมื่อวาน
- `powerFactor`: แฟกเตอร์กำลังไฟฟ้าเมื่อวาน

## การใช้งานใน Frontend

### ตัวอย่างการเรียกใช้
```typescript
import { apiClient } from '@/services/api';

// ดึงข้อมูลปัจจุบัน (API จะใช้เวลาปัจจุบันเสมอ)
const response = await apiClient.getDashboardData();

if (response.success && response.data) {
  const {
    currentValues,
    energyData,
    demandData,
    touData,
    chartData,
    yesterdayData
  } = response.data;
  
  // อัพเดท state ต่างๆ
  setCurrentValues(currentValues);
  setEnergyData(energyData);
  setDemandData(demandData);
  setTouBarData(touData);
  setChartData(chartData);
  setYesterdayData(yesterdayData);
}
```

## ข้อดีของ API ใหม่

1. **ประสิทธิภาพ**: ดึงข้อมูลทั้งหมดในครั้งเดียว แทนที่จะเรียกหลาย API
2. **ความเร็ว**: ลดจำนวน HTTP requests
3. **ความเสถียร**: ข้อมูลทั้งหมดมาจากการ query เดียวกัน
4. **ง่ายต่อการดูแล**: มี endpoint เดียวที่ต้องจัดการ
5. **Real-time**: อัพเดททุกนาที
6. **ข้อมูลครบถ้วน**: ดึงข้อมูลทั้งหมด 39 columns จากฐานข้อมูล
7. **ช่วงเวลายืดหยุ่น**: ดึงข้อมูลจาก 00:00 ของวันปัจจุบันถึงเวลาปัจจุบันที่กำลังเดินอยู่

### ตัวอย่างการทำงาน:

- เวลา 14:00:00 → ดึงข้อมูลจาก 00:00:00 ถึง 14:00:00
- เวลา 14:01:00 → ดึงข้อมูลจาก 00:00:00 ถึง 14:01:00
- เวลา 14:02:00 → ดึงข้อมูลจาก 00:00:00 ถึง 14:02:00

## Fallback Data

หากไม่มีข้อมูลจากฐานข้อมูล API จะส่งกลับข้อมูลเป็น 0 แทนที่จะเป็นข้อมูล mockup

## Error Handling

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## การติดตั้ง

1. เพิ่ม route ใน `server/server.js`:
```javascript
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);
```

2. อัพเดท API client ใน `src/services/api.ts`:
```typescript
async getDashboardData(): Promise<ApiResponse<DashboardData>> {
  return this.request(`/dashboard`);
}
```

3. อัพเดทหน้า Dashboard ใน `src/pages/HubDashboard.tsx` เพื่อใช้ API ใหม่
