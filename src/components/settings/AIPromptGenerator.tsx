import { useState, useCallback, useMemo, useEffect } from "react";
import { Sparkles, Loader2, Save, RotateCcw, ChevronDown, Store, Clock, Smile, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { defaultFormData, mapUnitSettingsToPromptFormData, type PromptFormData } from "./ai-prompt/types";
import { useUnitSettings } from "@/hooks/useUnitSettings";
import { BasicSection } from "./ai-prompt/BasicSection";
import { OperationalSection } from "./ai-prompt/OperationalSection";
import { PersonalitySection } from "./ai-prompt/PersonalitySection";
import { SpecialRulesSection } from "./ai-prompt/SpecialRulesSection";

interface AIPromptGeneratorProps {
  unitName: string;
  unitId: string;
  onPromptSaved?: (prompt: string) => void;
  externalPrompt?: string;
  onPromptChange?: (prompt: string) => void;
}

const SECTIONS = [
  { id: "basic", label: "Informações Básicas", icon: Store, required: true },
  { id: "operational", label: "Operacional", icon: Clock },
  { id: "personality", label: "Personalidade", icon: Smile },
  { id: "rules", label: "Regras Especiais", icon: AlertTriangle },
] as const;

export function AIPromptGenerator({
  unitName,
  unitId,
  onPromptSaved,
  externalPrompt,
  onPromptChange,
}: AIPromptGeneratorProps) {
  const { toast } = useToast();
  const { settings, isLoading: isLoadingSettings } = useUnitSettings();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>({
    ...defaultFormData,
    restaurantName: unitName,
  });
  const [generatedPrompt, setGeneratedPrompt] = useState(externalPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    operational: false,
    personality: false,
    rules: false,
  });

  // Auto-prefill form with unit_settings data
  useEffect(() => {
    if (!dataLoaded && settings && !isLoadingSettings) {
      const mapped = mapUnitSettingsToPromptFormData(settings);
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(mapped).filter(([, v]) => v !== undefined)
        ),
      }));
      setDataLoaded(true);
    }
  }, [settings, isLoadingSettings, dataLoaded]);

  const prompt = externalPrompt !== undefined ? externalPrompt : generatedPrompt;

  const updateForm = useCallback((updates: Partial<PromptFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filledCount = useMemo(() => {
    let count = 0;
    if (formData.restaurantName.trim()) count++;
    if (formData.businessType) count++;
    if (formData.businessDescription.trim()) count++;
    if (formData.operatingDays.length > 0) count++;
    if (formData.paymentMethods.length > 0) count++;
    if (formData.avgPrepTime.trim()) count++;
    if (formData.botName.trim()) count++;
    if (formData.specialRules.trim()) count++;
    return count;
  }, [formData]);

  const canGenerate = formData.restaurantName.trim() && formData.businessDescription.trim();

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha o nome e a descrição do negócio." });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: {
          restaurantName: formData.restaurantName.trim(),
          businessType: formData.businessType,
          businessDescription: formData.businessDescription.trim(),
          operatingDays: formData.operatingDays,
          operatingHours: formData.operatingHours,
          paymentMethods: formData.paymentMethods,
          pixKey: formData.pixKey.trim(),
          hasDelivery: formData.hasDelivery,
          deliveryFee: parseFloat(formData.deliveryFee) || 0,
          hasPickup: formData.hasPickup,
          avgPrepTime: formData.avgPrepTime.trim(),
          voiceTone: formData.voiceTone,
          emojiLevel: formData.emojiLevel,
          botName: formData.botName.trim(),
          specialRules: formData.specialRules.trim(),
        },
      });
      if (error) throw error;
      if (data?.prompt) {
        if (onPromptChange) onPromptChange(data.prompt);
        else setGeneratedPrompt(data.prompt);
        toast({ title: "Prompt gerado com sucesso!", description: `${data.prompt.length} caracteres — revise e salve.` });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao gerar prompt", description: error.message || "Tente novamente." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast({ variant: "destructive", title: "Prompt vazio", description: "Gere ou escreva um prompt antes de salvar." });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("whatsapp_settings")
        .upsert({ unit_id: unitId, system_prompt: prompt.trim() }, { onConflict: "unit_id" });
      if (error) throw error;
      toast({ title: "Prompt salvo!", description: "O prompt do bot foi atualizado." });
      onPromptSaved?.(prompt.trim());
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message || "Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptEdit = (value: string) => {
    if (onPromptChange) onPromptChange(value);
    else setGeneratedPrompt(value);
  };

  const handleReset = () => {
    const mapped = settings ? mapUnitSettingsToPromptFormData(settings) : {};
    setFormData({
      ...defaultFormData,
      restaurantName: unitName,
      ...Object.fromEntries(
        Object.entries(mapped).filter(([, v]) => v !== undefined)
      ),
    });
    if (onPromptChange) onPromptChange("");
    else setGeneratedPrompt("");
  };

  const renderSection = (id: string) => {
    switch (id) {
      case "basic": return <BasicSection data={formData} onChange={updateForm} />;
      case "operational": return <OperationalSection data={formData} onChange={updateForm} />;
      case "personality": return <PersonalitySection data={formData} onChange={updateForm} />;
      case "rules": return <SpecialRulesSection data={formData} onChange={updateForm} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Gerador de Prompt com IA</Label>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {filledCount}/8 campos
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo para gerar um prompt ultra-detalhado e profissional para o bot WhatsApp.
        </p>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections[section.id];
          return (
            <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                    isOpen
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/20 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{section.label}</span>
                    {"required" in section && section.required && (
                      <span className="text-[10px] uppercase tracking-wider text-primary font-bold">obrigatório</span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pb-1 px-1">
                {renderSection(section.id)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="h-11 flex-1 sm:flex-none"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {isGenerating ? "Gerando..." : "Gerar Prompt com IA"}
        </Button>
        <Button variant="outline" onClick={handleReset} className="h-11" type="button">
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>

      {/* Generated Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="generated-prompt" className="text-sm font-medium">
            Prompt do Sistema (editável)
          </Label>
          {prompt && (
            <span className="text-xs text-muted-foreground">{prompt.length} caracteres</span>
          )}
        </div>
        <Textarea
          id="generated-prompt"
          placeholder="O prompt gerado pela IA aparecerá aqui. Você também pode escrever ou editar manualmente."
          value={prompt}
          onChange={(e) => handlePromptEdit(e.target.value)}
          rows={18}
          className="font-mono text-sm resize-y"
        />
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={isSaving || !prompt.trim()} className="h-11 bg-green-600 hover:bg-green-700">
        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Prompt
      </Button>
    </div>
  );
}
