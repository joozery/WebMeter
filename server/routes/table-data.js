const express = require('express');
const db = require('../config/database');
const router = express.Router(); 

// Mapping ระหว่างชื่อ column ใน UI กับ column ใน database
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

// GET /api/table-data - ดึงข้อมูลตามช่วงวันเวลาและคอลัมน์ที่เลือก
router.get('/', async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      timeFrom = '00:00',
      timeTo = '23:59',
      columns,
      slaveIds, // ใช้ slaveIds สำหรับกรองตาม slave_id
      interval
    } = req.query;

    // ตรวจสอบ required parameters
    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'dateFrom and dateTo are required'
      });
    }

    // สร้าง datetime strings
    const startDateTime = `${dateFrom} ${timeFrom}:00`;
    const endDateTime = `${dateTo} ${timeTo}:00`;

    // สร้างรายการคอลัมน์ที่จะ select - ใช้ทุกคอลัมน์ที่มี
    const allColumns = [
      'reading_timestamp',
      'param_01_freqency',
      'param_02_voltage_phase_1',
      'param_03_voltage_phase_2', 
      'param_04_voltage_phase_3',
      'param_05_voltage_avg_phase',
      'param_06_voltage_line_1_2',
      'param_07_voltage_line_2_3',
      'param_08_voltage_line_3_1',
      'param_09_voltage_avg_line',
      'param_10_current_phase_a',
      'param_11_current_phase_b',
      'param_12_current_phase_c',
      'param_13_current_avg_phase',
      'param_14_current_neutral',
      'param_15_power_phase_a',
      'param_16_power_phase_b',
      'param_17_power_phase_c',
      'param_18_power_total_system',
      'param_19_reactive_power_phase_a',
      'param_20_reactive_power_phase_b',
      'param_21_reactive_power_phase_c',
      'param_22_reactive_power_total',
      'param_23_apparent_power_phase_a',
      'param_24_apparent_power_phase_b',
      'param_25_apparent_power_phase_c',
      'param_26_apparent_power_total',
      'param_27_power_factor_phase_a',
      'param_28_power_factor_phase_b',
      'param_29_power_factor_phase_c',
      'param_30_power_factor_total',
      'param_31_power_demand',
      'param_32_reactive_power_demand',
      'param_33_apparent_power_demand',
      'param_34_import_kwh',
      'param_35_export_kwh',
      'param_36_import_kvarh',
      'param_37_export_kvarh',
      'param_38_thdv',
      'param_39_thdi'
    ];

    let selectedColumns = ['reading_timestamp']; // เริ่มด้วย timestamp เสมอ
    let selectedDbColumns = allColumns; // ใช้ทุกคอลัมน์
    
    if (columns && Array.isArray(columns)) {
      columns.forEach(col => {
        if (columnMapping[col]) {
          selectedColumns.push(col);
        }
      });
    } else {
      // ถ้าไม่ระบุคอลัมน์ให้แสดงทั้งหมด
      Object.keys(columnMapping).forEach(col => {
        selectedColumns.push(col);
      });
    }

    // แปลง slaveIds เป็น array ถ้ามี
    let slaveIdArray = [];
    if (slaveIds) {
      slaveIdArray = Array.isArray(slaveIds) ? slaveIds : [slaveIds];
    }
    
    // Debug: ตรวจสอบ slaveIds
    console.log('🔍 === SLAVE ID DEBUG ===');
    console.log('🔢 slaveIds (raw):', slaveIds);
    console.log('🔢 slaveIds type:', typeof slaveIds);
    console.log('🔢 slaveIds isArray:', Array.isArray(slaveIds));
    console.log('🔢 slaveIdArray:', slaveIdArray);
    console.log('🔢 slaveIdArray.length:', slaveIdArray.length);
    console.log('================================');

    // Log ข้อมูลการประมวลผล
    console.log('🔧 === BACKEND PROCESSING LOG ===');
    console.log('📅 Date Range:', `${startDateTime} to ${endDateTime}`);
    console.log('🔢 Slave IDs from frontend:', slaveIds);
    console.log('🔢 Slave IDs array:', slaveIdArray);
    console.log('📊 Selected Columns:', selectedColumns);
    console.log('⏱️ Interval:', interval);
    console.log('================================');

         // สร้าง SQL query
     let query = `
       SELECT ${selectedDbColumns.join(', ')}
       FROM parameters_value
       WHERE reading_timestamp >= ? 
       AND reading_timestamp <= ?
     `;
    
    // เพิ่มเงื่อนไข slave_id ถ้ามี (ตรวจสอบว่าตารางมีคอลัมน์ slave_id หรือไม่)
    if (slaveIdArray.length > 0) {
      // ตรวจสอบว่าตารางมีคอลัมน์ slave_id หรือไม่
      const checkSlaveIdQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'parameters_value' 
        AND column_name = 'slave_id'
      `;
      
             try {
         const [slaveIdCheck] = await db.query(checkSlaveIdQuery);
         if (slaveIdCheck.length > 0) {
           query += ` AND slave_id IN (?)`;
           console.log('✅ Added slave_id filter to query (column exists)');
         } else {
           console.log('⚠️ slave_id column does not exist in parameters_value table');
           console.log('⚠️ Available columns:', selectedDbColumns);
         }
       } catch (error) {
         console.log('⚠️ Error checking slave_id column:', error.message);
       }
    } else {
      console.log('❌ No slave_id filter added (slaveIdArray.length = 0)');
    }
    
         // เพิ่มเงื่อนไขสำหรับ interval 15 นาที
     if (interval === '15') {
       query = `
         SELECT ${selectedDbColumns.join(', ')}
         FROM parameters_value
         WHERE reading_timestamp >= ? 
         AND reading_timestamp <= ?
         ${slaveIdArray.length > 0 ? 'AND slave_id IN (?)' : ''}
         AND MINUTE(reading_timestamp) % 15 = 0
       `;
     }
    
    const queryParams = [startDateTime, endDateTime];
    if (slaveIdArray.length > 0) {
      queryParams.push(slaveIdArray);
      console.log('✅ Added slaveIdArray to queryParams:', slaveIdArray);
    } else {
      console.log('❌ No slaveIdArray added to queryParams');
    }

    // เพิ่มเงื่อนไข meter_id ถ้ามี (ถ้าตารางมีคอลัมน์นี้)
    // if (meterId) {
    //   query += ` AND meter_id = $3`;
    //   queryParams.push(meterId);
    // }

    // เรียงลำดับตาม timestamp
    query += ` ORDER BY reading_timestamp ASC`;

    console.log('🔍 Executing query:', query);
    console.log('📊 Parameters:', queryParams);
    console.log('⏱️ Interval filter:', interval || 'none');

         // Execute query
     const [result] = await db.query(query, queryParams);
    
    // console.log('✅ Query executed successfully');
    // console.log('📈 Number of rows returned:', result.rows.length);
    // console.log('📋 Sample data (first 3 rows):', result.rows.slice(0, 3));
    
         if (result.length > 0) {
       console.log('🔧 Available columns in result:', Object.keys(result[0]));
       console.log('🔧 First row sample:', result[0]);
     }
    
    // Debug: ตรวจสอบคอลัมน์ที่มีในตาราง
    try {
      const columnCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'parameters_value'
        ORDER BY ordinal_position
      `;
             const [columnCheck] = await db.query(columnCheckQuery);
       console.log('🔧 Available columns in parameters_value table:', columnCheck.map(row => row.column_name));
    } catch (error) {
      console.log('⚠️ Error checking table columns:', error.message);
    }

    // Log ผลลัพธ์การดึงข้อมูล
    // console.log('📊 === QUERY RESULTS LOG ===');
    // console.log('🔢 Total rows fetched:', result.rows.length);
    // if (result.rows.length > 0) {
    //   console.log('📋 First row sample:');
    //   console.log('   - Timestamp:', result.rows[0].reading_timestamp);
    //   console.log('   - Slave ID:', result.rows[0].slaveIdArray);
    //   console.log('   - Frequency:', result.rows[0].param_01_freqency);
    //   console.log('   - Voltage Avg:', result.rows[0].param_05_voltage_avg_phase);
    //   console.log('   - Current Avg:', result.rows[0].param_13_current_avg_phase);
    //   console.log('   - Power Total:', result.rows[0].param_18_power_total_system);
      
    //   // ตรวจสอบ slave_id ในข้อมูลที่ได้
    //   const uniqueSlaveIds = [...new Set(result.rows.map(row => row.slaveIds))];
    //   console.log('🔍 Unique Slave IDs in result:', uniqueSlaveIds);
    //   console.log('🔍 Expected Slave IDs:', slaveIdArray);
    // }
    // console.log('================================');

         // แปลงข้อมูลให้อยู่ในรูปแบบที่ frontend ต้องการ
     const formattedData = result.map(row => {
      const formattedRow = {
        time: row.reading_timestamp
      };

      // แปลงชื่อคอลัมน์จาก database กลับเป็นชื่อใน UI
      Object.keys(columnMapping).forEach(uiColumn => {
        const dbColumn = columnMapping[uiColumn];
        if (row.hasOwnProperty(dbColumn)) {
          formattedRow[uiColumn] = row[dbColumn];
        }
      });

      return formattedRow;
    });

    // console.log('🔄 Formatted data sample (first row):', formattedData[0]);
    // console.log('📊 Total formatted rows:', formattedData.length);

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      columns: selectedColumns,
      dateRange: {
        from: startDateTime,
        to: endDateTime
      }
    });

  } catch (error) {
    console.error('❌ Error fetching table data:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
});

// GET /api/table-data/available-meters - ดึงรายการ meter ที่มีข้อมูล
router.get('/available-meters', async (req, res) => {
  try {
    // เนื่องจากไม่มีคอลัมน์ meter_id ในตาราง parameters_value
    // ให้ส่งกลับรายการ meter จำลอง
    const mockMeters = [
      { meter_id: 'AMR-B1-I/C1.2', meter_name: 'AMR-B1-I/C1.2' },
      { meter_id: 'AMR-B1-F4', meter_name: 'AMR-B1-F4' },
      { meter_id: 'AMR-B1-F1', meter_name: 'AMR-B1-F1' },
      { meter_id: 'AMR-Boiler', meter_name: 'AMR-Boiler' },
      { meter_id: 'Plat1 Controller', meter_name: 'Plat1 Controller' }
    ];

    res.json({
      success: true,
      meters: mockMeters
    });

  } catch (error) {
    console.error('❌ Error fetching available meters:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
});

// GET /api/table-data/date-range - ดึงช่วงวันที่ที่มีข้อมูล
router.get('/date-range', async (req, res) => {
  try {
    const query = `
      SELECT 
        MIN(reading_timestamp) as min_date,
        MAX(reading_timestamp) as max_date
      FROM parameters_value
    `;

    const result = await parametersPool.query(query);
    
    res.json({
      success: true,
      dateRange: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching date range:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
});

// GET /api/dashboard/data - ดึงข้อมูลสำหรับ dashboard
router.get('/dashboard/data', async (req, res) => {
  try {
    const { meterId, date, timeFrom = '00:00', timeTo = '23:59' } = req.query;
    
    const startDateTime = `${date} ${timeFrom}:00`;
    const endDateTime = `${date} ${timeTo}:00`;

    // ดึงข้อมูลล่าสุด
    const currentQuery = `
      SELECT 
        param_18_power_total_system as watt,
        param_22_reactive_power_total as var,
        param_26_apparent_power_total as va,
        param_30_power_factor_total as power_factor,
        param_05_voltage_avg_phase as volt_ln,
        param_09_voltage_avg_line as volt_ll,
        param_13_current_avg_phase as current_avg,
        param_01_freqency as frequency,
        param_34_import_kwh as import_kwh,
        param_35_export_kwh as export_kwh,
        param_36_import_kvarh as import_kvarh,
        param_37_export_kvarh as export_kvarh
      FROM parameters_value
      WHERE reading_timestamp >= $1 AND reading_timestamp <= $2
      ORDER BY reading_timestamp DESC
      LIMIT 1
    `;

    const currentResult = await parametersPool.query(currentQuery, [startDateTime, endDateTime]);
    const currentData = currentResult.rows[0] || {
      watt: 4200, var: 1200, va: 4400, power_factor: 0.95,
      volt_ln: 228, volt_ll: 395, current_avg: 32, frequency: 49.98,
      import_kwh: 12800, export_kwh: 345, import_kvarh: 3200, export_kvarh: 45
    };

    // ดึงข้อมูล Demand 24 ชั่วโมง
    const demandQuery = `
      SELECT 
        EXTRACT(HOUR FROM reading_timestamp) as hour,
        param_31_power_demand as watt,
        param_32_reactive_power_demand as var,
        param_33_apparent_power_demand as va
      FROM parameters_value
      WHERE reading_timestamp >= $1 AND reading_timestamp <= $2
      AND EXTRACT(MINUTE FROM reading_timestamp) % 15 = 0
      ORDER BY reading_timestamp
    `;

    const demandResult = await parametersPool.query(demandQuery, [startDateTime, endDateTime]);
    
    // สร้างข้อมูล 24 ชั่วโมง
    const demandData = Array.from({ length: 25 }, (_, hour) => {
      const hourData = demandResult.rows.filter(row => row.hour === hour);
      if (hourData.length > 0) {
        const latest = hourData[hourData.length - 1];
        return {
          hour,
          watt: latest.watt || 0,
          var: latest.var || 0,
          va: latest.va || 0
        };
      }
      return { hour, watt: 0, var: 0, va: 0 };
    });

    // ดึงข้อมูล TOU
    const touQuery = `
      SELECT 
        EXTRACT(HOUR FROM reading_timestamp) as hour,
        param_18_power_total_system as on_peak,
        param_22_reactive_power_total as off_peak
      FROM parameters_value
      WHERE reading_timestamp >= $1 AND reading_timestamp <= $2
      AND EXTRACT(MINUTE FROM reading_timestamp) % 15 = 0
      ORDER BY reading_timestamp
    `;

    const touResult = await parametersPool.query(touQuery, [startDateTime, endDateTime]);
    
    // สร้างข้อมูล TOU 24 ชั่วโมง
    const touData = Array.from({ length: 25 }, (_, hour) => {
      const hourData = touResult.rows.filter(row => row.hour === hour);
      if (hourData.length > 0) {
        const latest = hourData[hourData.length - 1];
        return {
          hour,
          onPeak: latest.on_peak || 0,
          offPeak: latest.off_peak || 0
        };
      }
      return { hour, onPeak: 0, offPeak: 0 };
    });

    res.json({
      success: true,
      data: {
        currentValues: {
          watt: currentData.watt,
          var: currentData.var,
          va: currentData.va,
          powerFactor: currentData.power_factor,
          voltLN: currentData.volt_ln,
          voltLL: currentData.volt_ll,
          currentAvg: currentData.current_avg,
          frequency: currentData.frequency
        },
        energyData: {
          importKwh: currentData.import_kwh,
          exportKwh: currentData.export_kwh,
          importKvarh: currentData.import_kvarh,
          exportKvarh: currentData.export_kvarh
        },
        demandData: demandData,
        touData: touData,
        trends: {
          watt: 120,
          var: -30,
          va: 50,
          powerFactor: 0.02
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
});

// GET /api/dashboard/current-values - ดึงค่าปัจจุบัน
router.get('/dashboard/current-values', async (req, res) => {
  try {
    const { meterId } = req.query;
    
    const query = `
      SELECT 
        param_18_power_total_system as watt,
        param_22_reactive_power_total as var,
        param_26_apparent_power_total as va,
        param_30_power_factor_total as power_factor,
        param_05_voltage_avg_phase as volt_ln,
        param_09_voltage_avg_line as volt_ll,
        param_13_current_avg_phase as current_avg,
        param_01_freqency as frequency,
        reading_timestamp as timestamp
      FROM parameters_value
      ORDER BY reading_timestamp DESC
      LIMIT 1
    `;

    const result = await parametersPool.query(query);
    const data = result.rows[0] || {
      watt: 4200, var: 1200, va: 4400, power_factor: 0.95,
      volt_ln: 228, volt_ll: 395, current_avg: 32, frequency: 49.98,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        watt: data.watt,
        var: data.var,
        va: data.va,
        powerFactor: data.power_factor,
        voltLN: data.volt_ln,
        voltLL: data.volt_ll,
        currentAvg: data.current_avg,
        frequency: data.frequency,
        timestamp: data.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error fetching current values:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
});

// Test endpoint for charge API
router.get('/charge-test', (req, res) => {
  res.json({
    success: true,
    message: 'Charge API endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

// GET /api/table-data/charge - ดึงข้อมูล charge ตามช่วงวันเวลาและ slave_id
router.get('/charge', async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      timeFrom = '00:00',
      timeTo = '23:59',
      slaveIds
    } = req.query;

    // ตรวจสอบ required parameters
    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'dateFrom and dateTo are required'
      });
    }

    // สร้าง datetime strings
    const startDateTime = `${dateFrom} ${timeFrom}:00`;
    const endDateTime = `${dateTo} ${timeTo}:00`;

    // แปลง slaveIds เป็น array ถ้ามี
    let slaveIdArray = [];
    if (slaveIds) {
      slaveIdArray = Array.isArray(slaveIds) ? slaveIds : [slaveIds];
    }

    console.log('🔧 === CHARGE DATA PROCESSING ===');
    console.log('📅 Date Range:', `${startDateTime} to ${endDateTime}`);
    console.log('🔢 Slave IDs:', slaveIdArray);

    // สร้าง SQL query สำหรับดึงข้อมูล meter readings
    let query = `
      SELECT 
        pv.slave_id,
        m.name as meter_name,
        m.meter_class,
        MAX(pv.param_31_power_demand) as demand_w,
        MAX(pv.param_32_reactive_power_demand) as demand_var,
        MAX(pv.param_33_apparent_power_demand) as demand_va,
        MAX(pv.param_34_import_kwh) - MIN(pv.param_34_import_kwh) as total_kwh,
        MAX(CASE WHEN EXTRACT(HOUR FROM pv.reading_timestamp) BETWEEN 9 AND 22 THEN pv.param_34_import_kwh ELSE 0 END) - 
        MIN(CASE WHEN EXTRACT(HOUR FROM pv.reading_timestamp) BETWEEN 9 AND 22 THEN pv.param_34_import_kwh ELSE 0 END) as on_peak_kwh,
        MAX(CASE WHEN EXTRACT(HOUR FROM pv.reading_timestamp) NOT BETWEEN 9 AND 22 THEN pv.param_34_import_kwh ELSE 0 END) - 
        MIN(CASE WHEN EXTRACT(HOUR FROM pv.reading_timestamp) NOT BETWEEN 9 AND 22 THEN pv.param_34_import_kwh ELSE 0 END) as off_peak_kwh
      FROM parameters_value pv
      LEFT JOIN meters m ON pv.slave_id = m.slave_id
      WHERE pv.reading_timestamp >= $1 
      AND pv.reading_timestamp <= $2
    `;

    const queryParams = [startDateTime, endDateTime];

    // เพิ่มเงื่อนไข slave_id ถ้ามี
    if (slaveIdArray.length > 0) {
      query += ` AND pv.slave_id = ANY($3)`;
      queryParams.push(slaveIdArray);
    }

    query += `
      GROUP BY pv.slave_id, m.name, m.meter_class
      ORDER BY m.name
    `;

    console.log('🔍 Query:', query);
    console.log('🔢 Parameters:', queryParams);

    const result = await parametersPool.query(query, queryParams);

    // คำนวณ charge data
    const chargeData = result.rows.map(row => {
      const demandW = parseFloat(row.demand_w) || 0;
      const demandVar = parseFloat(row.demand_var) || 0;
      const demandVA = parseFloat(row.demand_va) || 0;
      const totalKWh = parseFloat(row.total_kwh) || 0;
      const onPeakKWh = parseFloat(row.on_peak_kwh) || 0;
      const offPeakKWh = parseFloat(row.off_peak_kwh) || 0;

      // คำนวณตามสูตร
      const onPeakDmW = demandW * 0.2;
      const offPeakDmW = demandW * 0.8;
      const onPeakWhCharge = onPeakKWh * 4.1839;
      const offPeakWhCharge = offPeakKWh * 2.6037;
      const totalWhCharge = onPeakWhCharge + offPeakWhCharge;
      const onPeakDemandCharge = onPeakDmW * 132.93;
      const offPeakDemandCharge = offPeakDmW * 132.93;
      const totalDemandCharge = onPeakDemandCharge + offPeakDemandCharge;
      const powerFactor = demandVA / demandW;
      const powerFactorCharge = powerFactor > 728 ? (powerFactor - 728) * 56.07 : 0;
      const ft = (demandW + totalKWh) * -0.147;
      const total = totalWhCharge + totalDemandCharge + powerFactorCharge;
      const vat = (total - ft) * 0.07;
      const grandTotal = vat + (total - ft);

      return {
        meterName: row.meter_name || `Meter-${row.slave_id}`,
        class: row.meter_class || '3.1',
        demandW: Math.round(demandW),
        demandVar: Math.round(demandVar),
        demandVA: Math.round(demandVA),
        offPeakKWh: Math.round(offPeakKWh),
        onPeakKWh: Math.round(onPeakKWh),
        totalKWh: Math.round(totalKWh),
        whCharge: Math.round(totalWhCharge * 100) / 100,
        ft: Math.round(ft * 100) / 100,
        demandCharge: Math.round(totalDemandCharge * 100) / 100,
        surcharge: Math.round(powerFactorCharge * 100) / 100,
        total: Math.round(total * 100) / 100,
        vat: Math.round(vat * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100
      };
    });

    console.log('✅ Charge data calculated:', chargeData.length, 'records');

    res.json({
      success: true,
      data: chargeData,
      message: 'Charge data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching charge data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});


module.exports = router;
