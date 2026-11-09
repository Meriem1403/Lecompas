import React, { useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Info,
  AlertTriangle,
  Zap,
  Wrench,
  Sparkles,
  Newspaper,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { cn } from "./ui/utils";

interface Notification {
  id: string;
  titre: string;
  contenu: string;
  type: "info" | "alerte" | "urgent" | "maintenance";
  dateCreation: string;
  isRead: boolean;
  actionReturnId?: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToActualites: () => void;
  onReviewActionReturn?: (actionReturnId: string) => void;
}

type TypeConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
  badge: string;
  accent: string;
};

const TYPE_CONFIG: Record<Notification["type"], TypeConfig> = {
  info: {
    label: "Information",
    icon: Info,
    iconWrap: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-200/80",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    accent: "border-l-sky-500",
  },
  alerte: {
    label: "Alerte",
    icon: AlertTriangle,
    iconWrap: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-200/80",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    accent: "border-l-amber-500",
  },
  urgent: {
    label: "Urgent",
    icon: Zap,
    iconWrap: "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200/80",
    badge: "bg-rose-50 text-rose-900 border-rose-200",
    accent: "border-l-rose-500",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    iconWrap: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-200/80",
    badge: "bg-violet-50 text-violet-900 border-violet-200",
    accent: "border-l-violet-500",
  },
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 48) return `Il y a ${diffH} h`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToActualites,
  onReviewActionReturn,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications],
  );

  const hasUnread = unreadCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={
            hasUnread
              ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Notifications"
          }
          className={cn(
            "relative h-11 w-11 rounded-xl border-2 transition-all duration-200",
            hasUnread
              ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-indigo-700 shadow-md shadow-indigo-100/80 hover:border-indigo-300 hover:shadow-lg"
              : "border-purple-100 bg-white/90 text-slate-600 hover:border-purple-200 hover:bg-purple-50/80 hover:text-purple-700",
            isOpen && "ring-2 ring-indigo-300/40 border-indigo-300",
          )}
        >
          {hasUnread ? (
            <BellRing
              className={cn(
                "h-5 w-5 transition-transform",
                isOpen && "scale-110",
              )}
              aria-hidden
            />
          ) : (
            <Bell className="h-5 w-5" aria-hidden />
          )}
          {hasUnread ? (
            <>
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                aria-hidden
              >
                {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span
                className="absolute inset-0 rounded-xl bg-indigo-400/10 animate-pulse pointer-events-none"
                aria-hidden
              />
            </>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        collisionPadding={12}
        className="flex w-[min(100vw-1.5rem,24rem)] max-h-[min(32rem,70vh)] flex-col overflow-hidden p-0 rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-800 px-4 py-4 text-white">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-cyan-400/20 blur-xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-cyan-100" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-tight tracking-tight">
                  Centre de notifications
                </h3>
                <p className="text-xs text-indigo-100/90 mt-0.5">
                  {notifications.length} message
                  {notifications.length !== 1 ? "s" : ""} ·{" "}
                  {hasUnread
                    ? `${unreadCount} à lire`
                    : "Tout est à jour"}
                </p>
              </div>
            </div>
            {hasUnread ? (
              <Badge className="shrink-0 bg-white/95 text-indigo-800 hover:bg-white border-0 font-semibold shadow-sm">
                {unreadCount} nouv.
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-emerald-500/90 text-white border-0 hover:bg-emerald-500">
                <Check className="h-3 w-3 mr-1" aria-hidden />
                Lu
              </Badge>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {recentNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                <Bell className="h-8 w-8 text-slate-400" aria-hidden />
              </div>
              <p className="font-medium text-slate-800">Aucune notification</p>
              <p className="text-sm text-slate-500 mt-1 max-w-[240px] mx-auto">
                Les alertes DUERP, retours d&apos;action et actualités
                apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 p-3" role="list">
              {recentNotifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <li key={notification.id} className="min-w-0">
                    <article
                      className={cn(
                        "rounded-xl border border-slate-200 bg-white p-3",
                        !notification.isRead && "border-indigo-200 bg-indigo-50/40",
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            config.iconWrap,
                          )}
                        >
                          <Icon className="h-4 w-4 text-white" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="min-w-0 font-semibold text-sm text-slate-900 leading-snug">
                              {notification.titre}
                            </h4>
                            {!notification.isRead ? (
                              <span
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                                title="Non lu"
                                aria-label="Non lu"
                              />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                            {notification.contenu}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-medium", config.badge)}
                            >
                              {config.label}
                            </Badge>
                            <time
                              className="text-[11px] text-slate-500"
                              dateTime={notification.dateCreation}
                            >
                              {formatRelativeTime(notification.dateCreation)}
                            </time>
                          </div>
                        </div>
                      </div>
                      {notification.actionReturnId && onReviewActionReturn || !notification.isRead ? (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          {notification.actionReturnId && onReviewActionReturn ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 w-full text-xs sm:flex-1 bg-indigo-700 hover:bg-indigo-800"
                              onClick={() => {
                                onReviewActionReturn(notification.actionReturnId!);
                                if (!notification.isRead) {
                                  onMarkAsRead(notification.id);
                                }
                                setIsOpen(false);
                              }}
                            >
                              Examiner le retour
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          ) : null}
                          {!notification.isRead ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-full text-xs sm:w-auto"
                              onClick={() => onMarkAsRead(notification.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Marquer lu
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {recentNotifications.length > 0 ? (
          <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 p-3">
            {hasUnread ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full bg-white text-xs"
                onClick={() => {
                  onMarkAllAsRead();
                }}
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Tout marquer comme lu
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="h-8 w-full bg-slate-900 text-xs hover:bg-slate-800"
              onClick={() => {
                onNavigateToActualites();
                setIsOpen(false);
              }}
            >
              <Newspaper className="h-3.5 w-3.5" aria-hidden />
              Voir les actualités
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
