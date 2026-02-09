import { useState } from "react";
import { Sparkles, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIPromptGeneratorProps {
  unitName: string;
  unitId: string;
  onPromptSaved?: (prompt: string) => void;
  /** If provided, the prompt will also update parent state */
  externalPrompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export function AIPromptGenerator({
  unitName,
  unitId,
  onPromptSaved,
  externalPrompt,
  onPromptChange,
}: AIPromptGeneratorProps) {
  const { toast } = useToast();
  const [restaurantName, setRestaurantName] = useState(unitName);
  const [businessDescription, setBusinessDescription] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState(externalPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const prompt = externalPrompt !== undefined ? externalPrompt : generatedPrompt;

  const handleGenerate = async () => {
    if (!businessDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Descrição necessária",
        description: "Descreva seu negócio para gerar o prompt.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: {
          businessDescription: businessDescription.trim(),
          restaurantName: restaurantName.trim(),
        },
      });

      if (error) throw error;

      if (data?.prompt) {
        if (onPromptChange) {
          onPromptChange(data.prompt);
        } else {
          setGeneratedPrompt(data.prompt);
        }
        toast({
          title: "Prompt gerado com sucesso!",
          description: "Revise o prompt e salve quando estiver pronto.",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar prompt",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt vazio",
        description: "Gere ou escreva um prompt antes de salvar.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("whatsapp_settings")
        .upsert(
          { unit_id: unitId, system_prompt: prompt.trim() },
          { onConflict: "unit_id" }
        );

      if (error) throw error;

      toast({
        title: "Prompt salvo!",
        description: "O prompt do bot foi atualizado com sucesso.",
      });
      onPromptSaved?.(prompt.trim());
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptEdit = (value: string) => {
    if (onPromptChange) {
      onPromptChange(value);
    } else {
      setGeneratedPrompt(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Section */}
      <div className="space-y-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Gerador de Prompt com IA</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha o nome do restaurante e descreva seu negócio. A IA criará um prompt profissional para o bot de atendimento.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="restaurant-name" className="text-sm font-medium">
              Nome do Restaurante
            </Label>
            <Input
              id="restaurant-name"
              placeholder="Ex: Pizzaria do João"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="business-desc" className="text-sm font-medium">
              Descreva seu negócio
            </Label>
            <Input
              id="business-desc"
              placeholder="Ex: Pizzaria delivery com massa artesanal e forno a lenha"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="h-11"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !businessDescription.trim()}
            variant="outline"
            className="w-full sm:w-auto h-11 border-primary/30 hover:bg-primary/10"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "Gerando..." : "Gerar Prompt com IA"}
          </Button>
        </div>
      </div>

      {/* Generated Prompt */}
      <div className="space-y-3">
        <Label htmlFor="generated-prompt" className="text-sm font-medium">
          Prompt do Sistema (editável)
        </Label>
        <Textarea
          id="generated-prompt"
          placeholder="O prompt gerado pela IA aparecerá aqui. Você também pode escrever ou editar manualmente."
          value={prompt}
          onChange={(e) => handlePromptEdit(e.target.value)}
          rows={10}
          className="font-mono text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Instruções para a IA sobre como responder aos clientes. Você pode editar livremente após gerar.
        </p>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !prompt.trim()}
        className="h-11 bg-green-600 hover:bg-green-700"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar Prompt
      </Button>
    </div>
  );
}
