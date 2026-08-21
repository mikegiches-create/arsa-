-- ARSA Real Estate — MySQL schema
-- Run via: npm run db:init  (which calls src/db/init.ts)
-- The init script creates the database and selects it before running this file.

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  phone       VARCHAR(50),
  avatar      VARCHAR(500),
  role        ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  bio         TEXT,
  address     VARCHAR(255),
  city        VARCHAR(100),
  state       VARCHAR(100),
  zip_code    VARCHAR(20),
  country     VARCHAR(100),
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(50),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image       VARCHAR(500),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_locations_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- agents
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(50)  NOT NULL,
  avatar      VARCHAR(500),
  bio         TEXT,
  license     VARCHAR(100),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME,
  INDEX idx_agents_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- properties
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         NOT NULL,
  price        DECIMAL(15,2) NOT NULL,
  type         ENUM('APARTMENT','HOUSE','VILLA','TOWNHOUSE','COMMERCIAL','LAND','OTHER') NOT NULL,
  status       ENUM('AVAILABLE','SOLD','RENTED','PENDING','ARCHIVED') NOT NULL DEFAULT 'AVAILABLE',
  address      VARCHAR(255) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,
  zip_code     VARCHAR(20)  NOT NULL,
  country      VARCHAR(100) NOT NULL,
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  bedrooms     INT          NOT NULL,
  bathrooms    INT          NOT NULL,
  square_feet  INT          NOT NULL,
  year_built   INT,
  images       JSON,
  thumbnail    VARCHAR(500),
  category_id  VARCHAR(36)  NOT NULL,
  location_id  VARCHAR(36)  NOT NULL,
  agent_id     VARCHAR(36)  NOT NULL,
  owner_id     VARCHAR(36)  NOT NULL,
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  views        INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME,
  CONSTRAINT fk_prop_category  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_prop_location  FOREIGN KEY (location_id) REFERENCES locations(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_prop_agent     FOREIGN KEY (agent_id)    REFERENCES agents(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_prop_owner     FOREIGN KEY (owner_id)    REFERENCES users(id)      ON DELETE CASCADE,
  INDEX idx_prop_category (category_id),
  INDEX idx_prop_location (location_id),
  INDEX idx_prop_agent    (agent_id),
  INDEX idx_prop_owner    (owner_id),
  INDEX idx_prop_status   (status),
  FULLTEXT idx_prop_search_title (title),
  FULLTEXT idx_prop_search_city  (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- testimonials
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  content    TEXT        NOT NULL,
  rating     INT         NOT NULL DEFAULT 5,
  author_id  VARCHAR(36) NOT NULL,
  featured   TINYINT(1)  NOT NULL DEFAULT 0,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_testi_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_testi_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- saved_properties
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_properties (
  id          VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_saved_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE KEY uq_saved (user_id, property_id),
  INDEX idx_saved_user     (user_id),
  INDEX idx_saved_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  subject     VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  user_id     VARCHAR(36),
  property_id VARCHAR(36),
  status      ENUM('UNREAD','READ','REPLIED','ARCHIVED') NOT NULL DEFAULT 'UNREAD',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT fk_msg_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  INDEX idx_msg_user     (user_id),
  INDEX idx_msg_property (property_id),
  INDEX idx_msg_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- appointments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  user_id      VARCHAR(36)  NOT NULL,
  property_id  VARCHAR(36)  NOT NULL,
  scheduled_at DATETIME     NOT NULL,
  status       ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_appt_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  INDEX idx_appt_user     (user_id),
  INDEX idx_appt_property (property_id),
  INDEX idx_appt_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  `key`       VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT         NOT NULL,
  description VARCHAR(255),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- media_files
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_files (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  url         VARCHAR(500) NOT NULL,
  public_id   VARCHAR(255),
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL,
  size        INT          NOT NULL,
  uploaded_by VARCHAR(36)  NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- activity_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100) NOT NULL,
  entity_id  VARCHAR(36)  NOT NULL,
  changes    JSON,
  user_id    VARCHAR(36)  NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_log_user      (user_id),
  INDEX idx_log_action    (action),
  INDEX idx_log_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- newsletter_subscribers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME,
  INDEX idx_newsletter_email  (email),
  INDEX idx_newsletter_token  (unsubscribe_token),
  INDEX idx_newsletter_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- newsletter_blasts  (audit trail of sent campaigns)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_blasts (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  subject      VARCHAR(255) NOT NULL,
  content      TEXT         NOT NULL,
  sent_by      VARCHAR(36)  NOT NULL,
  recipient_count INT        NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_blast_user FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
