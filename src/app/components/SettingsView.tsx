import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { NotificationSettings, NotificationPreference } from './NotificationSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { 
  Building2, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Mail, 
  FileText, 
  Globe,
  Save,
  Upload,
  Download,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  Send,
  FileSignature,
  User
} from 'lucide-react';
import { toast } from 'sonner';

type SettingsSection = 'organization' | 'notifications' | 'security' | 'appearance' | 'data' | 'documents';

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('organization');
  
  // États pour les paramètres d'organisation
  const [orgName, setOrgName] = useState('Direction Interrégionale de la Mer Méditerranée');
  const [orgAddress, setOrgAddress] = useState('16 Quai de Rive Neuve, 13007 Marseille');
  const [orgSiret, setOrgSiret] = useState('');
  const [orgPhone, setOrgPhone] = useState('+33 4 91 32 85 00');
  const [orgEmail, setOrgEmail] = useState('dirm.mediterranee@developpement-durable.gouv.fr');
  const [orgMinistry, setOrgMinistry] = useState('Ministère de la Transition écologique');
  const [orgService, setOrgService] = useState('Direction Interrégionale');
  
  // Configuration du directeur pour signature DUERP
  const [directorName, setDirectorName] = useState('Jean-Marc DUBOIS');
  const [directorEmail, setDirectorEmail] = useState('jean-marc.dubois@developpement-durable.gouv.fr');
  const [directorTitle, setDirectorTitle] = useState('Directeur Interrégional');
  const [directorPhone, setDirectorPhone] = useState('+33 4 91 32 85 01');
  
  // États pour les notifications et emails
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [actionDeadlines, setActionDeadlines] = useState(true);
  const [accidentAlerts, setAccidentAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  
  // Configuration SMTP et email
  const [senderEmail, setSenderEmail] = useState('noreply@dirm-mediterranee.gouv.fr');
  const [senderName, setSenderName] = useState('DUERP - DIRM Méditerranée');
  const [replyToEmail, setReplyToEmail] = useState('support@dirm-mediterranee.gouv.fr');
  const [smtpHost, setSmtpHost] = useState('smtp.gouv.fr');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [emailSignature, setEmailSignature] = useState('Direction Interrégionale de la Mer Méditerranée\n16 Quai de Rive Neuve, 13007 Marseille\nTél: +33 4 91 32 85 00');
  
  // États pour la sécurité
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [showPassword, setShowPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  
  // États pour l'apparence
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('fr');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  
  // États pour les documents
  const [autoArchive, setAutoArchive] = useState(true);
  const [archivePeriod, setArchivePeriod] = useState('365');
  const [exportFormat, setExportFormat] = useState('pdf');

  // États pour les dialogs de confirmation
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // État pour le logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSaveSettings = () => {
    // Validation des champs obligatoires
    if (!orgName.trim()) {
      toast.error('Le nom de l\'administration est requis');
      return;
    }
    
    console.log('Enregistrement des paramètres...');
    console.log('Organisation:', { orgName, orgAddress, orgSiret, orgPhone, orgEmail, orgMinistry, orgService });
    console.log('Logo:', logoFile ? logoFile.name : 'Aucun logo');
    console.log('Sécurité:', { twoFactorAuth, sessionTimeout, passwordExpiry });
    console.log('Apparence:', { theme, language, dateFormat });
    console.log('Documents:', { autoArchive, archivePeriod, exportFormat });
    
    // Simuler une sauvegarde
    setTimeout(() => {
      toast.success('Tous les paramètres ont été enregistrés avec succès');
    }, 500);
  };

  const handleUploadLogo = () => {
    console.log('Ouverture du sélecteur de fichiers...');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    
    input.onchange = (e) => {
      console.log('Fichier sélectionné');
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Fichier:', file.name, 'Taille:', file.size, 'bytes');
        
        // Vérifier la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Le fichier est trop volumineux (max 2MB)');
          return;
        }
        
        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          console.log('Lecture du fichier terminée');
          const result = readerEvent.target?.result as string;
          setLogoPreview(result);
          setLogoFile(file);
          toast.success(`Logo "${file.name}" téléchargé avec succès`);
        };
        reader.onerror = () => {
          console.error('Erreur lors de la lecture du fichier');
          toast.error('Erreur lors de la lecture du fichier');
        };
        reader.readAsDataURL(file);
      } else {
        console.log('Aucun fichier sélectionné');
      }
    };
    
    input.click();
    console.log('Clic sur input déclenché');
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    toast.success('Logo supprimé');
  };

  const handleImportData = () => {
    toast.info('Sélectionnez un fichier CSV ou Excel à importer');
  };

  const handleExportData = () => {
    toast.success('Export des données en cours...');
    setTimeout(() => {
      toast.success('Données exportées avec succès');
    }, 1500);
  };

  const handleDeleteAllData = () => {
    setDeleteDataDialogOpen(false);
    toast.success('Toutes les données ont été supprimées');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    toast.success('Mot de passe modifié avec succès');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDownloadTemplate = (template: string) => {
    toast.success(`Téléchargement du modèle "${template}" en cours...`);
    setTimeout(() => {
      toast.success('Modèle téléchargé avec succès');
    }, 1000);
  };

  const handleEditTemplate = (template: string) => {
    toast.info(`Édition du modèle "${template}"`);
  };

  const handleTestEmail = () => {
    if (!senderEmail || !smtpHost || !smtpPort) {
      toast.error('Veuillez remplir tous les champs obligatoires (email expéditeur, hôte et port SMTP)');
      return;
    }
    
    toast.info('Envoi d\'un email de test en cours...');
    console.log('Test email avec configuration:', {
      from: `${senderName} <${senderEmail}>`,
      replyTo: replyToEmail,
      smtp: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser
      }
    });
    
    setTimeout(() => {
      toast.success('Email de test envoyé avec succès ! Vérifiez votre boîte de réception.');
    }, 2000);
  };

  const handleSaveSmtpConfig = () => {
    if (!senderEmail || !smtpHost || !smtpPort) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    console.log('Sauvegarde de la configuration SMTP:', {
      senderEmail,
      senderName,
      replyToEmail,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpSecure,
      emailSignature
    });
    
    toast.success('Configuration SMTP enregistrée avec succès');
  };

  const sections = [
    { id: 'organization' as const, label: 'Organisation', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, color: 'from-purple-500 to-indigo-500' },
    { id: 'security' as const, label: 'Sécurité', icon: Shield, color: 'from-red-500 to-rose-500' },
    { id: 'appearance' as const, label: 'Apparence', icon: Palette, color: 'from-green-500 to-emerald-500' },
    { id: 'data' as const, label: 'Données', icon: Database, color: 'from-orange-500 to-amber-500' },
    { id: 'documents' as const, label: 'Documents', icon: FileText, color: 'from-pink-500 to-fuchsia-500' },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-gray-900">Paramètres</h3>
          <p className="text-gray-600">Gérez les paramètres de votre application DUERP</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer tout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu de navigation */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur lg:sticky lg:top-6">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive 
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Contenu des paramètres */}
        <div className="lg:col-span-3 space-y-6">
          {/* Organisation */}
          {activeSection === 'organization' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Informations de l'organisation</CardTitle>
                    <CardDescription>Gérez les informations de votre service public</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="orgName">Nom de l'administration *</Label>
                    <Input 
                      id="orgName" 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Direction Interrégionale de la Mer Méditerranée"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgMinistry">Ministère de tutelle</Label>
                    <Input 
                      id="orgMinistry" 
                      value={orgMinistry} 
                      onChange={(e) => setOrgMinistry(e.target.value)}
                      placeholder="Ministère de la Transition écologique"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgService">Type de service</Label>
                    <Input 
                      id="orgService" 
                      value={orgService} 
                      onChange={(e) => setOrgService(e.target.value)}
                      placeholder="Direction Interrégionale"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="orgAddress">Adresse du siège</Label>
                    <Textarea 
                      id="orgAddress" 
                      value={orgAddress} 
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Adresse complète du siège"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Téléphone standard</Label>
                    <Input 
                      id="orgPhone" 
                      value={orgPhone} 
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="+33 4 91 32 85 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email de contact</Label>
                    <Input 
                      id="orgEmail" 
                      type="email"
                      value={orgEmail} 
                      onChange={(e) => setOrgEmail(e.target.value)}
                      placeholder="contact@developpement-durable.gouv.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgSiret">SIRET (optionnel)</Label>
                    <Input 
                      id="orgSiret" 
                      value={orgSiret} 
                      onChange={(e) => setOrgSiret(e.target.value)}
                      placeholder="123 456 789 00010"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Logo de l'administration</h4>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-0">
                    <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center border-2 border-dashed border-blue-300 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <Building2 className="h-12 w-12 text-blue-500" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleUploadLogo();
                        }}
                        type="button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Télécharger un logo
                      </Button>
                      <p className="text-xs text-gray-500">PNG, JPG jusqu'à 2MB</p>
                      {logoFile && (
                        <p className="text-xs text-green-600">✓ {logoFile.name}</p>
                      )}
                    </div>
                  </div>
                  {logoPreview && (
                    <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={handleRemoveLogo} type="button">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer le logo
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <FileSignature className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Signataire du DUERP</h4>
                      <p className="text-sm text-gray-600">Coordonnées du directeur pour la signature électronique</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Important :</strong> Ces informations seront utilisées pour envoyer le DUERP pour signature électronique.
                      Le directeur recevra un email avec un lien sécurisé pour signer le document.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="directorName">Nom complet du directeur *</Label>
                      <Input 
                        id="directorName" 
                        value={directorName} 
                        onChange={(e) => setDirectorName(e.target.value)}
                        placeholder="Jean-Marc DUBOIS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="directorTitle">Fonction / Titre *</Label>
                      <Input 
                        id="directorTitle" 
                        value={directorTitle} 
                        onChange={(e) => setDirectorTitle(e.target.value)}
                        placeholder="Directeur Interrégional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="directorEmail">Email professionnel *</Label>
                      <Input 
                        id="directorEmail" 
                        type="email"
                        value={directorEmail} 
                        onChange={(e) => setDirectorEmail(e.target.value)}
                        placeholder="jean-marc.dubois@developpement-durable.gouv.fr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="directorPhone">Téléphone direct (optionnel)</Label>
                      <Input 
                        id="directorPhone" 
                        value={directorPhone} 
                        onChange={(e) => setDirectorPhone(e.target.value)}
                        placeholder="+33 4 91 32 85 01"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <NotificationSettings
                  preferences={{
                    id: '1',
                    userId: 'current-user',
                    email: orgEmail,
                    enableEmail: emailNotifications,
                    enableInApp: true,
                    notifyNewRisk: riskAlerts,
                    notifyRiskUpdate: riskAlerts,
                    notifyNewAccident: accidentAlerts,
                    notifyAccidentUpdate: accidentAlerts,
                    notifyNewActuality: true,
                    notifyActionReturn: true,
                    notifyActionReturnValidation: true,
                    notifyCerbereRequest: true,
                    notifyCerbereValidation: true,
                    notifyArriveesDeparts: true,
                    filters: {
                      roles: [],
                      services: [],
                      domaines: [],
                      lieux: [],
                      categories: []
                    },
                    frequency: 'immediate'
                  }}
                  onSave={(prefs) => {
                    console.log('Préférences de notification sauvegardées:', prefs);
                    setEmailNotifications(prefs.enableEmail);
                    setRiskAlerts(prefs.notifyNewRisk);
                    setAccidentAlerts(prefs.notifyNewAccident);
                  }}
                  availableServices={['Service Général', 'Service Technique', 'Service Administratif', 'Service RH', 'Service Financier']}
                  availableDomaines={['Terre', 'Mer', 'Bureau', 'Chantier', 'Laboratoire']}
                  availableLieux={['Marseille', 'Toulon', 'Nice', 'Port-de-Bouc', 'Martigues']}
                  availableCategories={['Risques physiques', 'Risques chimiques', 'Risques biologiques', 'Risques psychosociaux', 'Risques ergonomiques']}
                />
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Configuration SMTP</h4>
                      <p className="text-sm text-gray-600">Paramètres du serveur d'envoi d'emails</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail">Email de l'expéditeur *</Label>
                      <Input 
                        id="senderEmail" 
                        value={senderEmail} 
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="noreply@dirm-mediterranee.gouv.fr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Nom de l'expéditeur *</Label>
                      <Input 
                        id="senderName" 
                        value={senderName} 
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="DUERP - DIRM Méditerranée"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail">Email de réponse</Label>
                      <Input 
                        id="replyToEmail" 
                        value={replyToEmail} 
                        onChange={(e) => setReplyToEmail(e.target.value)}
                        placeholder="support@dirm-mediterranee.gouv.fr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">Hôte SMTP *</Label>
                      <Input 
                        id="smtpHost" 
                        value={smtpHost} 
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gouv.fr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port SMTP *</Label>
                      <Input 
                        id="smtpPort" 
                        value={smtpPort} 
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                      <Input 
                        id="smtpUser" 
                        value={smtpUser} 
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="utilisateur@domaine.fr"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpPassword">Mot de passe SMTP</Label>
                      <div className="relative">
                        <Input 
                          id="smtpPassword" 
                          type={showSmtpPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="space-y-1">
                          <Label htmlFor="smtpSecure" className="text-sm font-semibold">Connexion sécurisée (TLS/SSL)</Label>
                          <p className="text-xs text-gray-500">Activer le chiffrement pour les connexions SMTP</p>
                        </div>
                        <Switch 
                          id="smtpSecure" 
                          checked={smtpSecure}
                          onCheckedChange={setSmtpSecure}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="emailSignature">Signature des emails</Label>
                      <Textarea 
                        id="emailSignature" 
                        value={emailSignature} 
                        onChange={(e) => setEmailSignature(e.target.value)}
                        placeholder="Signature des emails"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Test et sauvegarde</h4>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleTestEmail}
                      className="w-full sm:w-auto border-blue-300 hover:bg-blue-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer un email de test
                    </Button>
                    <Button 
                      onClick={handleSaveSmtpConfig}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer la configuration SMTP
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sécurité */}
          {activeSection === 'security' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Sécurité</CardTitle>
                    <CardDescription>Paramètres de sécurité et confidentialité</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50">
                    <div className="space-y-1">
                      <Label htmlFor="twoFactorAuth" className="text-base font-semibold">Authentification à deux facteurs</Label>
                      <p className="text-sm text-gray-600">Sécurité renforcée pour votre compte</p>
                    </div>
                    <Switch 
                      id="twoFactorAuth" 
                      checked={twoFactorAuth}
                      onCheckedChange={setTwoFactorAuth}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Durée de session (minutes)</Label>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                        <SelectItem value="480">8 heures</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">Déconnexion automatique après inactivité</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">Expiration du mot de passe (jours)</Label>
                    <Select value={passwordExpiry} onValueChange={setPasswordExpiry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="180">180 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                        <SelectItem value="0">Jamais</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">Obliger le changement de mot de passe</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Changer le mot de passe</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input 
                          id="currentPassword" 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input 
                        id="newPassword" 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input 
                        id="confirmPassword" 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700" onClick={handleChangePassword}>
                      <Lock className="h-4 w-4 mr-2" />
                      Modifier le mot de passe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apparence */}
          {activeSection === 'appearance' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Apparence</CardTitle>
                    <CardDescription>Personnalisez l'interface de l'application</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème de l'application</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="auto">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue de l'interface</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Aperçu des couleurs</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg"></div>
                      <p className="text-xs text-center text-gray-600">Primaire</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-lg"></div>
                      <p className="text-xs text-center text-gray-600">Danger</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"></div>
                      <p className="text-xs text-center text-gray-600">Succès</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg"></div>
                      <p className="text-xs text-center text-gray-600">Avertissement</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Données */}
          {activeSection === 'data' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Gestion des données</CardTitle>
                    <CardDescription>Importation, exportation et sauvegarde</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-6 text-center space-y-3">
                      <Upload className="h-12 w-12 text-orange-600 mx-auto" />
                      <h4 className="font-semibold text-gray-900">Importer des données</h4>
                      <p className="text-sm text-gray-600">Format CSV ou Excel</p>
                      <Button variant="outline" className="w-full border-orange-300 hover:bg-orange-100" onClick={handleImportData}>
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir un fichier
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-6 text-center space-y-3">
                      <Download className="h-12 w-12 text-blue-600 mx-auto" />
                      <h4 className="font-semibold text-gray-900">Exporter les données</h4>
                      <p className="text-sm text-gray-600">Sauvegarde complète</p>
                      <Button variant="outline" className="w-full border-blue-300 hover:bg-blue-100" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Sauvegarde automatique</h4>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Dernière sauvegarde</p>
                        <p className="text-sm text-gray-600">Aujourd'hui à 03:00</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Badge variant="outline" className="p-3 justify-center text-sm">
                      <Database className="h-4 w-4 mr-2" />
                      245 Risques
                    </Badge>
                    <Badge variant="outline" className="p-3 justify-center text-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      89 Documents
                    </Badge>
                    <Badge variant="outline" className="p-3 justify-center text-sm">
                      <Building2 className="h-4 w-4 mr-2" />
                      12 Services
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-red-600 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Zone dangereuse
                  </h4>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
                    <p className="text-sm text-gray-700">
                      La suppression des données est irréversible. Assurez-vous d'avoir une sauvegarde avant de procéder.
                    </p>
                    <Button variant="destructive" className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700" onClick={() => setDeleteDataDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer toutes les données
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {activeSection === 'documents' && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Paramètres des documents</CardTitle>
                    <CardDescription>Configuration de la gestion documentaire</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-pink-50 to-fuchsia-50">
                  <div className="space-y-1">
                    <Label htmlFor="autoArchive" className="text-base font-semibold">Archivage automatique</Label>
                    <p className="text-sm text-gray-600">Archiver les documents après une période définie</p>
                  </div>
                  <Switch 
                    id="autoArchive" 
                    checked={autoArchive}
                    onCheckedChange={setAutoArchive}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archivePeriod">Période d'archivage (jours)</Label>
                  <Select value={archivePeriod} onValueChange={setArchivePeriod} disabled={!autoArchive}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 jours (3 mois)</SelectItem>
                      <SelectItem value="180">180 jours (6 mois)</SelectItem>
                      <SelectItem value="365">365 jours (1 an)</SelectItem>
                      <SelectItem value="730">730 jours (2 ans)</SelectItem>
                      <SelectItem value="1825">1825 jours (5 ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Format d'export par défaut</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word (DOCX)</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Modèles de documents DUERP</h4>
                  <div className="space-y-3">
                    {['Document Unique (DUERP)', 'Registre des accidents', 'Plan d\'action', 'Rapport d\'évaluation'].map((template, idx) => (
                      <div key={idx} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-pink-600" />
                          <span className="font-medium text-gray-900">{template}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleDownloadTemplate(template)}>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Télécharger
                          </Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de confirmation pour la suppression des données */}
      <AlertDialog open={deleteDataDialogOpen} onOpenChange={setDeleteDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto" onClick={handleDeleteAllData}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}