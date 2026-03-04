-- Minimal schema for inventory-backend (MySQL 8+)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(64) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  email VARCHAR(128) NOT NULL DEFAULT '',
  avatar_url TEXT,
  gender ENUM('male','female','other') NOT NULL DEFAULT 'other',
  department VARCHAR(64) NOT NULL DEFAULT '',
  position VARCHAR(64) NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS docs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_no VARCHAR(64) NOT NULL UNIQUE,
  doc_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  -- Source warehouse (e.g. 主材仓)
  from_warehouse_id BIGINT NULL,
  -- Target warehouse (e.g. 车间仓/辅料仓/PACK仓)
  to_warehouse_id BIGINT NULL,
  -- Department (required when to_warehouse is 车间仓)
  department_id BIGINT NULL,
  created_by BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  posted_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_docs_type_status(doc_type, status),
  INDEX idx_docs_from_to(from_warehouse_id, to_warehouse_id),
  INDEX idx_docs_created_by(created_by),
  CONSTRAINT fk_docs_user FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doc_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_id BIGINT NOT NULL,
  material_id BIGINT NOT NULL,
  material_name VARCHAR(128) NOT NULL DEFAULT '',
  quantity DECIMAL(18,4) NOT NULL,
  unit_price DECIMAL(18,4) NULL,
  batch_no VARCHAR(64) NULL,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_doc_items_doc(doc_id),
  CONSTRAINT fk_doc_items_doc FOREIGN KEY(doc_id) REFERENCES docs(id)
);

-- Warehouses (supports tree via parent_id; departments are modeled as workshop children)
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  type VARCHAR(32) NOT NULL DEFAULT 'normal',
  parent_id BIGINT NULL,
  department_id BIGINT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wh_parent(parent_id),
  INDEX idx_wh_department(department_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  spec VARCHAR(128) NOT NULL DEFAULT '',
  unit VARCHAR(16) NOT NULL DEFAULT '',
  category_id BIGINT NULL,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_materials_cat(category_id)
);

-- Supply units: supplier/customer/department
CREATE TABLE IF NOT EXISTS supply_units (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  type ENUM('supplier','customer','department') NOT NULL DEFAULT 'supplier',
  code VARCHAR(64) NULL,
  contact VARCHAR(64) NULL,
  phone VARCHAR(32) NULL,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supply_type(type)
);

-- BOM
CREATE TABLE IF NOT EXISTS boms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  remark VARCHAR(255) NULL,
  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_boms_code(code)
);

CREATE TABLE IF NOT EXISTS bom_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  bom_id BIGINT NOT NULL,
  material_id BIGINT NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bom_items_bom(bom_id),
  CONSTRAINT fk_bom_items_bom FOREIGN KEY(bom_id) REFERENCES boms(id)
);

-- Inventory snapshot per warehouse
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id BIGINT NOT NULL,
  material_id BIGINT NOT NULL,
  quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory_wh_mat(warehouse_id, material_id),
  INDEX idx_inventory_wh(warehouse_id),
  INDEX idx_inventory_mat(material_id)
);

-- Stock ledger (immutable movements)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_id BIGINT NOT NULL,
  material_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  department_id BIGINT NULL,
  direction ENUM('IN','OUT') NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_doc(doc_id),
  INDEX idx_ledger_wh_mat(warehouse_id, material_id),
  INDEX idx_ledger_mat(material_id)
);

-- Approval config (single row)
CREATE TABLE IF NOT EXISTS approval_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  exempt_self TINYINT(1) NOT NULL DEFAULT 1,
  approver1_id BIGINT NULL,
  approver2_id BIGINT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL
);

-- Team members (single team model)
CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  permissions_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_user(user_id),
  CONSTRAINT fk_team_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS approval_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_id BIGINT NOT NULL,
  action ENUM('submit','approve','reject','post') NOT NULL,
  remark VARCHAR(255) NULL,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_approval_doc(doc_id),
  CONSTRAINT fk_approval_doc FOREIGN KEY(doc_id) REFERENCES docs(id),
  CONSTRAINT fk_approval_user FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  related_doc_id BIGINT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_read(user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS share_links (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  share_id VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  url TEXT NOT NULL,
  scene VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_share_user(user_id),
  CONSTRAINT fk_share_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS share_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  share_id VARCHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  platform VARCHAR(32) NOT NULL,
  result VARCHAR(16) NOT NULL,
  error_msg TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_share_logs_share(share_id),
  CONSTRAINT fk_share_logs_user FOREIGN KEY(user_id) REFERENCES users(id)
);
