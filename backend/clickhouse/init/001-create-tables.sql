-- Table: promo_code_usages_analytics
CREATE TABLE IF NOT EXISTS promo_code_usages_analytics (
  event_date Date,
  created_at DateTime,
  
  promo_code String,
  promo_code_id String,
  
  user_id String,
  order_id String,
  
  order_amount Float64,
  discount_amount Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (promo_code_id, event_date)
SETTINGS index_granularity = 8192;

-- Table: orders_analytics
CREATE TABLE IF NOT EXISTS orders_analytics (
  event_date Date,
  created_at DateTime,
  
  order_id String,
  user_id String,
  
  amount Float64,
  promo_code String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id)
SETTINGS index_granularity = 8192;

-- Table: users_analytics
CREATE TABLE IF NOT EXISTS users_analytics (
  event_date Date,
  user_id String,
  
  orders_count UInt32,
  total_amount Float64,
  promo_codes_used UInt32
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (user_id, event_date)
SETTINGS index_granularity = 8192;
