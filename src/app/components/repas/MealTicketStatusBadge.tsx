import { Badge } from "../ui/badge";
import { MealTicket } from "../../utils/mealTicketRecord";

export function MealTicketStatusBadge({ status }: { status: MealTicket["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
        Actif
      </Badge>
    );
  }
  if (status === "used") {
    return (
      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">
        Utilisé
      </Badge>
    );
  }
  return <Badge variant="destructive">Annulé</Badge>;
}
