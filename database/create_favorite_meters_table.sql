-- Create table for user favorite meters
CREATE TABLE IF NOT EXISTS user_favorite_meters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    meter_id INTEGER NOT NULL,
    tree_type VARCHAR(20) NOT NULL CHECK (tree_type IN ('building', 'online')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_favorite_meters_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_favorite_meters_meter_id FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate favorites
    CONSTRAINT unique_user_meter_tree_type UNIQUE(user_id, meter_id, tree_type)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorite_meters_user_id ON user_favorite_meters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_meters_tree_type ON user_favorite_meters(tree_type);
CREATE INDEX IF NOT EXISTS idx_user_favorite_meters_created_at ON user_favorite_meters(created_at);

-- Add comment
COMMENT ON TABLE user_favorite_meters IS 'Stores user favorite meters for different tree types (building/online)';
COMMENT ON COLUMN user_favorite_meters.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_favorite_meters.meter_id IS 'Reference to meters table';
COMMENT ON COLUMN user_favorite_meters.tree_type IS 'Type of tree: building or online';
COMMENT ON COLUMN user_favorite_meters.created_at IS 'Timestamp when meter was added to favorites';
