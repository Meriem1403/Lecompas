import React from "react";
import { cn } from "@/app/components/ui/utils";

export interface SpreadsheetColumn<T> {
  id: string;
  header: string;
  width?: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}

interface CompactSpreadsheetProps<T> {
  rows: T[];
  columns: SpreadsheetColumn<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  maxHeight?: string;
}

export function CompactSpreadsheet<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  emptyMessage = "Aucune ligne.",
  maxHeight = "min(70vh, 900px)",
}: CompactSpreadsheetProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className="w-full min-w-0 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm"
      style={{ maxHeight }}
    >
      <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 whitespace-nowrap",
                  col.className,
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={getRowId(row)}
              className={cn(
                "border-b border-slate-100 hover:bg-indigo-50/40",
                idx % 2 === 1 && "bg-slate-50/50",
                onRowClick && "cursor-pointer",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    "px-2 py-1.5 align-top text-slate-800 max-w-[280px] truncate",
                    col.className,
                  )}
                  title={
                    typeof col.cell(row) === "string"
                      ? (col.cell(row) as string)
                      : undefined
                  }
                >
                  <div className="line-clamp-3 break-words whitespace-pre-wrap">
                    {col.cell(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
