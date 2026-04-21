import React from "react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search } from "lucide-react";

interface FilterBarProps {
  service: string;
  domain: string;
  location: string;
  query: string;
  services: string[];
  domains: string[];
  locations: string[];
  onServiceChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  /** Affiche la recherche texte (masquée sur l'écran périmètre uniquement). */
  showSearch?: boolean;
}

export function FilterBar({
  service,
  domain,
  location,
  query,
  services,
  domains,
  locations,
  onServiceChange,
  onDomainChange,
  onLocationChange,
  onQueryChange,
  showSearch = true,
}: FilterBarProps) {
  return (
    <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white transition-all duration-300 hover:shadow-md">
      <CardContent
        className={
          showSearch
            ? "p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
            : "p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
        }
      >
        <Select value={service} onValueChange={onServiceChange}>
          <SelectTrigger className="h-11 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-200">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {services.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={domain} onValueChange={onDomainChange}>
          <SelectTrigger className="h-11 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-200">
            <SelectValue placeholder="Domaine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les domaines</SelectItem>
            {domains.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={location} onValueChange={onLocationChange}>
          <SelectTrigger className="h-11 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-200">
            <SelectValue placeholder="Lieu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les lieux</SelectItem>
            {locations.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showSearch ? (
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Rechercher un agent"
              className="h-11 rounded-xl pl-9 transition-all duration-200 focus-visible:ring-violet-200"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
