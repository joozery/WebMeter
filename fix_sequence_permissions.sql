-- แก้ไขปัญหา Sequence Permissions
-- รันคำสั่งนี้ใน PostgreSQL ด้วย superuser

-- 1. เชื่อมต่อ PostgreSQL ด้วย superuser (postgres)
-- psql -U postgres -d webmeter_db

-- 2. ให้สิทธิ์สำหรับ sequences ทั้งหมด
GRANT USAGE, SELECT ON SEQUENCE locations_id_seq TO webmeter_app;
GRANT USAGE, SELECT ON SEQUENCE lognets_id_seq TO webmeter_app;
GRANT USAGE, SELECT ON SEQUENCE buildings_id_seq TO webmeter_app;
GRANT USAGE, SELECT ON SEQUENCE floors_id_seq TO webmeter_app;
GRANT USAGE, SELECT ON SEQUENCE meters_id_seq TO webmeter_app;

-- 3. ให้สิทธิ์สำหรับ tables ทั้งหมด
GRANT ALL PRIVILEGES ON TABLE locations TO webmeter_app;
GRANT ALL PRIVILEGES ON TABLE lognets TO webmeter_app;
GRANT ALL PRIVILEGES ON TABLE buildings TO webmeter_app;
GRANT ALL PRIVILEGES ON TABLE floors TO webmeter_app;
GRANT ALL PRIVILEGES ON TABLE meters TO webmeter_app;

-- 4. ให้สิทธิ์สำหรับ schema public
GRANT USAGE ON SCHEMA public TO webmeter_app;
GRANT CREATE ON SCHEMA public TO webmeter_app;

-- 5. ตรวจสอบสิทธิ์
\dp locations
\dp lognets
\dp buildings
\dp floors
\dp meters

-- 6. ทดสอบการสร้างข้อมูล
INSERT INTO locations (name, description) VALUES ('Test Location', 'Test Description') ON CONFLICT DO NOTHING;
SELECT * FROM locations;
