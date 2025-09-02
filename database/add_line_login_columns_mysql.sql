-- Add LINE Login columns to users table for MySQL
ALTER TABLE users 
ADD COLUMN line_id VARCHAR(255) UNIQUE,
ADD COLUMN picture TEXT,
ADD COLUMN provider VARCHAR(50) DEFAULT 'local';

-- Create index for line_id
CREATE INDEX idx_users_line_id ON users(line_id);

-- Update existing users to have provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;

-- Add comments to explain the new columns
-- Note: MySQL doesn't support COMMENT ON COLUMN, so we'll add comments here
-- line_id: LINE User ID for OAuth login
-- picture: User profile picture URL  
-- provider: Authentication provider: local, line, google, etc.


