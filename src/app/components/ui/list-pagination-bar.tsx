import React from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { cn } from "./utils";

export const LIST_PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

export interface ListPaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Libellé du décompte, ex. « résultat(s) », « document(s) » */
  itemLabel?: string;
  className?: string;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Barre Précédent / Suivant + compteur de page, alignée sur le style des vues Fiches/Protocoles.
 */
export function ListPaginationBar({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = "résultat(s)",
  className,
  pageSize,
  pageSizeOptions = LIST_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
}: ListPaginationBarProps) {
  if (totalItems === 0) return null;

  return (
    <Card className={cn("min-w-0 border-2 bg-white/95", className)}>
      <CardContent className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          {pageSize && onPageSizeChange ? (
            <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-slate-600">
              <span>Afficher</span>
              <span className="relative inline-flex h-9 w-[4.75rem] shrink-0">
                <select
                  aria-label="Nombre d'éléments par page"
                  value={pageSize}
                  onChange={(event) => onPageSizeChange(Number(event.target.value))}
                  className="h-full w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-sm text-slate-800"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
              </span>
              <span>par page</span>
            </label>
          ) : null}
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Page {currentPage} sur {totalPages}
          </span>
          <span className="rounded-lg bg-sky-50 px-3 py-1 font-medium text-sky-800">
            {totalItems} {itemLabel}
          </span>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            className="min-w-0 flex-1 sm:flex-none"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Précédent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            className="min-w-0 flex-1 sm:flex-none"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const DEFAULT_LIST_PAGE_SIZE = 6;
export const TABLE_LIST_PAGE_SIZE = 10;
