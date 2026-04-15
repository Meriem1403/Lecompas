# Guide de Correction des Imports

## Fichiers déjà corrigés ✅
- App.tsx
- LoginPage.tsx
- NotificationBell.tsx
- AccidentsView.tsx  
- RiskFormDialog.tsx

## Fichiers restants à corriger

Tous les fichiers .tsx dans `/src/app/components/` (sauf ui/ et figma/) doivent avoir leurs imports modifiés:

### Règle de remplacement:

**Pour les fichiers dans `/src/app/components/`:**
- `from '@/app/components/ui/xxx'` → `from './ui/xxx'`
- `from '@/app/components/admin/xxx'` → `from './admin/xxx'`
- `from '@/app/components/xxx'` → `from './xxx'`

**Pour les fichiers dans `/src/app/components/admin/`:**
- `from '@/app/components/ui/xxx'` → `from '../ui/xxx'`
- `from '@/app/components/admin/xxx'` → `from './xxx'`
- `from '@/app/components/xxx'` → `from '../xxx'`

### Liste des fichiers à corriger (17 fichiers restants):

1. AccidentEditView.tsx
2. AccidentCreateView.tsx  
3. AccidentFormDialog.tsx
4. ActionsView.tsx
5. ActionCreateView.tsx
6. ActionDetailView.tsx
7. ActionEditView.tsx
8. AdminTabsView.tsx
9. RiskEditView.tsx
10. DocumentsView.tsx
11. DocumentCreateView.tsx
12. DocumentDetailView.tsx
13. DocumentEditView.tsx
14. ArchivesView.tsx
15. GenerateDUERPDialog.tsx
16. RegistreAccidentsView.tsx
17. SettingsView.tsx
18. CerbereView.tsx
19. ActualitesView.tsx
20. ArriveesDepartsView.tsx
21. ActionReturnHistory.tsx
22. RetourActionView.tsx
23. DashboardView.tsx
24. DUERPSignatureManagement.tsx

Et tous les fichiers dans `/src/app/components/admin/`:
- UserManagementView.tsx
- RoleManagementView.tsx
- ServiceManagementView.tsx  
- SimpleEntityManagementView.tsx
- RisksManagementView.tsx

## Script de correction automatique

Pour corriger tous les fichiers rapidement, utilisez ces commandes sed en bash :

```bash
# Pour les fichiers dans /src/app/components/ (pas dans admin/)
find /src/app/components -maxdepth 1 -name "*.tsx" -type f -exec sed -i \
  -e "s|from '@/app/components/ui/|from './ui/|g" \
  -e 's|from "@/app/components/ui/|from "./ui/|g' \
  -e "s|from '@/app/components/admin/|from './admin/|g" \
  -e 's|from "@/app/components/admin/|from "./admin/|g' \
  -e "s|from '@/app/components/|from './|g" \
  -e 's|from "@/app/components/|from "./|g' \
  {} \;

# Pour les fichiers dans /src/app/components/admin/
find /src/app/components/admin -name "*.tsx" -type f -exec sed -i \
  -e "s|from '@/app/components/ui/|from '../ui/|g" \
  -e 's|from "@/app/components/ui/|from "../ui/|g' \
  -e "s|from '@/app/components/admin/|from './|g" \
  -e 's|from "@/app/components/admin/|from "./|g' \
  -e "s|from '@/app/components/|from '../|g" \
  -e 's|from "@/app/components/|from "../|g' \
  {} \;
```

Note: Ces commandes sed ne peuvent pas être exécutées dans l'environnement actuel, mais peuvent être utilisées dans un terminal avec accès au système de fichiers.
