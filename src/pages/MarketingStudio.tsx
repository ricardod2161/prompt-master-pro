import { useState, useMemo, useEffect } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Megaphone, Tag, UtensilsCrossed, PartyPopper, Truck, CalendarHeart, Star,
  Square, RectangleHorizontal, Smartphone,
  Palette, Leaf, Crown, Sparkles, Monitor,
  Loader2, Download, Trash2, ImageIcon, Wand2, Coins, ShoppingCart, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { campaignTemplates } from "@/components/marketing/campaignTemplates";
import { PromptPreviewCard } from "@/components/marketing/PromptPreviewCard";
import { ExampleChips } from "@/components/marketing/ExampleChips";
import { useMarketingCredits } from "@/hooks/useMarketingCredits";

const campaignTypes = [
  { id: "promotion", label: "Promoção", icon: Tag, color: "text-red-500" },
  { id: "daily_menu", label: "Cardápio do Dia", icon: UtensilsCrossed, color: "text-orange-500" },
  { id: "inauguration", label: "Inauguração", icon: PartyPopper, color: "text-yellow-500" },
  { id: "delivery", label: "Delivery", icon: Truck, color: "text-blue-500" },
  { id: "event", label: "Evento Especial", icon: CalendarHeart, color: "text-purple-500" },
  { id: "holiday", label: "Feriado", icon: Star, color: "text-green-500" },
  { id: "system", label: "Sistema", icon: Monitor, color: "text-cyan-500" },
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

const styleMap: Record<string, string> = {
  modern: "Clean, modern, minimalist design with sleek typography, soft gradients, and contemporary layout",
  rustic: "Warm rustic artisanal style with wooden textures, handwritten fonts, earthy tones, and cozy atmosphere",
  premium: "Luxurious premium elegant style with gold accents, dark background, serif typography, and sophisticated lighting",
  vibrant: "Bold colorful vibrant style with bright saturated colors, dynamic composition, playful typography, and energetic mood",
};

const campaignMap: Record<string, string> = {
  promotion: "special promotional offer with discount emphasis",
  daily_menu: "daily menu or chef's special highlight",
  inauguration: "grand opening or inauguration celebration",
  delivery: "food delivery service advertisement",
  event: "special event or themed night",
  holiday: "seasonal holiday celebration",
  system: "restaurant management system or SaaS platform screenshot mockup, showing a modern tech interface with dashboard, charts, and clean UI elements",
};

const formatMap: Record<string, string> = {
  feed: "square 1:1 aspect ratio optimized for social media feed",
  cover: "wide 1200x630 landscape format for Facebook cover or link preview",
  story: "tall 9:16 portrait format for Instagram/Facebook stories",
};

function buildPromptPreview(
  campaignType: string, title: string, description: string,
  format: string, style: string, restaurantName: string, promptHint?: string
): string {
  const styleDesc = styleMap[style] || styleMap.modern;
  const campaignDesc = campaignMap[campaignType] || campaignType;
  const formatDesc = formatMap[format] || formatMap.feed;

  return `Create a professional, high-quality restaurant marketing image for a Facebook campaign.

Visual Style: ${styleDesc}
Campaign Type: ${campaignDesc}
Restaurant Name: "${restaurantName || 'Restaurante'}"
Headline: "${title}"
${description ? `Details: "${description}"` : ""}
Format: ${formatDesc}
${promptHint ? `\nCreative Direction: ${promptHint}` : ""}

Requirements:
- Professional food photography style with appetizing presentation
- Warm, inviting lighting that makes food look delicious
- Clean professional typography overlay with the headline text
- Cohesive color palette matching the chosen style
- High contrast and vibrant colors optimized for social media
- Modern layout with clear visual hierarchy

Do NOT include:
- Misspelled text or garbled characters
- Watermarks or logos
- Low quality or blurry elements
- Generic clip art style graphics`;
}

const CREDIT_PACKAGES = [
  { id: "credits_10", credits: 10, price: "R$ 14,90", priceNum: 14.90, perCredit: "R$ 1,49" },
  { id: "credits_30", credits: 30, price: "R$ 34,90", priceNum: 34.90, perCredit: "R$ 1,16", popular: true },
  { id: "credits_100", credits: 100, price: "R$ 89,90", priceNum: 89.90, perCredit: "R$ 0,90" },
];

export default function MarketingStudio() {
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { credits, isLoading: creditsLoading, invalidate: invalidateCredits } = useMarketingCredits();

  const [campaignType, setCampaignType] = useState("");
  const [format, setFormat] = useState("feed");
  const [style, setStyle] = useState("modern");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  // Handle credit purchase callback
  useEffect(() => {
    const creditsPurchased = searchParams.get("credits_purchased");
    const unitId = searchParams.get("unit_id");
    if (creditsPurchased && unitId && selectedUnit?.id === unitId) {
      // Add credits via RPC
      supabase.rpc("add_marketing_credits", {
        _unit_id: unitId,
        _user_id: user?.id || "",
        _amount: parseInt(creditsPurchased),
        _description: `Compra de ${creditsPurchased} créditos`,
      }).then(() => {
        invalidateCredits();
        toast.success(`${creditsPurchased} créditos adicionados com sucesso!`);
      });
      // Clean URL
      searchParams.delete("credits_purchased");
      searchParams.delete("unit_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, selectedUnit?.id, user?.id]);

  const currentTemplates = campaignType ? (campaignTemplates[campaignType] || []) : [];

  const promptPreview = useMemo(() => {
    if (!campaignType || !title) return "";
    const hint = selectedTemplateIndex !== null ? currentTemplates[selectedTemplateIndex]?.promptHint : undefined;
    return buildPromptPreview(campaignType, title, description, format, style, selectedUnit?.name || "", hint);
  }, [campaignType, title, description, format, style, selectedUnit?.name, selectedTemplateIndex, currentTemplates]);

  const handleCampaignSelect = (id: string) => {
    setCampaignType(id);
    setSelectedTemplateIndex(null);
    const templates = campaignTemplates[id];
    if (templates?.length) {
      setTitle(templates[0].title);
      setDescription(templates[0].description);
      setSelectedTemplateIndex(0);
    } else {
      setTitle("");
      setDescription("");
    }
    setCustomPrompt("");
  };

  const handleTemplateSelect = (index: number) => {
    const t = currentTemplates[index];
    if (t) {
      setTitle(t.title);
      setDescription(t.description);
      setSelectedTemplateIndex(index);
      setCustomPrompt("");
    }
  };

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

    if (credits.available <= 0) {
      setPurchaseModalOpen(true);
      return;
    }

    setGenerating(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: {
          unitId: selectedUnit.id,
          campaignType, title, description, format, style,
          restaurantName: selectedUnit.name,
          customPrompt: customPrompt || undefined,
          promptHint: selectedTemplateIndex !== null ? currentTemplates[selectedTemplateIndex]?.promptHint : undefined,
        },
      });

      if (error) throw error;
      if (data?.code === "NO_CREDITS") {
        setPurchaseModalOpen(true);
        return;
      }
      if (data?.error) throw new Error(data.error);

      setPreviewUrl(data.imageUrl);
      invalidateCredits();
      await queryClient.refetchQueries({ queryKey: ["marketing-images", selectedUnit?.id] });
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

  const handlePurchase = async (packageId: string) => {
    if (!selectedUnit?.id) return;
    setPurchasingPackage(packageId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { packageId, unitId: selectedUnit.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar compra");
    } finally {
      setPurchasingPackage(null);
    }
  };

  const creditPercent = credits.available > 0
    ? Math.round((credits.available / (credits.total_credits + credits.bonus_credits || 3)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Marketing Studio"
          description="Gere imagens profissionais para suas campanhas no Facebook com IA"
        />
        {/* Credits Badge */}
        <Card className="px-4 py-3 flex items-center gap-3 border-primary/20">
          <Coins className="w-5 h-5 text-primary" />
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Créditos</span>
              <span className="text-sm font-bold">
                {creditsLoading ? "..." : credits.available}
              </span>
            </div>
            <Progress value={creditPercent} className="h-1.5" />
          </div>
          {credits.available <= 0 && (
            <Button size="sm" variant="default" onClick={() => setPurchaseModalOpen(true)}>
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Comprar
            </Button>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {campaignTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => handleCampaignSelect(ct.id)}
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

          {/* Title & Description with Examples */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conteúdo</CardTitle>
              {campaignType && <CardDescription>Escolha um exemplo ou personalize</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTemplates.length > 0 && (
                <ExampleChips
                  templates={currentTemplates}
                  selectedIndex={selectedTemplateIndex}
                  onSelect={handleTemplateSelect}
                />
              )}
              <div>
                <Label>Título da Campanha *</Label>
                <Input
                  placeholder='Ex: "Feijoada Completa - R$29,90"'
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setSelectedTemplateIndex(null); }}
                />
              </div>
              <div>
                <Label>Descrição / Detalhes</Label>
                <Textarea
                  placeholder='Ex: "Todos os sábados, das 11h às 15h."'
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setSelectedTemplateIndex(null); }}
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

          {/* Prompt Preview */}
          {promptPreview && (
            <PromptPreviewCard
              prompt={promptPreview}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
            />
          )}

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
            ) : credits.available <= 0 ? (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Comprar Créditos para Gerar
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Gerar Imagem ({credits.available} crédito{credits.available !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview & Gallery */}
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
                  <img src={previewUrl} alt="Imagem de marketing gerada" className="w-full rounded-lg border shadow-sm" />
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
                  <p className="text-sm text-center">Configure sua campanha e clique em "Gerar Imagem"</p>
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

      {/* Purchase Credits Modal */}
      <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Comprar Créditos
            </DialogTitle>
            <DialogDescription>
              Cada crédito gera 1 imagem profissional com IA. Escolha seu pacote:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasingPackage !== null}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                  pkg.popular
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    pkg.popular ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Zap className={cn("w-5 h-5", pkg.popular ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pkg.credits} créditos</span>
                      {pkg.popular && <Badge variant="default" className="text-[10px]">Popular</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{pkg.perCredit}/crédito</span>
                  </div>
                </div>
                <div className="text-right">
                  {purchasingPackage === pkg.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <span className="font-bold text-lg">{pkg.price}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Pagamento seguro via Stripe. Créditos adicionados imediatamente após confirmação.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
