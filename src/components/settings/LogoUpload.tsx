import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, ImageIcon, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  unitId: string;
  currentLogoUrl?: string | null;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ unitId, currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validar tipo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WebP ou SVG.");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único
      const fileExt = file.name.split(".").pop();
      const fileName = `${unitId}/logo-${Date.now()}.${fileExt}`;

      // Remover logo anterior se existir
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/unit-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("unit-logos").remove([oldPath]);
        }
      }

      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from("unit-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("unit-logos")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Atualizar na tabela units
      const { error: updateError } = await supabase
        .from("units")
        .update({ logo_url: publicUrl })
        .eq("id", unitId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onLogoChange(publicUrl);
      toast.success("Logo atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    setIsUploading(true);
    try {
      // Remover do storage
      const oldPath = currentLogoUrl.split("/unit-logos/")[1];
      if (oldPath) {
        await supabase.storage.from("unit-logos").remove([oldPath]);
      }

      // Atualizar na tabela units
      const { error } = await supabase
        .from("units")
        .update({ logo_url: null })
        .eq("id", unitId);

      if (error) throw error;

      setPreviewUrl(null);
      onLogoChange(null);
      toast.success("Logo removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover logo:", error);
      toast.error("Erro ao remover logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        Logo da Unidade
      </Label>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Preview */}
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-border/50 shadow-lg transition-transform group-hover:scale-105">
            <AvatarImage src={previewUrl || undefined} alt="Logo" className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          
          {previewUrl && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Upload area */}
        <div className="flex-1 w-full">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragging && "border-primary bg-primary/10 scale-[1.02]",
              isUploading && "pointer-events-none opacity-60"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP ou SVG • Máximo 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Selecionar arquivo
            </Button>
            {previewUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
