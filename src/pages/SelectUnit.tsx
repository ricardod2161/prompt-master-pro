import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnit } from "@/contexts/UnitContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card3D, Card3DContent, Card3DHeader, Card3DTitle, Card3DDescription } from "@/components/ui/card-3d";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Plus, MapPin, Phone, Loader2, LogOut } from "lucide-react";

export default function SelectUnit() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { units, setSelectedUnit, loading, refetchUnits } = useUnit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New unit form
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitAddress, setNewUnitAddress] = useState("");
  const [newUnitPhone, setNewUnitPhone] = useState("");
  const [newUnitCnpj, setNewUnitCnpj] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSelectUnit = (unit: typeof units[0]) => {
    setSelectedUnit(unit);
    navigate("/dashboard");
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);

    try {
      // Create the unit
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .insert({
          name: newUnitName,
          address: newUnitAddress || null,
          phone: newUnitPhone || null,
          cnpj: newUnitCnpj || null,
        })
        .select()
        .single();

      if (unitError) throw unitError;

      // Associate user with unit
      const { error: userUnitError } = await supabase.from("user_units").insert({
        user_id: user.id,
        unit_id: unitData.id,
        is_default: units.length === 0,
      });

      if (userUnitError) throw userUnitError;

      // Add admin role to user
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "admin",
      });

      // Ignore if role already exists
      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      toast.success("Unidade criada com sucesso!");
      setDialogOpen(false);
      setNewUnitName("");
      setNewUnitAddress("");
      setNewUnitPhone("");
      setNewUnitCnpj("");
      await refetchUnits();
    } catch (error: any) {
      console.error("Error creating unit:", error);
      toast.error("Erro ao criar unidade", {
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold">Selecione uma Unidade</h1>
            <p className="text-muted-foreground mt-1">
              Escolha a unidade que deseja gerenciar
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="hover-lift">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Units Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit, index) => (
            <Card3D
              key={unit.id}
              variant="elevated"
              className="cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              onClick={() => handleSelectUnit(unit)}
            >
              <Card3DHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                    <Building2 className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>
                <Card3DTitle className="mt-4 text-xl">{unit.name}</Card3DTitle>
                {unit.cnpj && (
                  <Card3DDescription>{unit.cnpj}</Card3DDescription>
                )}
              </Card3DHeader>
              <Card3DContent className="space-y-2 text-sm text-muted-foreground">
                {unit.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary/60" />
                    <span className="truncate">{unit.address}</span>
                  </div>
                )}
                {unit.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary/60" />
                    <span>{unit.phone}</span>
                  </div>
                )}
              </Card3DContent>
            </Card3D>
          ))}

          {/* Add New Unit Card */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Card3D 
                variant="outlined" 
                className="cursor-pointer border-dashed animate-fade-in-up"
                style={{ animationDelay: `${0.1 * (units.length + 1)}s` }}
              >
                <Card3DContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-7 h-7" />
                  </div>
                  <span className="font-medium">Nova Unidade</span>
                </Card3DContent>
              </Card3D>
            </DialogTrigger>
            <DialogContent className="glass">
              <form onSubmit={handleCreateUnit}>
                <DialogHeader>
                  <DialogTitle>Criar Nova Unidade</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova unidade ao seu restaurante
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit-name">Nome da Unidade *</Label>
                    <Input
                      id="unit-name"
                      placeholder="Ex: Matriz Centro"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-address">Endereço</Label>
                    <Input
                      id="unit-address"
                      placeholder="Rua, número, bairro"
                      value={newUnitAddress}
                      onChange={(e) => setNewUnitAddress(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit-phone">Telefone</Label>
                      <Input
                        id="unit-phone"
                        placeholder="(00) 00000-0000"
                        value={newUnitPhone}
                        onChange={(e) => setNewUnitPhone(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-cnpj">CNPJ</Label>
                      <Input
                        id="unit-cnpj"
                        placeholder="00.000.000/0000-00"
                        value={newUnitCnpj}
                        onChange={(e) => setNewUnitCnpj(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating} className="gradient-primary">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Unidade"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {units.length === 0 && (
          <div className="text-center py-12 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma unidade encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira unidade para começar a usar o sistema
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
