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
        <p className="text-sm text-slate-600">
          Page {currentPage} / {totalPages} — {totalItems} {itemLabel}
        </p>
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
