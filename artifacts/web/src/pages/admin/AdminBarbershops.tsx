import { useState } from "react";
import { useListBarbershops, useApproveBarbershop, useRejectBarbershop } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminBarbershops() {
  const { toast } = useToast();
  const { data: shopsRes, isLoading, refetch } = useListBarbershops({ limit: 100 });
  const approveMutation = useApproveBarbershop();
  const rejectMutation = useRejectBarbershop();

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await approveMutation.mutateAsync({ id });
        toast({ title: "Shop approved" });
      } else {
        await rejectMutation.mutateAsync({ id });
        toast({ title: "Shop rejected" });
      }
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-primary hover:bg-primary">Active</Badge>;
      case 'pending': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending Approval</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Barbershop Management</h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !shopsRes?.data.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No shops found.</TableCell></TableRow>
            ) : (
              shopsRes.data.map(shop => (
                <TableRow key={shop.id}>
                  <TableCell className="font-bold">{shop.name}</TableCell>
                  <TableCell>{shop.city}</TableCell>
                  <TableCell>#{shop.ownerId}</TableCell>
                  <TableCell>{getStatusBadge(shop.status)}</TableCell>
                  <TableCell className="text-right">
                    {shop.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(shop.id, 'approve')}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(shop.id, 'reject')}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
