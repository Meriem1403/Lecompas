import React from "react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface RepasRolePlaceholderProps {
  roleLabel: string;
  description: string;
}

export function RepasRolePlaceholder({ roleLabel, description }: RepasRolePlaceholderProps) {
  return (
    <Card className="border-2 border-dashed border-slate-200">
      <CardContent className="py-16 text-center">
        <Construction className="h-14 w-14 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Vue {roleLabel}</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">{description}</p>
      </CardContent>
    </Card>
  );
}
