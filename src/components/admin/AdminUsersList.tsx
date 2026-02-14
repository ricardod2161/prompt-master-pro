import { useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Plus, X, Building2, Shield, Unlink, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleColors: Record<AppRole, string> = {
  developer: "bg-red-500/20 text-red-500 border-red-500/30",
  admin: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  manager: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  cashier: "bg-green-500/20 text-green-500 border-green-500/30",
  kitchen: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  waiter: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
};

const roleLabels: Record<AppRole, string> = {
  developer: "Desenvolvedor",
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Caixa",
  kitchen: "Cozinha",
  waiter: "Garçom",
};

const availableRoles: AppRole[] = ["admin", "manager", "cashier", "kitchen", "waiter"];

export function AdminUsersList() {
  const { users, loading, addRole, removeRole, assignUnit, removeUnit, deleteUser, isDeletingUser } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAssignUnitOpen, setIsAssignUnitOpen] = useState(false);
  const [isRemoveUnitOpen, setIsRemoveUnitOpen] = useState(false);

  // Buscar unidades disponíveis
  const { data: units } = useQuery({
    queryKey: ["admin-units-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const handleAddRole = (userId: string, role: AppRole) => {
    addRole({ userId, role });
    setIsAddRoleOpen(false);
  };

  const handleAssignUnit = (userId: string, unitId: string) => {
    assignUnit({ userId, unitId });
    setIsAssignUnitOpen(false);
  };

  const handleRemoveUnit = (userId: string, unitId: string) => {
    removeUnit({ userId, unitId });
    setIsRemoveUnitOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Nenhuma</span>
                    ) : (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`${roleColors[role]} cursor-pointer hover:opacity-80`}
                          onClick={() => {
                            if (role !== "developer") {
                              removeRole({ userId: user.user_id, role });
                            }
                          }}
                        >
                          {roleLabels[role]}
                          {role !== "developer" && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.units.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Nenhuma</span>
                    ) : (
                      user.units.map((unit) => (
                        <Badge
                          key={unit.id}
                          variant="secondary"
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => removeUnit({ userId: user.user_id, unitId: unit.id })}
                        >
                          {unit.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Dialog open={isAddRoleOpen && selectedUser === user.user_id} onOpenChange={(open) => {
                        setIsAddRoleOpen(open);
                        if (open) setSelectedUser(user.user_id);
                      }}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Shield className="mr-2 h-4 w-4" />
                            Adicionar Role
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Role</DialogTitle>
                          </DialogHeader>
                          <Select onValueChange={(value) => handleAddRole(user.user_id, value as AppRole)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma role" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles
                                .filter((r) => !user.roles.includes(r))
                                .map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {roleLabels[role]}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isAssignUnitOpen && selectedUser === user.user_id} onOpenChange={(open) => {
                        setIsAssignUnitOpen(open);
                        if (open) setSelectedUser(user.user_id);
                      }}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Associar Unidade
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Associar a Unidade</DialogTitle>
                          </DialogHeader>
                          <Select onValueChange={(value) => handleAssignUnit(user.user_id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma unidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {(units || [])
                                .filter((u) => !user.units.some((uu) => uu.id === u.id))
                                .map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isRemoveUnitOpen && selectedUser === user.user_id} onOpenChange={(open) => {
                        setIsRemoveUnitOpen(open);
                        if (open) setSelectedUser(user.user_id);
                      }}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            disabled={user.units.length === 0}
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Desassociar Unidade
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Desassociar Unidade</DialogTitle>
                          </DialogHeader>
                          {user.units.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Este usuário não está associado a nenhuma unidade.</p>
                          ) : (
                            <Select onValueChange={(value) => handleRemoveUnit(user.user_id, value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma unidade para desassociar" />
                              </SelectTrigger>
                              <SelectContent>
                                {user.units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                         </DialogContent>
                      </Dialog>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                            disabled={user.roles.includes("developer")}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Usuário
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir <strong>{user.full_name || "este usuário"}</strong>? 
                              Todas as roles, unidades associadas e notificações serão removidas. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser({ userId: user.user_id, profileId: user.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
