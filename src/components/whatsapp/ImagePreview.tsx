import { useState } from "react";
import { X, ZoomIn, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src: string;
  caption?: string;
  className?: string;
}

export function ImagePreview({ src, caption, className }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whatsapp-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <div 
          className="relative cursor-pointer group rounded-lg overflow-hidden max-w-[280px]"
          onClick={() => setIsOpen(true)}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={src}
            alt={caption || "Imagem"}
            className="w-full h-auto max-h-[300px] object-cover rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="h-8 w-8 text-white" />
          </div>
        </div>
        {caption && (
          <p className="text-sm text-muted-foreground">{caption}</p>
        )}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <img
            src={src}
            alt={caption || "Imagem"}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {caption && (
            <p className="absolute bottom-4 left-4 right-4 text-center text-white text-sm">
              {caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
