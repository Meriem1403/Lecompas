import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Waves,
  Mountain,
  Anchor,
  Ship,
  Fish,
  MapPin,
  User,
  FileText,
  History,
  ChevronRight,
} from 'lucide-react';
import { FishingZone } from '../FishermanView';

interface ZoneSelectionProps {
  onZoneSelect: (zone: FishingZone) => void;
  onGoToAccount: () => void;
  onGoToMyAuthorizations: () => void;
  onGoToMyCaptures: () => void;
}

export function ZoneSelection({
  onZoneSelect,
  onGoToAccount,
  onGoToMyAuthorizations,
  onGoToMyCaptures,
}: ZoneSelectionProps) {
  const zones = [
    {
      id: 'golfe_lion' as FishingZone,
      name: 'Parc naturel marin du Golfe du Lion',
      icon: Waves,
      color: 'from-blue-400 to-cyan-500',
      borderColor: 'border-blue-300',
      description: 'Zone maritime au large des côtes du Languedoc-Roussillon',
      location: 'Méditerranée occidentale',
    },
    {
      id: 'calanques' as FishingZone,
      name: 'Parc national des Calanques',
      icon: Mountain,
      color: 'from-emerald-400 to-teal-500',
      borderColor: 'border-emerald-300',
      description: 'Espace naturel protégé entre Marseille et Cassis',
      location: 'Bouches-du-Rhône',
    },
    {
      id: 'bonifacio' as FishingZone,
      name: 'Réserve Naturelle des Bouches de Bonifacio',
      icon: Anchor,
      color: 'from-purple-400 to-indigo-500',
      borderColor: 'border-purple-300',
      description: 'Réserve naturelle marine de Corse du Sud',
      location: 'Corse',
    },
    {
      id: 'cap_corse' as FishingZone,
      name: 'Parc naturel marin du Cap Corse et de l\'Agriate',
      icon: Ship,
      color: 'from-orange-400 to-amber-500',
      borderColor: 'border-orange-300',
      description: 'Parc marin au nord de la Corse',
      location: 'Haute-Corse',
    },
    {
      id: 'cerbere_banyuls' as FishingZone,
      name: 'RNN Marine de Cerbère-Banyuls',
      icon: Fish,
      color: 'from-rose-400 to-pink-500',
      borderColor: 'border-rose-300',
      description: 'Première réserve marine française créée en 1974',
      location: 'Pyrénées-Orientales',
    },
    {
      id: 'mediterranee' as FishingZone,
      name: 'Méditerranée (hors parc marin réglementé)',
      icon: Waves,
      color: 'from-sky-400 to-blue-500',
      borderColor: 'border-sky-300',
      description: 'Zone maritime méditerranéenne hors zones réglementées',
      location: 'Méditerranée française',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Fish className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent text-center sm:text-left">
              CatchMachine
            </h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Système de gestion de la pêche en Méditerranée
          </p>
          <p className="text-gray-600">
            Sélectionnez votre zone de pêche pour commencer
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={onGoToAccount}
            variant="outline"
            className="border-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <User className="h-4 w-4 mr-2" />
            Mon compte
          </Button>
          <Button
            onClick={onGoToMyAuthorizations}
            variant="outline"
            className="border-2 hover:bg-green-50 hover:border-green-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Mes autorisations
          </Button>
          <Button
            onClick={onGoToMyCaptures}
            variant="outline"
            className="border-2 hover:bg-purple-50 hover:border-purple-300"
          >
            <History className="h-4 w-4 mr-2" />
            Mes déclarations
          </Button>
        </div>

        {/* Information Card */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
                <Fish className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-2">
                  Bienvenue sur CatchMachine
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Cette plateforme vous permet de <strong>demander une autorisation de pêche</strong>, 
                  de <strong>déclarer vos captures</strong> et de consulter la réglementation en vigueur 
                  dans les zones maritimes protégées de Méditerranée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {zones.map((zone) => {
            const ZoneIcon = zone.icon;
            
            return (
              <Card
                key={zone.id}
                className={`border-3 ${zone.borderColor} shadow-xl hover:shadow-2xl transition-all duration-300 xl:hover:scale-105 cursor-pointer bg-white overflow-hidden group h-full`}
                onClick={() => onZoneSelect(zone.id)}
              >
                <div className={`h-3 bg-gradient-to-r ${zone.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${zone.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <ZoneIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight mb-2 break-words">
                        {zone.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300">
                        <MapPin className="h-3 w-3 mr-1" />
                        {zone.location}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col h-full">
                  <p className="text-sm text-gray-600 leading-relaxed break-words">
                    {zone.description}
                  </p>
                  
                  <Button
                    onClick={() => onZoneSelect(zone.id)}
                    className={`w-full mt-auto bg-gradient-to-r ${zone.color} hover:opacity-90 text-white shadow-lg`}
                  >
                    Sélectionner cette zone
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <Card className="border-2 border-gray-200 bg-white/80 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600 space-y-2">
              <p>
                <strong>Note importante :</strong> La déclaration des captures doit être effectuée 
                avant de changer de lieu de pêche conformément à la réglementation.
              </p>
              <p className="text-xs text-gray-500">
                Les données collectées sont utilisées à des fins scientifiques et de gestion durable 
                des ressources halieutiques.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
