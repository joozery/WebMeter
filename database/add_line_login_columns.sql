-- Add LINE Login columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS line_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS picture TEXT,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';

-- Create index for line_id
CREATE INDEX IF NOT EXISTS idx_users_line_id ON users(line_id);

-- Update existing users to have provider = 'local'
UPDATE users SET provider = 'local' WHERE provider IS NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN users.line_id IS 'LINE User ID for OAuth login';
COMMENT ON COLUMN users.picture IS 'User profile picture URL';
COMMENT ON COLUMN users.provider IS 'Authentication provider: local, line, google, etc.';


