import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * 导出服务工具类
 * 
 * 功能：
 * 1. 导出数据为CSV格式
 * 2. 分享文件到其他应用
 */

/**
 * 将数据导出为CSV格式
 */
export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): Promise<string> {
  // 生成CSV头部
  const headers = columns.map((col) => col.label).join(",");
  
  // 生成CSV行
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        // 处理包含逗号或换行的值
        if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      })
      .join(",");
  });
  
  // 组合CSV内容
  const csvContent = [headers, ...rows].join("\n");
  
  // 添加BOM以支持中文
  const bom = "\uFEFF";
  const fullContent = bom + csvContent;
  
  // 保存到文件
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, fullContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  return fileUri;
}

/**
 * 分享文件到其他应用
 */
export async function shareFile(fileUri: string, dialogTitle?: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (!isAvailable) {
    throw new Error("分享功能在当前设备上不可用");
  }
  
  await Sharing.shareAsync(fileUri, {
    dialogTitle: dialogTitle || "分享文件",
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}

/**
 * 导出并分享CSV文件
 */
export async function exportAndShare<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
  dialogTitle?: string
): Promise<void> {
  const fileUri = await exportToCSV(data, columns, filename);
  await shareFile(fileUri, dialogTitle);
}

/**
 * 格式化日期为文件名友好格式
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * 生成导出文件名
 */
export function generateExportFilename(prefix: string, extension: string = "csv"): string {
  const timestamp = formatDateForFilename();
  return `${prefix}_${timestamp}.${extension}`;
}
