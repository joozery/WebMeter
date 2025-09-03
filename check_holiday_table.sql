-- ตรวจสอบว่าตาราง holiday มีอยู่หรือไม่
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'holiday'
);

-- ตรวจสอบโครงสร้างตาราง holiday
\d holiday;

-- ตรวจสอบข้อมูลในตาราง holiday
SELECT COUNT(*) as total_holidays FROM holiday;

-- ตรวจสอบข้อมูลตัวอย่าง
SELECT * FROM holiday LIMIT 5;
