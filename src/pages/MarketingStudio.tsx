import { useState } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, Tag, UtensilsCrossed, PartyPopper, Truck, CalendarHeart, Star,
  Square, RectangleHorizontal, Smartphone,
  Palette, Leaf, Crown, Sparkles,
  Loader2, Download, Trash2, ImageIcon, Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

const campaignTypes = [
  { id: "promotion", label: "Promoção", icon: Tag, color: "text-red-500" },
  { id: "daily_menu", label: "Cardápio do Dia", icon: UtensilsCrossed, color: "text-orange-500" },
  { id: "inauguration", label: "Inauguração", icon: PartyPopper, color: "text-yellow-500" },
  { id: "delivery", label: "Delivery", icon: Truck, color: "text-blue-500" },
  { id: "event", label: "Evento Especial", icon: CalendarHeart, color: "text-purple-500" },
  { id: "holiday", label: "Feriado", icon: Star, color: "text-green-500" },
];

const formats = [
  { id: "feed", label: "Feed (1080×1080)", icon: Square, desc: "Post quadrado" },
  { id: "cover", label: "Capa (1200×630)", icon: RectangleHorizontal, desc: "Facebook Cover" },
  { id: "story", label: "Story (1080×1920)", icon: Smartphone, desc: "Stories" },
];

const styles = [
  { id: "modern", label: "Moderno", icon: Sparkles, desc: "Clean e minimalista" },
  { id: "rustic", label: "Rústico", icon: Leaf, desc: "Artesanal e acolhedor" },
  { id: "premium", label: "Premium", icon: Crown, desc: "Elegante e sofisticado" },
  { id: "vibrant", label: "Vibrante", icon: Palette, desc: "Colorido e dinâmico" },
];

export default function MarketingStudio() {
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [campaignType, setCampaignType] = useState("");
  const [format, setFormat] = useState("feed");
  const [style, setStyle] = useState("modern");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ["marketing-images", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];
      const { data, error } = await supabase
        .from("marketing_images")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnit?.id,
  });

  const handleGenerate = async () => {
    if (!selectedUnit?.id || !campaignType || !title) {
      toast.error("Preencha o tipo de campanha e o título");
      return;
    }

    setGenerating(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: {
          unitId: selectedUnit.id,
          campaignType,
          title,
          description,
          format,
          style,
          restaurantName: selectedUnit.name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPreviewUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["marketing-images"] });
      toast.success("Imagem gerada com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar imagem");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketing_images").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir imagem");
    } else {
      queryClient.invalidateQueries({ queryKey: ["marketing-images"] });
      toast.success("Imagem excluída");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Studio"
        description="Gere imagens profissionais para suas campanhas no Facebook"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {campaignTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setCampaignType(ct.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      campaignType === ct.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <ct.icon className={cn("w-6 h-6", ct.color)} />
                    <span className="text-sm font-medium">{ct.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Title & Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título da Campanha *</Label>
                <Input
                  placeholder='Ex: "Feijoada Completa - R$29,90"'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Descrição / Detalhes</Label>
                <Textarea
                  placeholder='Ex: "Todos os sábados, das 11h às 15h. Acompanha farofa, couve e laranja."'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Format & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Formato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left",
                      format === f.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <f.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estilo Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left",
                      style === s.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <s.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={generating || !campaignType || !title}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando imagem...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Gerar Imagem
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Resultado da imagem gerada</CardDescription>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground text-center">
                    Gerando sua imagem profissional...<br />
                    Isso pode levar 10-20 segundos.
                  </p>
                </div>
              ) : previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Imagem de marketing gerada"
                    className="w-full rounded-lg border shadow-sm"
                  />
                  <a href={previewUrl} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Imagem
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 opacity-30" />
                  <p className="text-sm text-center">
                    Configure sua campanha e clique em "Gerar Imagem"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Galeria</CardTitle>
              <CardDescription>Imagens geradas anteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              {galleryLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : gallery && gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {gallery.map((img: any) => (
                    <div key={img.id} className="group relative">
                      <img
                        src={img.image_url}
                        alt={img.title || "Marketing image"}
                        className="aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewUrl(img.image_url)}
                      />
                      <div className="absolute top-1 left-1">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {img.campaign_type}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 text-destructive-foreground rounded-full p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma imagem gerada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
