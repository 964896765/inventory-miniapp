// 用户相关类型
export interface User {
  id: number;
  username: string;
  name: string;
  team_id: number;
  created_at: string;
}

// 团队相关类型
export interface Team {
  id: number;
  name: string;
  created_at: string;
}

// 材料分类类型
export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  children?: Category[];
}

// 材料类型
export interface Material {
  id: number;
  name: string;
  code: string;
  category_id: number;
  category_name?: string;
  unit: string;
  spec: string;
  min_stock: number;
  max_stock: number;
  created_at: string;
}

// 仓库类型
export interface Warehouse {
  id: number;
  name: string;
  location: string;
  manager: string;
  created_at: string;
}

// 供需单位类型
export interface SupplyUnit {
  id: number;
  name: string;
  type: 'department' | 'supplier' | 'other';
  contact: string;
  phone: string;
  address: string;
  created_at: string;
}

// BOM类型
export interface BOM {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
  created_at: string;
  items?: BOMItem[];
}

export interface BOMItem {
  id: number;
  bom_id: number;
  material_id: number;
  material_name?: string;
  quantity: number;
  unit: string;
}

// 库存操作类型
export interface StockOperation {
  id: number;
  type: 'in' | 'out' | 'transfer' | 'check';
  warehouse_id: number;
  warehouse_name?: string;
  material_id: number;
  material_name?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  batch_no?: string;
  supply_unit_id?: number;
  supply_unit_name?: string;
  operator: string;
  remark: string;
  created_at: string;
}

// 统计数据类型
export interface Statistics {
  today_in: number;
  today_out: number;
  total_materials: number;
  total_warehouses: number;
  low_stock_count: number;
  expired_count: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
