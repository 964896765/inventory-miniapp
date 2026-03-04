import { create } from "zustand";

export type DraftLine = {
  materialId: number;
  code: string;
  name: string;
  spec?: string | null;
  unit?: string | null;
  qty: number;
};

export type DraftDocType = "IN" | "OUT" | "TRANSFER" | "STOCKTAKE";

type DraftState = {
  type: DraftDocType;
  warehouseId: number | null;
  toWarehouseId?: number | null;
  remark?: string;
  lines: DraftLine[];

  setType: (type: DraftDocType) => void;
  setWarehouse: (id: number | null) => void;
  setToWarehouse: (id: number | null) => void;
  setRemark: (remark: string) => void;

  setLines: (lines: DraftLine[]) => void;
  upsertLine: (line: DraftLine) => void;
  removeLine: (materialId: number) => void;
  clear: () => void;
};

export const useDocDraft = create<DraftState>((set, get) => ({
  type: "IN",
  warehouseId: null,
  toWarehouseId: null,
  remark: "",
  lines: [],

  setType: (type) => set({ type }),
  setWarehouse: (id) => set({ warehouseId: id }),
  setToWarehouse: (id) => set({ toWarehouseId: id }),
  setRemark: (remark) => set({ remark }),

  setLines: (lines) => set({ lines }),

  upsertLine: (line) => {
    const lines = get().lines.slice();
    const idx = lines.findIndex((l) => l.materialId === line.materialId);
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
    set({ lines });
  },

  removeLine: (materialId) => set({ lines: get().lines.filter((l) => l.materialId !== materialId) }),

  clear: () => set({ warehouseId: null, toWarehouseId: null, remark: "", lines: [] }),
}));
