# Meter Tree Database Integration

## Overview

This document describes the complete integration of the meter tree system with a PostgreSQL database, based on the provided database schema. The system supports three different tree views:

1. **System Tree**: Location → LogNet → Meter
2. **Building Tree**: Location → Building → Floor → Meter  
3. **Online Tree**: Filtered Building Tree (only enabled meters)

## Database Schema

### Tables Structure

#### 1. Locations Table
```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. LogNets Table
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
    
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (sublocation_id) REFERENCES lognets(id) ON DELETE CASCADE
);
```

#### 3. Buildings Table
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

#### 4. Floors Table
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

#### 5. Meters Table
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
    
    -- สำหรับ Meter Tree System (LogNet based)
    lognet_id INTEGER NULL,
    
    -- สำหรับ Meter Tree Building/Online (Building based)
    floor_id INTEGER NULL,
    is_disabled_in_building BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lognet_id) REFERENCES lognets(id) ON DELETE SET NULL,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL
);
```

## API Endpoints

### Base URL: `/api/meter-tree`

#### Locations
- `GET /locations` - Get all locations
- `POST /locations` - Create new location
- `PUT /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location

#### LogNets
- `GET /lognets` - Get all lognets (with optional location_id filter)
- `POST /lognets` - Create new lognet
- `PUT /lognets/:id` - Update lognet
- `DELETE /lognets/:id` - Delete lognet

#### Buildings
- `GET /buildings` - Get all buildings (with optional location_id filter)
- `POST /buildings` - Create new building
- `PUT /buildings/:id` - Update building
- `DELETE /buildings/:id` - Delete building

#### Floors
- `GET /floors` - Get all floors (with optional building_id filter)
- `POST /floors` - Create new floor
- `PUT /floors/:id` - Update floor
- `DELETE /floors/:id` - Delete floor

#### Meters
- `GET /meters` - Get all meters (with optional lognet_id or floor_id filter)
- `POST /meters` - Create new meter
- `PUT /meters/:id` - Update meter
- `DELETE /meters/:id` - Delete meter

#### Tree Views
- `GET /tree/system` - Get complete system tree (Location → LogNet → Meter)
- `GET /tree/building` - Get complete building tree (Location → Building → Floor → Meter)
- `GET /tree/online` - Get online tree (filtered building tree)

#### Bulk Operations
- `POST /import-tree` - Import tree data
- `GET /export-tree` - Export tree data

## Frontend Integration

### Service Layer (`src/services/meterTreeService.ts`)

The frontend includes a comprehensive service layer that provides:

1. **TypeScript Interfaces** for all database entities
2. **CRUD Operations** for all tables
3. **Tree Building Functions** that construct the three different tree views
4. **Error Handling** and logging
5. **Bulk Operations** for import/export

### Key Features

#### Tree Building Functions
```typescript
// Build System Tree (Location -> LogNet -> Meter)
async buildSystemTree(): Promise<TreeNode[]>

// Build Building Tree (Location -> Building -> Floor -> Meter)
async buildBuildingTree(): Promise<TreeNode[]>

// Build Online Tree (filtered version of Building Tree)
async buildOnlineTree(): Promise<TreeNode[]>
```

#### TreeNode Interface
```typescript
interface TreeNode {
  id: string;
  name: string;
  iconType: 'location' | 'lognet' | 'building' | 'floor' | 'meter' | 'folder';
  children?: TreeNode[];
  enabled?: boolean;
  onlineEnabled?: boolean;
  // Additional properties for meters and lognets
}
```

## Database Setup

### 1. Run the Schema
```bash
psql -U your_username -d your_database -f database/meter_tree_schema.sql
```

### 2. Environment Variables
Make sure your server has the correct database configuration:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=webmeter
DB_PASSWORD=your_password
DB_PORT=5432
```

### 3. Server Configuration
The meter tree routes are automatically registered in `server/server.js`:
```javascript
const meterTreeRoutes = require('./routes/meter-tree');
app.use('/api/meter-tree', meterTreeRoutes);
```

## Tree Structure Mapping

### System Tree (Location → LogNet → Meter)
```
Main Factory
├── LogNet-Main
│   ├── AMR-Boiler1
│   ├── AMR-Boiler2
│   └── AMR-B1-F4
└── LogNet-Sub
    └── AMR-Draw line RPSF
```

### Building Tree (Location → Building → Floor → Meter)
```
Main Factory
├── Production Hall 1
│   └── Ground Floor
│       ├── AMR-B1-F4
│       ├── AMR-Draw line RPSF
│       └── AMR-Spinning RPSF
└── Production Hall 2
    └── (no floors/meters)
```

### Online Tree (Filtered Building Tree)
```
Main Factory
├── Production Hall 1
│   └── Ground Floor
│       ├── AMR-B1-F4 (enabled)
│       ├── AMR-Draw line RPSF (enabled)
│       └── AMR-Spinning RPSF (enabled)
└── Production Hall 2
    └── (no floors/meters)
```

## Key Features

### 1. Dual Tree Support
- Meters can belong to both LogNet (system tree) and Floor (building tree)
- `lognet_id` for system tree view
- `floor_id` for building tree view

### 2. Online Tree Filtering
- `is_disabled_in_building` flag controls visibility in building/online trees
- Online tree only shows meters where `is_active = true` AND `is_disabled_in_building = false`

### 3. Hierarchical Structure
- Locations can have multiple LogNets and Buildings
- Buildings can have multiple Floors
- LogNets and Floors can have multiple Meters

### 4. Comprehensive Indexing
- Optimized indexes for all common queries
- Composite indexes for complex filtering
- Performance optimization for large datasets

### 5. Data Integrity
- Foreign key constraints ensure referential integrity
- Cascade deletes for hierarchical relationships
- Triggers for automatic timestamp updates

## Usage Examples

### Creating a New Location
```typescript
const newLocation = await meterTreeService.createLocation({
  name: 'New Factory',
  description: 'New production facility'
});
```

### Adding a Meter to Both Trees
```typescript
const newMeter = await meterTreeService.createMeter({
  name: 'AMR-NewMeter',
  brand: 'Amptron',
  model: 'AI205-A-A-P0',
  lognet_id: 1,        // For system tree
  floor_id: 2,         // For building tree
  is_active: true,
  is_disabled_in_building: false
});
```

### Building Complete Trees
```typescript
// Get system tree
const systemTree = await meterTreeService.buildSystemTree();

// Get building tree
const buildingTree = await meterTreeService.buildBuildingTree();

// Get online tree (filtered)
const onlineTree = await meterTreeService.buildOnlineTree();
```

## Migration from Current System

The current MeterTree.tsx component can be gradually migrated to use the database:

1. **Phase 1**: Keep current localStorage functionality, add database sync
2. **Phase 2**: Replace localStorage with database calls
3. **Phase 3**: Add advanced features like bulk import/export

## Performance Considerations

1. **Indexing**: All tables have appropriate indexes for common queries
2. **Lazy Loading**: Trees can be built on-demand
3. **Caching**: Consider implementing Redis caching for frequently accessed trees
4. **Pagination**: For large datasets, implement pagination in API responses

## Security

1. **Input Validation**: All API endpoints validate input data
2. **SQL Injection Protection**: Using parameterized queries
3. **Authentication**: Can be integrated with existing auth system
4. **Authorization**: Role-based access control can be added

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live tree updates
2. **Audit Trail**: Track all changes to tree structure
3. **Versioning**: Support for tree structure versioning
4. **Backup/Restore**: Automated backup and restore functionality
5. **Advanced Filtering**: Complex filtering and search capabilities
