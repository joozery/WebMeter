@echo off
echo ========================================
echo อัปเดต Hierarchical Structure
echo ========================================

echo.
echo 1. อัปเดตตาราง locations เพื่อรองรับ parent-child relationship...
echo psql -U postgres -d webmeter_db -f database/update_locations_hierarchy.sql
echo.

echo 2. รันคำสั่ง SQL อัปเดต...
psql -U postgres -d webmeter_db -f database/simple_hierarchy.sql

echo.
echo 3. ตรวจสอบโครงสร้างตาราง...
echo psql -U webmeter_app -d webmeter_db -c "\d locations"
echo.

echo ========================================
echo เสร็จสิ้น! ระบบพร้อมรองรับ hierarchical locations
echo ========================================
pause
