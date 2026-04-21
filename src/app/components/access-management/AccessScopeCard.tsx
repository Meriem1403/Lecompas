import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

interface AccessScopeCardProps {
  title: string;
  description: string;
  section: string;
  selected?: boolean;
  onClick: () => void;
  icon: React.ElementType;
}

export function AccessScopeCard({
  title,
  description,
  section,
  selected = false,
  onClick,
  icon: Icon,
}: AccessScopeCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-2xl border-2 bg-white shadow-sm transition-all duration-200",
        selected
          ? "border-violet-300 shadow-md"
          : "border-transparent hover:border-violet-200 hover:shadow-md",
      )}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <Badge
            variant="outline"
            className="bg-violet-50 border-violet-200 text-violet-700 font-medium"
          >
            {section}
          </Badge>
        </div>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        <CardDescription className="text-sm text-slate-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <p className="text-xs text-slate-500">
          {selected ? "Selection active" : "Cliquer pour configurer"}
        </p>
      </CardContent>
    </Card>
  );
}
