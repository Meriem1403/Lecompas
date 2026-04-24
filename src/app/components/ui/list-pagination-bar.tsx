import React from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { cn } from "./utils";

export interface ListPaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Libellé du décompte, ex. « résultat(s) », « document(s) » */
  itemLabel?: string;
  className?: string;
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
}: ListPaginationBarProps) {
  if (totalItems === 0) return null;

  return (
    <Card className={cn("border-2 bg-white/95", className)}>
      <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Page {currentPage} sur {totalPages}
          </span>
          <span className="text-slate-400">•</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
            {totalItems} {itemLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Précédent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
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
