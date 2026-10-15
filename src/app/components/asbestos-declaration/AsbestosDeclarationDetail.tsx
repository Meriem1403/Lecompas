import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { AsbestosDeclaration } from '../AsbestosDeclarationView';

interface AsbestosDeclarationDetailProps {
  declaration: AsbestosDeclaration;
  currentUser: {
    name: string;
    role: 'admin' | 'chef_service' | 'agent';
  };
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onValidateAdmin: (id: string, comment: string) => void;
  onValidateSG: (id: string, comment: string) => void;
  onSendToAgent: (id: string) => void;
}

export function AsbestosDeclarationDetail({
  declaration,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onValidateAdmin,
  onValidateSG,
  onSendToAgent,
}: AsbestosDeclarationDetailProps) {
  const fullName = `${declaration.prenom} ${declaration.nom}`.trim();

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl">Déclaration amiante — {fullName}</CardTitle>
            <Badge variant="outline">{declaration.status}</Badge>
            <Badge>{declaration.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Service :</span> {declaration.service}
          </p>
          <p>
            <span className="font-semibold">Poste :</span> {declaration.intitulePosteActuel}
          </p>
          <p>
            <span className="font-semibold">Médecin de prévention :</span>{' '}
            {declaration.medecinPrevention}
          </p>
          <p>
            <span className="font-semibold">Créée par :</span> {declaration.createdBy} —{' '}
            {new Date(declaration.createdAt).toLocaleString('fr-FR')}
          </p>
          {declaration.adminComment && (
            <p>
              <span className="font-semibold">Commentaire admin :</span> {declaration.adminComment}
            </p>
          )}
          {declaration.sgComment && (
            <p>
              <span className="font-semibold">Commentaire SG :</span> {declaration.sgComment}
            </p>
          )}

          {currentUser.role === 'admin' && declaration.status === 'pending' && (
            <Button
              type="button"
              onClick={() => onValidateAdmin(declaration.id, 'Validé depuis le détail')}
            >
              Valider (admin)
            </Button>
          )}
          {currentUser.role === 'chef_service' && declaration.status === 'validated_admin' && (
            <Button
              type="button"
              onClick={() => onValidateSG(declaration.id, 'Validé SG depuis le détail')}
            >
              Valider (SG)
            </Button>
          )}
          {(currentUser.role === 'admin' || currentUser.role === 'chef_service') &&
            declaration.status === 'validated_sg' && (
              <Button type="button" onClick={() => onSendToAgent(declaration.id)}>
                Envoyer à l&apos;agent
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
