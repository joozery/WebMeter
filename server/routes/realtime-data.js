const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/realtime-data - ดึงข้อมูล real-time ตาม slave_id และ columns ที่เลือก
router.get('/api/realtime-data', async (req, res) => {
  try {
    const { slaveIds, columns } = req.query;
    
    console.log('🔄 === REALTIME DATA API CALL ===');
    console.log('📅 Current Time:', new Date().toLocaleString('th-TH'));
    console.log('📋 Slave IDs from frontend:', slaveIds);
    console.log('📊 Selected Columns:', columns);
    
    // ตรวจสอบ parameters
    if (!slaveIds || !columns) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing required parameters: slaveIds and columns' 
      });
    }
    
    // แปลง parameters
    const slaveIdArray = Array.isArray(slaveIds) ? slaveIds : slaveIds.split(',').map(id => parseInt(id.trim()));
    const columnArray = Array.isArray(columns) ? columns : columns.split(',');
    
    console.log('🔢 Slave IDs array:', slaveIdArray);
    console.log('📋 Columns array:', columnArray);
    
         // สร้าง mapping สำหรับ column names ไปยัง database fields
     const columnMapping = {
       'Frequency': 'param_01_freqency',
       'Volt AN': 'param_02_voltage_phase_1',
       'Volt BN': 'param_03_voltage_phase_2',
       'Volt CN': 'param_04_voltage_phase_3',
       'Volt LN Avg': 'param_05_voltage_avg_phase',
       'Volt AB': 'param_06_voltage_line_1_2',
       'Volt BC': 'param_07_voltage_line_2_3',
       'Volt CA': 'param_08_voltage_line_3_1',
       'Volt LL Avg': 'param_09_voltage_avg_line',
       'Current A': 'param_10_current_phase_a',
       'Current B': 'param_11_current_phase_b',
       'Current C': 'param_12_current_phase_c',
       'Current Avg': 'param_13_current_avg_phase',
       'Current IN': 'param_14_current_neutral',
       'Watt A': 'param_15_power_phase_a',
       'Watt B': 'param_16_power_phase_b',
       'Watt C': 'param_17_power_phase_c',
       'Watt Total': 'param_18_power_total_system',
       'Var A': 'param_19_reactive_power_phase_a',
       'Var B': 'param_20_reactive_power_phase_b',
       'Var C': 'param_21_reactive_power_phase_c',
       'Var total': 'param_22_reactive_power_total',
       'VA A': 'param_23_apparent_power_phase_a',
       'VA B': 'param_24_apparent_power_phase_b',
       'VA C': 'param_25_apparent_power_phase_c',
       'VA Total': 'param_26_apparent_power_total',
       'PF A': 'param_27_power_factor_phase_a',
       'PF B': 'param_28_power_factor_phase_b',
       'PF C': 'param_29_power_factor_phase_c',
       'PF Total': 'param_30_power_factor_total',
       'Demand W': 'param_31_power_demand',
       'Demand Var': 'param_32_reactive_power_demand',
       'Demand VA': 'param_33_apparent_power_demand',
       'Import kWh': 'param_34_import_kwh',
       'Export kWh': 'param_35_export_kwh',
       'Import kVarh': 'param_36_import_kvarh',
       'Export kVarh': 'param_37_export_kvarh',
       'THDV': 'param_38_thdv',
       'THDI': 'param_39_thdi'
     };
    
    // สร้าง SELECT clause
    const selectFields = columnArray.map(col => {
      const dbField = columnMapping[col];
      if (!dbField) {
        console.log(`⚠️ Warning: No mapping found for column: ${col}`);
        return `NULL as "${col}"`;
      }
      return `${dbField} as "${col}"`;
    });
    
    // เพิ่ม slave_id และ reading_timestamp
    selectFields.unshift('slave_id', 'reading_timestamp');
    
    const selectClause = selectFields.join(', ');
    
    // สร้าง WHERE clause สำหรับ slave_id และเวลาปัจจุบัน
    const now = new Date();
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    const nextMinute = new Date(currentMinute.getTime() + 60000); // +1 นาที
    
    console.log('⏰ Time Range:', {
      from: currentMinute.toISOString(),
      to: nextMinute.toISOString()
    });
    
    // สร้าง SQL query
    const query = `
      SELECT ${selectClause}
      FROM parameters_value 
      WHERE slave_id = ANY($1)
        AND reading_timestamp >= $2 
        AND reading_timestamp < $3
      ORDER BY slave_id, reading_timestamp DESC
    `;
    
    const queryParams = [slaveIdArray, currentMinute, nextMinute];
    
    console.log('🔍 Executing query:', query);
    console.log('📋 Query parameters:', queryParams);
    
    // ดึงข้อมูลจากฐานข้อมูล
    const result = await parametersPool.query(query, queryParams);
    
    console.log('✅ Query executed successfully');
    console.log('📊 Total rows fetched:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('📋 First row sample:', result.rows[0]);
      console.log('🔢 Unique Slave IDs in result:', [...new Set(result.rows.map(row => row.slave_id))]);
    } else {
      console.log('⚠️ No data found for the specified time range and slave IDs');
    }
    
    // จัดกลุ่มข้อมูลตาม slave_id
    const groupedData = {};
    slaveIdArray.forEach(slaveId => {
      const slaveData = result.rows.filter(row => row.slave_id === slaveId);
      if (slaveData.length > 0) {
        // ใช้ข้อมูลล่าสุด
        groupedData[slaveId] = slaveData[0];
      } else {
        // หากไม่มีข้อมูล ให้สร้าง object ว่าง
        groupedData[slaveId] = {
          slave_id: slaveId,
          reading_timestamp: currentMinute,
          ...columnArray.reduce((acc, col) => {
            acc[col] = null;
            return acc;
          }, {})
        };
      }
    });
    
    console.log('📊 Grouped data by slave_id:', Object.keys(groupedData));
    console.log('================================');
    
    res.json({
      success: true,
      data: groupedData,
      timestamp: currentMinute.toISOString(),
      queryInfo: {
        slaveIds: slaveIdArray,
        columns: columnArray,
        timeRange: {
          from: currentMinute.toISOString(),
          to: nextMinute.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in realtime-data API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

module.exports = router;
