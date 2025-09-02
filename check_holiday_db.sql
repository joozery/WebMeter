-- ตรวจสอบข้อมูลในตาราง holiday
SELECT 
    id,
    date,
    name_holiday,
    category,
    created_by,
    created_at
FROM holiday 
WHERE EXTRACT(YEAR FROM date) = 2023 
ORDER BY date;

-- ตรวจสอบจำนวนข้อมูลทั้งหมด
SELECT COUNT(*) as total_holidays FROM holiday;

-- ตรวจสอบโครงสร้างตาราง
\d holiday;
