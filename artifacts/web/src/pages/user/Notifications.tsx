import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { toast } = useToast();
  const { data: notificationsRes, isLoading, refetch } = useListNotifications({ limit: 50 });
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update notification" });
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        {notificationsRes?.unreadCount ? (
          <span className="px-3 py-1 bg-primary/20 text-primary font-bold rounded-full text-sm">
            {notificationsRes.unreadCount} unread
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : !notificationsRes?.data || notificationsRes.data.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center shadow-xl">
          <Bell className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">You're all caught up</h2>
          <p className="text-muted-foreground">No new notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificationsRes.data.map(notif => (
            <div key={notif.id} className={`p-5 rounded-2xl border transition-all ${
              notif.isRead 
                ? 'bg-card border-border opacity-70' 
                : 'bg-primary/5 border-primary/20 shadow-md'
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className={`font-bold ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-3">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                {!notif.isRead && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="shrink-0"
                    onClick={() => handleMarkRead(notif.id)}
                    disabled={markReadMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
