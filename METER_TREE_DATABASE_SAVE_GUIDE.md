# คู่มือการบันทึกข้อมูลลง Database เมื่อกด Add Location

## 📋 **ภาพรวมการทำงาน**

เมื่อกดปุ่ม "Add Location" ในแต่ละหัวข้อของ Meter Tree ระบบจะบันทึกข้อมูลลง PostgreSQL database ตามโครงสร้างที่กำหนดไว้ รวมถึงการแก้ไขและลบข้อมูลด้วย

## 🗂️ **การบันทึกข้อมูลในแต่ละ Tree Type**

### **1. System Tree (Location → LogNet → Meter)**

#### **เมื่อกด Add Location:**
```typescript
// 1. สร้าง Location ใหม่ใน database
const newLocation = await meterTreeService.createLocation({
  name: "ชื่อ Location",
  description: "Location created from system tree"
});

// 2. อัปเดต local state
setRootNodes(prev => prev.map((sys, i) => 
  i === idx ? { 
    ...sys, 
    id: `location-${newLocation.id}`, // ใช้ ID จาก database
    name: newLocation.name, 
    iconType: 'location' 
  } : sys
));
```

#### **เมื่อกด Add LogNet:**
```typescript
// 1. สร้าง LogNet ใหม่ใน database
const newLogNet = await meterTreeService.createLogNet({
  location_id: locationId, // ID ของ location parent
  name: "ชื่อ LogNet",
  model: "รุ่น",
  brand: "แบรนด์",
  serial_number: "หมายเลขซีเรียล",
  firmware_version: "เวอร์ชันเฟิร์มแวร์",
  ip_address: "IP Address",
  subnet_mask: "Subnet Mask",
  gateway: "Gateway",
  dns: "DNS",
  is_active: true
});

// 2. อัปเดต local state
const newNode = {
  id: `lognet-${newLogNet.id}`,
  name: newLogNet.name,
  iconType: 'lognet',
  brand: newLogNet.brand,
  model: newLogNet.model,
  serialNumber: newLogNet.serial_number,
  firmwareVersion: newLogNet.firmware_version,
  ip: newLogNet.ip_address,
  subnetMask: newLogNet.subnet_mask,
  gateway: newLogNet.gateway,
  dns: newLogNet.dns,
  children: []
};
```

#### **เมื่อกด Add Meter:**
```typescript
// 1. สร้าง Meter ใหม่ใน database
const newMeter = await meterTreeService.createMeter({
  name: "ชื่อ Meter",
  brand: "แบรนด์",
  model: "รุ่น",
  meter_sn: "หมายเลขซีเรียล",
  protocol: "โปรโตคอล",
  ip_address: "IP Address",
  slave_id: 1,
  port: 502,
  ct_primary: 100.00,
  pt_primary: 400.00,
  ct_secondary: 5.00,
  pt_secondary: 100.00,
  is_active: true,
  lognet_id: lognetId, // ID ของ LogNet parent
  floor_id: null, // ไม่ใช้ใน System Tree
  is_disabled_in_building: false
});

// 2. อัปเดต local state
const newNode = {
  id: `meter-${newMeter.id}`,
  name: newMeter.name,
  iconType: 'meter',
  enabled: newMeter.is_active,
  onlineEnabled: !newMeter.is_disabled_in_building,
  brand: newMeter.brand,
  model: newMeter.model,
  meter_sn: newMeter.meter_sn,
  protocol: newMeter.protocol,
  ip: newMeter.ip_address,
  port: newMeter.port?.toString(),
  ct_primary: newMeter.ct_primary?.toString(),
  ct_secondary: newMeter.ct_secondary?.toString(),
  pt_primary: newMeter.pt_primary?.toString(),
  pt_secondary: newMeter.pt_secondary?.toString(),
  children: []
};
```

### **2. Building Tree (Location → Building → Floor → Meter)**

#### **เมื่อกด Add Location:**
```typescript
// เหมือนกับ System Tree
const newLocation = await meterTreeService.createLocation({
  name: "ชื่อ Location",
  description: "Location created from building tree"
});
```

#### **เมื่อกด Add Building:**
```typescript
// 1. สร้าง Building ใหม่ใน database
const newBuilding = await meterTreeService.createBuilding({
  location_id: locationId, // ID ของ location parent
  name: "ชื่อ Building",
  description: "คำอธิบาย Building",
  is_active: true
});

// 2. อัปเดต local state
const newNode = {
  id: `building-${newBuilding.id}`,
  name: newBuilding.name,
  iconType: 'building',
  children: []
};
```

#### **เมื่อกด Add Floor:**
```typescript
// 1. สร้าง Floor ใหม่ใน database
const newFloor = await meterTreeService.createFloor({
  building_id: buildingId, // ID ของ building parent
  name: "ชื่อ Floor",
  floor_number: 1,
  description: "คำอธิบาย Floor",
  is_active: true
});

// 2. อัปเดต local state
const newNode = {
  id: `floor-${newFloor.id}`,
  name: newFloor.name,
  iconType: 'floor',
  children: []
};
```

#### **เมื่อกด Add Meter:**
```typescript
// 1. สร้าง Meter ใหม่ใน database
const newMeter = await meterTreeService.createMeter({
  name: "ชื่อ Meter",
  brand: "แบรนด์",
  model: "รุ่น",
  meter_sn: "หมายเลขซีเรียล",
  protocol: "โปรโตคอล",
  ip_address: "IP Address",
  slave_id: 1,
  port: 502,
  ct_primary: 100.00,
  pt_primary: 400.00,
  ct_secondary: 5.00,
  pt_secondary: 100.00,
  is_active: true,
  lognet_id: null, // ไม่ใช้ใน Building Tree
  floor_id: floorId, // ID ของ Floor parent
  is_disabled_in_building: false
});

// 2. อัปเดต local state
const newNode = {
  id: `meter-${newMeter.id}`,
  name: newMeter.name,
  iconType: 'meter',
  enabled: newMeter.is_active,
  onlineEnabled: !newMeter.is_disabled_in_building,
  brand: newMeter.brand,
  model: newMeter.model,
  meter_sn: newMeter.meter_sn,
  protocol: newMeter.protocol,
  ip: newMeter.ip_address,
  port: newMeter.port?.toString(),
  ct_primary: newMeter.ct_primary?.toString(),
  ct_secondary: newMeter.ct_secondary?.toString(),
  pt_primary: newMeter.pt_primary?.toString(),
  pt_secondary: newMeter.pt_secondary?.toString(),
  children: []
};
```

### **3. Online Tree (Filtered Building Tree)**

#### **การทำงาน:**
- Online Tree ใช้ข้อมูลจาก Building Tree แต่กรองเฉพาะ meters ที่:
  - `is_active = true`
  - `is_disabled_in_building = false`
- ไม่มีการสร้างข้อมูลใหม่ใน Online Tree
- ใช้ฟังก์ชัน `filterEnabledTree()` เพื่อกรองข้อมูล

```typescript
// กรองเฉพาะ enabled meters
function filterEnabledTree(node) {
  if (!node) return null;
  const isMeterNode = node.iconType === 'meter';
  if (isMeterNode && node.enabled === false) return null;
  if (isMeterNode && node.onlineEnabled === false) return null;
  const children = node.children ? node.children.map(filterEnabledTree).filter(Boolean) : [];
  return { ...node, children };
}
```

## ✏️ **การแก้ไขข้อมูล (Edit)**

### **เมื่อแก้ไขชื่อ Node:**
```typescript
const handleNameBlur = async () => {
  setEditingChildId(null);
  
  try {
    // อัปเดตข้อมูลใน database ตาม node type
    if (node.id.startsWith('location-')) {
      const locationId = parseInt(node.id.replace('location-', ''));
      await meterTreeService.updateLocation(locationId, {
        name: node.name,
        description: `Location updated from ${treeType} tree`
      });
    } else if (node.id.startsWith('lognet-')) {
      const lognetId = parseInt(node.id.replace('lognet-', ''));
      await meterTreeService.updateLogNet(lognetId, {
        name: node.name
      });
    } else if (node.id.startsWith('building-')) {
      const buildingId = parseInt(node.id.replace('building-', ''));
      await meterTreeService.updateBuilding(buildingId, {
        name: node.name,
        description: `Building updated from ${treeType} tree`
      });
    } else if (node.id.startsWith('floor-')) {
      const floorId = parseInt(node.id.replace('floor-', ''));
      await meterTreeService.updateFloor(floorId, {
        name: node.name,
        description: `Floor updated from ${treeType} tree`
      });
    } else if (node.id.startsWith('meter-')) {
      const meterId = parseInt(node.id.replace('meter-', ''));
      await meterTreeService.updateMeter(meterId, {
        name: node.name
      });
    }
  } catch (error) {
    console.error('Error updating node in database:', error);
  }
};
```

### **เมื่อแก้ไข Root Node:**
```typescript
const handleRootUpdate = async (idx: number) => {
  if (rootInput.trim()) {
    try {
      const node = rootNodes[idx];
      if (node.id.startsWith('location-')) {
        const locationId = parseInt(node.id.replace('location-', ''));
        await meterTreeService.updateLocation(locationId, {
          name: rootInput.trim(),
          description: `Location updated from ${treeType} tree`
        });
      }
      
      // อัปเดต local state
      setRootNodes((prev: any[]) => prev.map((sys, i) => 
        i === idx ? { ...sys, name: rootInput.trim() } : sys
      ));
      setEditingRootIndex(null);
    } catch (error) {
      console.error('Error updating root node in database:', error);
    }
  }
};
```

## 🗑️ **การลบข้อมูล (Delete)**

### **เมื่อลบ Child Node:**
```typescript
const handleDeleteNode = async (idx: number, level: number, nodeId: string) => {
  if (level === 0) {
    setConfirmDeleteIdx(idx);
    setConfirmDeleteNodeId(nodeId);
  } else {
    try {
      // ลบข้อมูลจาก database ตาม node type
      if (nodeId.startsWith('location-')) {
        const locationId = parseInt(nodeId.replace('location-', ''));
        await meterTreeService.deleteLocation(locationId);
      } else if (nodeId.startsWith('lognet-')) {
        const lognetId = parseInt(nodeId.replace('lognet-', ''));
        await meterTreeService.deleteLogNet(lognetId);
      } else if (nodeId.startsWith('building-')) {
        const buildingId = parseInt(nodeId.replace('building-', ''));
        await meterTreeService.deleteBuilding(buildingId);
      } else if (nodeId.startsWith('floor-')) {
        const floorId = parseInt(nodeId.replace('floor-', ''));
        await meterTreeService.deleteFloor(floorId);
      } else if (nodeId.startsWith('meter-')) {
        const meterId = parseInt(nodeId.replace('meter-', ''));
        await meterTreeService.deleteMeter(meterId);
      }
    } catch (error) {
      console.error('Error deleting node from database:', error);
    }
    
    // ลบจาก local state
    setRootNodes(prev => prev.map((sys, i) => i === idx ? deleteNodeById(sys, nodeId) : sys));
  }
};
```

### **เมื่อลบ Root Node:**
```typescript
const confirmDeleteRoot = async () => {
  if (confirmDeleteIdx !== null && confirmDeleteNodeId) {
    try {
      // ลบข้อมูลจาก database ตาม node type
      if (confirmDeleteNodeId.startsWith('location-')) {
        const locationId = parseInt(confirmDeleteNodeId.replace('location-', ''));
        await meterTreeService.deleteLocation(locationId);
      } else if (confirmDeleteNodeId.startsWith('lognet-')) {
        const lognetId = parseInt(confirmDeleteNodeId.replace('lognet-', ''));
        await meterTreeService.deleteLogNet(lognetId);
      } else if (confirmDeleteNodeId.startsWith('building-')) {
        const buildingId = parseInt(confirmDeleteNodeId.replace('building-', ''));
        await meterTreeService.deleteBuilding(buildingId);
      } else if (confirmDeleteNodeId.startsWith('floor-')) {
        const floorId = parseInt(confirmDeleteNodeId.replace('floor-', ''));
        await meterTreeService.deleteFloor(floorId);
      } else if (confirmDeleteNodeId.startsWith('meter-')) {
        const meterId = parseInt(confirmDeleteNodeId.replace('meter-', ''));
        await meterTreeService.deleteMeter(meterId);
      }
    } catch (error) {
      console.error('Error deleting root node from database:', error);
    }
    
    // ลบจาก local state
    setRootNodes(prev => prev.filter((_, i) => i !== confirmDeleteIdx));
    setConfirmDeleteIdx(null);
    setConfirmDeleteNodeId(null);
  }
};
```

## 🔄 **การจัดการ Error และ Fallback**

### **เมื่อ Database ไม่พร้อมใช้งาน:**
```typescript
try {
  // พยายามบันทึกลง database
  const newLocation = await meterTreeService.createLocation({
    name: rootInput.trim(),
    description: `Location created from ${treeType} tree`
  });
  
  if (newLocation) {
    // ใช้ข้อมูลจาก database
    setRootNodes(prev => prev.map((sys, i) => 
      i === idx ? { 
        ...sys, 
        id: `location-${newLocation.id}`,
        name: newLocation.name, 
        iconType: 'location' 
      } : sys
    ));
  } else {
    // ใช้ข้อมูล local
    setRootNodes(prev => prev.map((sys, i) => 
      i === idx ? { ...sys, name: rootInput.trim(), iconType: 'folder' } : sys
    ));
  }
} catch (error) {
  console.error('Error saving to database:', error);
  // ใช้ข้อมูล local เมื่อเกิด error
  setRootNodes(prev => prev.map((sys, i) => 
    i === idx ? { ...sys, name: rootInput.trim(), iconType: 'folder' } : sys
  ));
}
```

## 📊 **Database Schema ที่เกี่ยวข้อง**

### **Locations Table:**
```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **LogNets Table:**
```sql
CREATE TABLE lognets (
    id SERIAL PRIMARY KEY,
    location_id INTEGER,
    sublocation_id INTEGER NULL,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    brand VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    ip_address INET,
    subnet_mask INET,
    gateway INET,
    dns INET,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
```

### **Buildings Table:**
```sql
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    location_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
```

### **Floors Table:**
```sql
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id INTEGER,
    name VARCHAR(100) NOT NULL,
    floor_number INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);
```

### **Meters Table:**
```sql
CREATE TABLE meters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    meter_sn VARCHAR(100),
    protocol VARCHAR(50),
    ip_address INET,
    slave_id INTEGER,
    port INTEGER,
    ct_primary DECIMAL(10,2),
    pt_primary DECIMAL(10,2),
    ct_secondary DECIMAL(10,2),
    pt_secondary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- สำหรับ System Tree
    lognet_id INTEGER NULL,
    
    -- สำหรับ Building Tree
    floor_id INTEGER NULL,
    is_disabled_in_building BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lognet_id) REFERENCES lognets(id) ON DELETE SET NULL,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL
);
```

## 🎯 **สรุปการทำงาน**

### **การสร้างข้อมูล (Create):**
1. **System Tree**: Location → LogNet → Meter (ใช้ `lognet_id`)
2. **Building Tree**: Location → Building → Floor → Meter (ใช้ `floor_id`)
3. **Online Tree**: กรองจาก Building Tree (เฉพาะ enabled meters)

### **การแก้ไขข้อมูล (Update):**
- ✅ แก้ไขชื่อ node แล้วบันทึกลง database
- ✅ รองรับทุก node type (Location, LogNet, Building, Floor, Meter)
- ✅ อัปเดต description อัตโนมัติ

### **การลบข้อมูล (Delete):**
- ✅ ลบข้อมูลจาก database ก่อน
- ✅ ลบจาก local state หลัง
- ✅ รองรับการลบ root node และ child node
- ✅ มี confirmation dialog สำหรับ root node

### **การจัดการ Error:**
- ✅ Fallback ไปใช้ข้อมูล local เมื่อ database ไม่พร้อม
- ✅ แสดง error message ใน console
- ✅ ระบบยังทำงานได้แม้ database จะมีปัญหา

ทุกการดำเนินการจะ:
- ✅ บันทึกลง PostgreSQL database
- ✅ อัปเดต local state
- ✅ จัดการ error และ fallback
- ✅ รักษาความสัมพันธ์ระหว่าง tables
- ✅ ใช้ ID จาก database แทน local ID

