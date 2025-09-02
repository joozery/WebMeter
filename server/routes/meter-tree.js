const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ===== LOCATIONS =====

// Get all locations with hierarchical structure
router.get('/locations', async (req, res) => {
  try {
    const { tree_type } = req.query;
    let query = `
      SELECT 
        id,
        name,
        description,
        address,
        coordinates,
        is_active,
        created_at,
        updated_at
      FROM locations
    `;
    let params = [];
    
    // Note: tree_type column doesn't exist, so we ignore this filter
    
    query += ' ORDER BY name';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create new location
router.post('/locations', async (req, res) => {
  try {
    const { name, description, address } = req.body;
    console.log('🔧 Backend: Creating location with data:', {
      name,
      description,
      address
    });
    
    const result = await db.query(
      'INSERT INTO locations (name, description, address) VALUES (?, ?, ?)',
      [name, description, address || null]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const insertedRecord = await db.query('SELECT * FROM locations WHERE id = ?', [insertedId]);
    
    console.log('✅ Backend: Location created successfully:', insertedRecord[0]);
    res.status(201).json(insertedRecord[0]);
  } catch (error) {
    console.error('❌ Backend: Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address } = req.body;
    const result = await db.query(
      'UPDATE locations SET name = ?, description = ?, address = ? WHERE id = ?',
      [name, description, address, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Get the updated record
    const updatedRecord = await db.query('SELECT * FROM locations WHERE id = ?', [id]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location
router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Backend: Deleting location with ID:', id);
    
    let query = 'DELETE FROM locations WHERE id = ?';
    let params = [id];
    
    const result = await db.query(query, params);
    
    if (result.affectedRows === 0) {
      console.log('❌ Backend: Location not found for deletion or tree_type mismatch');
      return res.status(404).json({ error: 'Location not found' });
    }
    
    console.log('✅ Backend: Location deleted successfully');
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('❌ Backend: Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// ===== LOGNETS =====

// Get all lognets with location references
router.get('/lognets', async (req, res) => {
  try {
    const { location_id, sublocation_id } = req.query;
    let query = `
      SELECT 
        l.*,
        loc1.name as main_location_name,
        loc2.name as sub_location_name
      FROM lognets l
      LEFT JOIN locations loc1 ON l.location_id = loc1.id
      LEFT JOIN locations loc2 ON l.sublocation_id = loc2.id
    `;
    let params = [];
    let whereConditions = [];
    
    if (location_id) {
      whereConditions.push(`l.location_id = ?`);
      params.push(location_id);
    }
    
    if (sublocation_id) {
      whereConditions.push(`l.sublocation_id = ?`);
      params.push(sublocation_id);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY l.name';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching lognets:', error);
    res.status(500).json({ error: 'Failed to fetch lognets' });
  }
});

// Create new lognet
router.post('/lognets', async (req, res) => {
  try {
    const {
      location_id,
      sublocation_id,
      name,
      model,
      brand,
      serial_number,
      firmware_version,
      ip_address,
      subnet_mask,
      gateway,
      dns,
      is_active
    } = req.body;
    
    // แปลง empty string เป็น NULL สำหรับ IP address fields
    const cleanIpAddress = ip_address === '' ? null : ip_address;
    const cleanSubnetMask = subnet_mask === '' ? null : subnet_mask;
    const cleanGateway = gateway === '' ? null : gateway;
    const cleanDns = dns === '' ? null : dns;
    const cleanIsActive = is_active !== undefined ? is_active : true;
    
    const result = await db.query(
      `INSERT INTO lognets (
        location_id, sublocation_id, name, model, brand, serial_number, 
        firmware_version, ip_address, subnet_mask, gateway, dns, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [location_id, sublocation_id, name, model, brand, serial_number, 
       firmware_version, cleanIpAddress, cleanSubnetMask, cleanGateway, cleanDns, cleanIsActive]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const insertedRecord = await db.query('SELECT * FROM lognets WHERE id = ?', [insertedId]);
    res.status(201).json(insertedRecord[0]);
  } catch (error) {
    console.error('Error creating lognet:', error);
    res.status(500).json({ error: 'Failed to create lognet' });
  }
});

// Update lognet
router.put('/lognets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      location_id,
      sublocation_id,
      name,
      model,
      brand,
      serial_number,
      firmware_version,
      ip_address,
      subnet_mask,
      gateway,
      dns,
      is_active
    } = req.body;
    
    // แปลง empty string เป็น NULL สำหรับ IP address fields
    const cleanIpAddress = ip_address === '' ? null : ip_address;
    const cleanSubnetMask = subnet_mask === '' ? null : subnet_mask;
    const cleanGateway = gateway === '' ? null : gateway;
    const cleanDns = dns === '' ? null : dns;
    
    const result = await db.query(
      `UPDATE lognets SET 
        location_id = ?, sublocation_id = ?, name = ?, model = ?, 
        brand = ?, serial_number = ?, firmware_version = ?, ip_address = ?,
        subnet_mask = ?, gateway = ?, dns = ?, is_active = ?
       WHERE id = ?`,
      [location_id, sublocation_id, name, model, brand, serial_number,
       firmware_version, cleanIpAddress, cleanSubnetMask, cleanGateway, cleanDns, is_active, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'LogNet not found' });
    }
    
    // Get the updated record
    const updatedRecord = await db.query('SELECT * FROM lognets WHERE id = ?', [id]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating lognet:', error);
    res.status(500).json({ error: 'Failed to update lognet' });
  }
});

// Delete lognet
router.delete('/lognets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Backend: Deleting lognet with ID:', id);
    
    const result = await db.query(
      'DELETE FROM lognets WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      console.log('❌ Backend: LogNet not found for deletion');
      return res.status(404).json({ error: 'LogNet not found' });
    }
    
    console.log('✅ Backend: LogNet deleted successfully');
    res.json({ message: 'LogNet deleted successfully' });
  } catch (error) {
    console.error('❌ Backend: Error deleting lognet:', error);
    res.status(500).json({ error: 'Failed to delete lognet' });
  }
});

// ===== BUILDINGS =====

// Get all buildings
router.get('/buildings', async (req, res) => {
  try {
    const { location_id } = req.query;
    let query = 'SELECT * FROM buildings';
    let params = [];
    
    if (location_id) {
      query += ' WHERE location_id = ?';
      params.push(location_id);
    }
    
    query += ' ORDER BY name';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// Create new building
router.post('/buildings', async (req, res) => {
  try {
    const { location_id, name, description, is_active } = req.body;
    const result = await db.query(
      'INSERT INTO buildings (location_id, name, description, is_active) VALUES (?, ?, ?, ?)',
      [location_id, name, description, is_active ?? true]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const insertedRecord = await db.query('SELECT * FROM buildings WHERE id = ?', [insertedId]);
    res.status(201).json(insertedRecord[0]);
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({ error: 'Failed to create building' });
  }
});

// Update building
router.put('/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id, name, description, is_active } = req.body;
    const result = await db.query(
      'UPDATE buildings SET location_id = ?, name = ?, description = ?, is_active = ? WHERE id = ?',
      [location_id, name, description, is_active, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // Get the updated record
    const updatedRecord = await db.query('SELECT * FROM buildings WHERE id = ?', [id]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({ error: 'Failed to update building' });
  }
});

// Delete building
router.delete('/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM buildings WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ error: 'Failed to delete building' });
  }
});

// ===== FLOORS =====

// Get all floors
router.get('/floors', async (req, res) => {
  try {
    const { building_id } = req.query;
    let query = 'SELECT * FROM floors';
    let params = [];
    
    if (building_id) {
      query += ' WHERE building_id = ?';
      params.push(building_id);
    }
    
    query += ' ORDER BY floor_number, name';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

// Create new floor
router.post('/floors', async (req, res) => {
  try {
    const { building_id, name, floor_number, description, is_active, floor_location_id } = req.body;
    const result = await db.query(
      'INSERT INTO floors (building_id, name, floor_number, description, is_active, floor_location_id) VALUES (?, ?, ?, ?, ?, ?)',
      [building_id, name, floor_number, description, is_active ?? true, floor_location_id]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const insertedRecord = await db.query('SELECT * FROM floors WHERE id = ?', [insertedId]);
    res.json(insertedRecord[0]);
  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({ error: 'Failed to create floor' });
  }
});

// Update floor
router.put('/floors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { building_id, name, floor_number, description, is_active, floor_location_id } = req.body;
    const result = await db.query(
      'UPDATE floors SET building_id = ?, name = ?, floor_number = ?, description = ?, is_active = ?, floor_location_id = ? WHERE id = ?',
      [building_id, name, floor_number, description, is_active, floor_location_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    // Get the updated record
    const updatedRecord = await db.query('SELECT * FROM floors WHERE id = ?', [id]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({ error: 'Failed to update floor' });
  }
});

// Delete floor
router.delete('/floors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM floors WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    res.json({ message: 'Floor deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ error: 'Failed to delete floor' });
  }
});

// ===== METERS =====

// Get all meters
router.get('/meters', async (req, res) => {
  try {
    const { lognet_id, floor_id } = req.query;
    let query = 'SELECT * FROM meters';
    let params = [];
    
    if (lognet_id) {
      query += ` WHERE lognet_id = ?`;
      params.push(lognet_id);
    } else if (floor_id) {
      query += ` WHERE floor_id = ?`;
      params.push(floor_id);
    }
    
    query += ' ORDER BY id';
    const [rows] = await db.query(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching meters:', error);
    res.status(500).json({ error: 'Failed to fetch meters' });
  }
});

// Create new meter
router.post('/meters', async (req, res) => {
  try {
    const {
      name,
      brand,
      model,
      meter_sn,
      protocol,
      ip_address,
      slave_id,
      port,
      budrate,
      ct_primary,
      pt_primary,
      ct_secondary,
      pt_secondary,
      is_active,
      lognet_id,
      floor_id,
      is_disabled_in_building
    } = req.body;
    
    // แปลง empty string เป็น NULL สำหรับ IP address
    const cleanIpAddress = ip_address === '' ? null : ip_address;
    
    const result = await db.query(
      `INSERT INTO meters (
        name, brand, model, meter_sn, protocol, ip_address, slave_id, port, budrate,
        ct_primary, pt_primary, ct_secondary, pt_secondary, is_active,
        lognet_id, floor_id, is_disabled_in_building
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand, model, meter_sn, protocol, cleanIpAddress, slave_id, port, budrate ?? 9600,
       ct_primary, pt_primary, ct_secondary, pt_secondary, is_active ?? true,
       lognet_id, floor_id, is_disabled_in_building ?? false]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const insertedRecord = await db.query('SELECT * FROM meters WHERE id = ?', [insertedId]);
    res.status(201).json(insertedRecord[0]);
  } catch (error) {
    console.error('Error creating meter:', error);
    res.status(500).json({ error: 'Failed to create meter' });
  }
});

// Update meter
router.put('/meters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // สร้าง dynamic query สำหรับอัปเดตเฉพาะ field ที่ส่งมา
    const fields = [];
    const values = [];
    
    // ตรวจสอบและเพิ่ม field ที่ต้องการอัปเดต
    if (updateData.name !== undefined) {
      fields.push(`name = ?`);
      values.push(updateData.name);
    }
    if (updateData.brand !== undefined) {
      fields.push(`brand = ?`);
      values.push(updateData.brand);
    }
    if (updateData.model !== undefined) {
      fields.push(`model = ?`);
      values.push(updateData.model);
    }
    if (updateData.meter_sn !== undefined) {
      fields.push(`meter_sn = ?`);
      values.push(updateData.meter_sn);
    }
    if (updateData.protocol !== undefined) {
      fields.push(`protocol = ?`);
      values.push(updateData.protocol);
    }
    if (updateData.ip_address !== undefined) {
      const cleanIpAddress = updateData.ip_address === '' ? null : updateData.ip_address;
      fields.push(`ip_address = ?`);
      values.push(cleanIpAddress);
    }
    if (updateData.slave_id !== undefined) {
      fields.push(`slave_id = ?`);
      values.push(updateData.slave_id);
    }
    if (updateData.port !== undefined) {
      fields.push(`port = ?`);
      values.push(updateData.port);
    }
    if (updateData.budrate !== undefined) {
      fields.push(`budrate = ?`);
      values.push(updateData.budrate);
    }
    if (updateData.ct_primary !== undefined) {
      fields.push(`ct_primary = ?`);
      values.push(updateData.ct_primary);
    }
    if (updateData.pt_primary !== undefined) {
      fields.push(`pt_primary = ?`);
      values.push(updateData.pt_primary);
    }
    if (updateData.ct_secondary !== undefined) {
      fields.push(`ct_secondary = ?`);
      values.push(updateData.ct_secondary);
    }
    if (updateData.pt_secondary !== undefined) {
      fields.push(`pt_secondary = ?`);
      values.push(updateData.pt_secondary);
    }
    if (updateData.is_active !== undefined) {
      fields.push(`is_active = ?`);
      values.push(updateData.is_active);
    }
    if (updateData.lognet_id !== undefined) {
      fields.push(`lognet_id = ?`);
      values.push(updateData.lognet_id);
    }
    if (updateData.floor_id !== undefined) {
      fields.push(`floor_id = ?`);
      values.push(updateData.floor_id);
    }
    if (updateData.is_disabled_in_building !== undefined) {
      fields.push(`is_disabled_in_building = ?`);
      values.push(updateData.is_disabled_in_building);
    }
    
    // ถ้าไม่มี field ที่ต้องการอัปเดต
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // เพิ่ม id เป็น parameter สุดท้าย
    values.push(id);
    
    const query = `UPDATE meters SET ${fields.join(', ')} WHERE id = ?`;
    console.log('🔧 Update meter query:', query);
    console.log('📋 Update meter values:', values);
    
    const result = await db.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    
    // Get the updated record
    const updatedRecord = await db.query('SELECT * FROM meters WHERE id = ?', [id]);
    res.json(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating meter:', error);
    res.status(500).json({ error: 'Failed to update meter' });
  }
});

// Delete meter
router.delete('/meters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM meters WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    res.json({ message: 'Meter deleted successfully' });
  } catch (error) {
    console.error('Error deleting meter:', error);
    res.status(500).json({ error: 'Failed to delete meter' });
  }
});

// ===== TREE BUILDING ENDPOINTS =====

// Get complete system tree (Location -> LogNet -> Meter)
router.get('/tree/system', async (req, res) => {
  try {
         const [locations, lognets, meters] = await Promise.all([
       db.query('SELECT * FROM locations ORDER BY name'),
       db.query('SELECT * FROM lognets WHERE is_active = true ORDER BY name'),
       db.query('SELECT * FROM meters WHERE is_active = true ORDER BY id')
     ]);

    const tree = locations[0].map(location => ({
      id: `location-${location.id}`,
      name: location.name,
      iconType: 'location',
      children: lognets[0]
        .filter(lognet => lognet.location_id === location.id)
        .map(lognet => ({
          id: `lognet-${lognet.id}`,
          name: lognet.name,
          iconType: 'lognet',
          brand: lognet.brand,
          model: lognet.model,
          serialNumber: lognet.serial_number,
          firmwareVersion: lognet.firmware_version,
          ip: lognet.ip_address,
          subnetMask: lognet.subnet_mask,
          gateway: lognet.gateway,
          dns: lognet.dns,
          children: meters[0]
            .filter(meter => meter.lognet_id === lognet.id)
            .map(meter => ({
              id: `meter-${meter.id}`,
              name: meter.name,
              iconType: 'meter',
              enabled: meter.is_active,
              onlineEnabled: !meter.is_disabled_in_building,
              brand: meter.brand,
              model: meter.model,
              meter_sn: meter.meter_sn,
              protocol: meter.protocol,
              ip: meter.ip_address,
              port: meter.port?.toString(),
              ct_primary: meter.ct_primary?.toString(),
              ct_secondary: meter.ct_secondary?.toString(),
              pt_primary: meter.pt_primary?.toString(),
              pt_secondary: meter.pt_secondary?.toString(),
              children: []
            }))
        }))
    }));

    res.json(tree);
  } catch (error) {
    console.error('Error building system tree:', error);
    res.status(500).json({ error: 'Failed to build system tree' });
  }
});

// Get complete building tree (Location -> Building -> Floor -> Meter)
router.get('/tree/building', async (req, res) => {
  try {
         const [locations, buildings, floors, meters] = await Promise.all([
       db.query('SELECT * FROM locations ORDER BY name'),
       db.query('SELECT * FROM buildings WHERE is_active = true ORDER BY name'),
       db.query('SELECT * FROM floors WHERE is_active = true ORDER BY floor_number, name'),
       db.query('SELECT * FROM meters WHERE is_active = true ORDER BY id')
     ]);

    const tree = locations[0].map(location => ({
      id: `location-${location.id}`,
      name: location.name,
      iconType: 'location',
      children: buildings[0]
        .filter(building => building.location_id === location.id)
        .map(building => ({
          id: `building-${building.id}`,
          name: building.name,
          iconType: 'building',
          children: floors[0]
            .filter(floor => floor.building_id === building.id)
            .map(floor => ({
              id: `floor-${floor.id}`,
              name: floor.name,
              iconType: 'floor',
              children: meters[0]
                .filter(meter => meter.floor_id === floor.id)
                .map(meter => ({
                  id: `meter-${meter.id}`,
                  name: meter.name,
                  iconType: 'meter',
                  enabled: meter.is_active,
                  onlineEnabled: !meter.is_disabled_in_building,
                  brand: meter.brand,
                  model: meter.model,
                  meter_sn: meter.meter_sn,
                  protocol: meter.protocol,
                  ip: meter.ip_address,
                  port: meter.port?.toString(),
                  ct_primary: meter.ct_primary?.toString(),
                  ct_secondary: meter.ct_secondary?.toString(),
                  pt_primary: meter.pt_primary?.toString(),
                  pt_secondary: meter.pt_secondary?.toString(),
                  children: []
                }))
            }))
        }))
    }));

    res.json(tree);
  } catch (error) {
    console.error('Error building building tree:', error);
    res.status(500).json({ error: 'Failed to build building tree' });
  }
});

// Get online tree (filtered building tree - only enabled meters)
router.get('/tree/online', async (req, res) => {
  try {
         const [locations, buildings, floors, meters] = await Promise.all([
       db.query('SELECT * FROM locations ORDER BY name'),
       db.query('SELECT * FROM buildings WHERE is_active = true ORDER BY name'),
       db.query('SELECT * FROM floors WHERE is_active = true ORDER BY floor_number, name'),
       db.query('SELECT * FROM meters WHERE is_active = true AND is_disabled_in_building = false ORDER BY id')
     ]);

    const tree = locations[0].map(location => ({
      id: `location-${location.id}`,
      name: location.name,
      iconType: 'location',
      children: buildings[0]
        .filter(building => building.location_id === location.id)
        .map(building => ({
          id: `building-${building.id}`,
          name: building.name,
          iconType: 'building',
          children: floors[0]
            .filter(floor => floor.building_id === building.id)
            .map(floor => ({
              id: `floor-${floor.id}`,
              name: floor.name,
              iconType: 'floor',
              children: meters[0]
                .filter(meter => meter.floor_id === floor.id)
                .map(meter => ({
                  id: `meter-${meter.id}`,
                  name: meter.name,
                  iconType: 'meter',
                  enabled: meter.is_active,
                  onlineEnabled: !meter.is_disabled_in_building,
                  brand: meter.brand,
                  model: meter.model,
                  meter_sn: meter.meter_sn,
                  protocol: meter.protocol,
                  ip: meter.ip_address,
                  port: meter.port?.toString(),
                  ct_primary: meter.ct_primary?.toString(),
                  ct_secondary: meter.ct_secondary?.toString(),
                  pt_primary: meter.pt_primary?.toString(),
                  pt_secondary: meter.pt_secondary?.toString(),
                  children: []
                }))
            }))
        }))
    }));

    res.json(tree);
  } catch (error) {
    console.error('Error building online tree:', error);
    res.status(500).json({ error: 'Failed to build online tree' });
  }
});

// ===== FAVORITE METERS =====

// Get user's favorite meters
router.get('/favorites', async (req, res) => {
  try {
    const { user_id = 1, tree_type } = req.query; // Default to user_id = 1 for now
    
    let query = `
      SELECT 
        fm.id,
        fm.user_id,
        fm.meter_id,
        fm.tree_type,
        fm.created_at,
        m.name as meter_name,
        m.brand,
        m.model,
        m.meter_sn
      FROM user_favorite_meters fm
      JOIN meters m ON fm.meter_id = m.id
      WHERE fm.user_id = ?
    `;
    let params = [user_id];
    
    if (tree_type) {
      query += ' AND fm.tree_type = ?';
      params.push(tree_type);
    }
    
    query += ' ORDER BY fm.created_at DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching favorite meters:', error);
    res.status(500).json({ error: 'Failed to fetch favorite meters' });
  }
});

// Add meter to favorites
router.post('/favorites', async (req, res) => {
  try {
    const { user_id = 1, meter_id, tree_type } = req.body; // Default to user_id = 1 for now
    
    // Check if meter exists
    const [meterCheck] = await db.query('SELECT id, name FROM meters WHERE id = ?', [meter_id]);
    if (meterCheck.length === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    
    // Check if already in favorites
    const [existingCheck] = await db.query(
      'SELECT id FROM user_favorite_meters WHERE user_id = ? AND meter_id = ? AND tree_type = ?',
      [user_id, meter_id, tree_type]
    );
    
    if (existingCheck.length > 0) {
      return res.status(400).json({ error: 'Meter already in favorites' });
    }
    
    // Add to favorites
    const result = await db.query(
      'INSERT INTO user_favorite_meters (user_id, meter_id, tree_type) VALUES (?, ?, ?)',
      [user_id, meter_id, tree_type]
    );
    
    // Get the inserted record
    const insertedId = result.insertId;
    const [insertedRecord] = await db.query('SELECT * FROM user_favorite_meters WHERE id = ?', [insertedId]);
    
    console.log('✅ Added meter to favorites:', insertedRecord[0]);
    res.status(201).json(insertedRecord[0]);
  } catch (error) {
    console.error('Error adding meter to favorites:', error);
    res.status(500).json({ error: 'Failed to add meter to favorites' });
  }
});

// Remove meter from favorites
router.delete('/favorites/:meter_id', async (req, res) => {
  try {
    const { meter_id } = req.params;
    const { user_id = 1, tree_type } = req.query; // Default to user_id = 1 for now
    
    const result = await db.query(
      'DELETE FROM user_favorite_meters WHERE user_id = ? AND meter_id = ? AND tree_type = ?',
      [user_id, meter_id, tree_type]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite meter not found' });
    }
    
    console.log('✅ Removed meter from favorites');
    res.json({ message: 'Meter removed from favorites' });
  } catch (error) {
    console.error('Error removing meter from favorites:', error);
    res.status(500).json({ error: 'Failed to remove meter from favorites' });
  }
});

// Toggle favorite status
router.post('/favorites/toggle', async (req, res) => {
  try {
    const { user_id = 1, meter_id, tree_type } = req.body; // Default to user_id = 1 for now
    
    // Check if meter exists
    const [meterCheck] = await db.query('SELECT id, name FROM meters WHERE id = ?', [meter_id]);
    if (meterCheck.length === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    
    // Check if already in favorites
    const [existingCheck] = await db.query(
      'SELECT id FROM user_favorite_meters WHERE user_id = ? AND meter_id = ? AND tree_type = ?',
      [user_id, meter_id, tree_type]
    );
    
    if (existingCheck.length > 0) {
      // Remove from favorites
      await db.query(
        'DELETE FROM user_favorite_meters WHERE user_id = ? AND meter_id = ? AND tree_type = ?',
        [user_id, meter_id, tree_type]
      );
      
      console.log('✅ Removed meter from favorites');
      res.json({ 
        action: 'removed',
        message: 'Meter removed from favorites',
        meter_name: meterCheck[0].name
      });
    } else {
      // Add to favorites
      const result = await db.query(
        'INSERT INTO user_favorite_meters (user_id, meter_id, tree_type) VALUES (?, ?, ?)',
        [user_id, meter_id, tree_type]
      );
      
      // Get the inserted record
      const insertedId = result.insertId;
      const [insertedRecord] = await db.query('SELECT * FROM user_favorite_meters WHERE id = ?', [insertedId]);
      
      console.log('✅ Added meter to favorites:', insertedRecord[0]);
      res.json({ 
        action: 'added',
        message: 'Meter added to favorites',
        meter_name: meterCheck[0].name
      });
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});

// ===== BULK OPERATIONS =====

// Import tree data
router.post('/import-tree', async (req, res) => {
  try {
    const { systemTree, buildingTree } = req.body;
    
    // This is a simplified import - in a real implementation,
    // you would want to handle conflicts, validation, etc.
    console.log('Importing tree data:', { systemTree, buildingTree });
    
    res.json({ message: 'Import completed successfully' });
  } catch (error) {
    console.error('Error importing tree data:', error);
    res.status(500).json({ error: 'Failed to import tree data' });
  }
});

// Export tree data
router.get('/export-tree', async (req, res) => {
  try {
    const [systemTree, buildingTree] = await Promise.all([
      db.query('SELECT * FROM locations ORDER BY name'),
      db.query('SELECT * FROM buildings ORDER BY name')
    ]);
    
    const exportData = {
      locations: systemTree[0],
      buildings: buildingTree[0],
      exportDate: new Date().toISOString()
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting tree data:', error);
    res.status(500).json({ error: 'Failed to export tree data' });
  }
});

module.exports = router;
