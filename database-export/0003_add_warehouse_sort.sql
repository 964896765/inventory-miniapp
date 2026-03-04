-- 添加仓库排序字段
ALTER TABLE warehouses ADD COLUMN sort INT DEFAULT 0;

-- 更新现有仓库的排序值（如果存在）
UPDATE warehouses SET sort = 1 WHERE name = '主材仓';
UPDATE warehouses SET sort = 2 WHERE name = '车间仓';
UPDATE warehouses SET sort = 3 WHERE name = 'PACK仓';
UPDATE warehouses SET sort = 4 WHERE name = '辅料仓';
UPDATE warehouses SET sort = 5 WHERE name = '待处理';
