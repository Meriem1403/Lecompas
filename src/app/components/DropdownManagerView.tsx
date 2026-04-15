import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { List, Plus, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from './PageHeader';

interface DropdownManagerViewProps {
  userRole: string;
}

// Structure des données pour les listes déroulantes
export const DEFAULT_DROPDOWN_DATA = {
  unites: [
    'GESTIONNAIRE SITE',
    '1. SERVICES ADMINISTRATIFS',
    '2. SPB',
    '3. POLMAR',
    '4. CROSS MED',
    '5. NAVIRE DCS',
    '6. CSN',
    '7. SSGM',
    'COB Ajaccio - sites du secteur',
    'COB Biguglia - sites du secteur',
    'COB Bonifacio - sites du secteur',
    'COB Cannes - sites Dépt.06',
    'COB Marseille - sites Dépt.13',
    'COB Sète - sites Dépts.34-30-11-66',
    'COB Toulon - sites Dépt.83',
    'CROSS MÉDITERRANÉE',
    'CSN Occitanie',
    'CSN PACA Corse',
    'PATROUILLEUR GYPTIS',
    'SERVICE(S) DIRM hébergé(s)',
    'SSGM-Méditerranée',
    'Tous COB-SPB Méditerranée',
    'TOUS SERVICES DIRM administratifs-bureaux',
  ],
  services: [
    'CELLULE INFORMATIQUE-MOYENS GENERAUX',
    'Centres POLMAR',
  ],
  localisationAccident: [
    'Sur le lieu de travail',
    'En télétravail',
    'Lors d\'une mission',
    'Domicile-travail',
    'Travail-domicile',
    'Entre le lieu de travail et le lieu de restauration',
    'Entre le lieu de restauration et le lieu de travail',
    'Presque accident sur le lieu de travail',
    'Presque accident lors d\'une mission',
  ],
  categorieAccident: [
    'Trajet',
    'Travail',
    'Mission',
    'Presque accident',
    'Situation dangereuse',
  ],
  typeAccident: [
    'Heurt',
    'Accident de la route',
    'Chute 2 roues',
    'Chute de plain-pied',
    'Chute de hauteur',
    'Port de charge',
    'Coupure',
    'Chute terrain accidenté/glissant',
    'Chute à l\'eau',
    'Chute sur obstacle',
    'Brûlure',
    'Projection(s) chimiques',
    'Utilisation d\'outils',
    'Faux mouvement',
    'Exposition (gaz, poussière, rayon, chimique, …)',
    'Exposition (chaleur/froid)',
    'Agression verbale et physique',
    'Explosion',
    'Stress-Traumatisme-Anxiété',
    'Presque chute escaliers irréguliers',
    'Ecrasement-pincement',
  ],
  siegeLesion: [
    'Œil/yeux',
    'Cou et gorge',
    'Epaule(s)',
    'Poitrine',
    'Abdomen',
    'Bassin',
    'Appareil génital',
    'Cuisse(s)',
    'Genou(x)',
    'Pied(s)',
    'Orteille(s)',
    'Tête',
    'Oreille(s)',
    'Dos',
    'Bras',
    'Coude(s)',
    'Avant-bras',
    'Poignet(s)',
    'Main(s)',
    'Doigt(s)',
    'Jambe(s)',
    'Cheville(s)',
    'Hanche',
    'Omoplate(s)',
    'Rachis (colonne vertébrale tête-bassin)',
    'Zone faciale',
    'Dentition',
    'Côte(s)',
    'Atteinte mentale',
    'Sans objet (danger ou presque accident)',
    'Lombaires',
    'Tibia (s)',
    'Talon(s)',
    'Cocyx',
    'Cervicales',
  ],
  natureLesion: [
    'Contusion(s)',
    'Douleur',
    'Douleur musculaire',
    'Plaie',
    'Coupure(s)',
    'Brûlure(s)',
    'Entorse',
    'Allergie',
    'Corps étranger',
    'Electrisation',
    'Intoxication',
    'Inflammation',
    'Asphyxie',
    'Ecrasement',
    'Fracture',
    'Gelure',
    'Hernie',
    'Lumbago',
    'Mal de dos',
    'Traumatisme, luxation, hématome',
    'Lésion ligamentaire, musculaire',
    'Sciatique',
    'Cervicalgie (douleur cou)',
    'Réaction cutanée',
    'Piqûre(s)',
    'Troubles auditifs',
    'Malaise (évanouissement)',
    'Choc psychologique/post traumatique',
    'Paralysie',
    'Sans objet (danger ou presque accident)',
    'Fracture, plaie, structurée, douleurs musculaires',
    'Plaie, traumatisme, hématome',
  ],
  gravite: [
    'G1 : Sans arrêt',
    'G2 : Arrêt 1<X<8j',
    'G3 : Arrêt 8<X<45j',
    'G4 : Arrêt 45<X<90',
    'G5 : Arrêt >90j',
  ],
};

export type DropdownCategory = keyof typeof DEFAULT_DROPDOWN_DATA;

export function DropdownManagerView({ userRole }: DropdownManagerViewProps) {
  const [dropdownData, setDropdownData] = useState(DEFAULT_DROPDOWN_DATA);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const categoryLabels: Record<DropdownCategory, string> = {
    unites: 'Unités',
    services: 'Services',
    localisationAccident: 'Localisation accident',
    categorieAccident: 'Catégorie accident',
    typeAccident: 'Type d\'accident',
    siegeLesion: 'Siège de lésion',
    natureLesion: 'Nature de lésion',
    gravite: 'Gravité',
  };

  const categoryDescriptions: Record<DropdownCategory, string> = {
    unites: 'Gérez les unités organisationnelles',
    services: 'Gérez les services de votre organisation',
    localisationAccident: 'Localisations possibles pour les accidents',
    categorieAccident: 'Catégories d\'accidents',
    typeAccident: 'Types d\'accidents possibles',
    siegeLesion: 'Sièges anatomiques des lésions',
    natureLesion: 'Natures des lésions',
    gravite: 'Niveaux de gravité des accidents',
  };

  const handleAddValue = (category: DropdownCategory) => {
    const value = newValues[category]?.trim();
    if (!value) {
      toast.error('Veuillez saisir une valeur');
      return;
    }

    if (dropdownData[category].includes(value)) {
      toast.error('Cette valeur existe déjà');
      return;
    }

    setDropdownData(prev => ({
      ...prev,
      [category]: [...prev[category], value],
    }));

    setNewValues(prev => ({ ...prev, [category]: '' }));
    toast.success('Valeur ajoutée avec succès');
  };

  const handleDeleteValue = (category: DropdownCategory, value: string) => {
    setDropdownData(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value),
    }));
    toast.success('Valeur supprimée avec succès');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (userRole !== 'admin') {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-700 font-medium">
              Accès réservé aux administrateurs
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Settings}
        title="Gestion des Listes Déroulantes"
        subtitle="Ajoutez ou supprimez des options pour les formulaires"
      />

      <div className="grid gap-6">
        {(Object.keys(dropdownData) as DropdownCategory[]).map((category) => {
          const isExpanded = expandedCategories[category];
          const itemCount = dropdownData[category].length;

          return (
            <Card key={category} className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <List className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{categoryLabels[category]}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {categoryDescriptions[category]}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {itemCount} {itemCount === 1 ? 'élément' : 'éléments'}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    {/* Formulaire d'ajout */}
                    <div className="flex gap-2 mb-6">
                      <Input
                        placeholder="Nouvelle valeur..."
                        value={newValues[category] || ''}
                        onChange={(e) => setNewValues(prev => ({ ...prev, [category]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddValue(category);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleAddValue(category)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>

                    {/* Liste des valeurs */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {dropdownData[category].length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucune valeur. Ajoutez-en une ci-dessus.
                        </div>
                      ) : (
                        dropdownData[category].map((value, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                          >
                            <span className="text-gray-700 font-medium">{value}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteValue(category, value)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
