import { useState, useEffect } from "react";
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Share2, 
  MoreVertical, 
  Plus,
  Check,
  ArrowLeft,
  Apple,
  Chrome
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>App Instalado!</CardTitle>
            <CardDescription>
              O RestaurantOS já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard">Abrir Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="text-center mb-12">
          <img 
            src="/pwa-512x512.png" 
            alt="RestaurantOS" 
            className="h-24 w-24 mx-auto mb-6 rounded-2xl shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-4">Instale o RestaurantOS</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso rápido ao sistema direto da tela inicial do seu dispositivo. 
            Funciona offline e abre em tela cheia.
          </p>
        </div>

        {/* Quick Install Button */}
        {deferredPrompt && (
          <Card className="mb-8 border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Instalação Rápida</h3>
                    <p className="text-sm text-muted-foreground">Clique para instalar agora</p>
                  </div>
                </div>
                <Button onClick={handleInstall} size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Instalar App
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform-specific instructions */}
        <Tabs defaultValue={isIOS ? "ios" : isAndroid ? "android" : "desktop"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="android" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Android
            </TabsTrigger>
            <TabsTrigger value="ios" className="flex items-center gap-2">
              <Apple className="h-4 w-4" />
              iPhone/iPad
            </TabsTrigger>
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </TabsTrigger>
          </TabsList>

          <TabsContent value="android" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="h-5 w-5" />
                  Instalação no Android (Chrome)
                </CardTitle>
                <CardDescription>
                  Siga os passos abaixo para instalar o app no seu celular Android
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Abra o menu do Chrome</h4>
                    <p className="text-sm text-muted-foreground">
                      Toque nos três pontos <MoreVertical className="inline h-4 w-4" /> no canto superior direito
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Selecione "Instalar app"</h4>
                    <p className="text-sm text-muted-foreground">
                      Ou "Adicionar à tela inicial" em versões mais antigas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Confirme a instalação</h4>
                    <p className="text-sm text-muted-foreground">
                      Toque em "Instalar" na janela de confirmação
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Pronto!</h4>
                    <p className="text-sm text-muted-foreground">
                      O ícone do RestaurantOS aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Instalação no iPhone/iPad (Safari)
                </CardTitle>
                <CardDescription>
                  Use o Safari para instalar o app. Outros navegadores não suportam esta função.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Abra no Safari</h4>
                    <p className="text-sm text-muted-foreground">
                      Certifique-se de estar usando o navegador Safari
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Toque no botão de Compartilhar</h4>
                    <p className="text-sm text-muted-foreground">
                      Toque no ícone <Share2 className="inline h-4 w-4" /> na barra inferior
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Selecione "Adicionar à Tela de Início"</h4>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo até encontrar a opção com o ícone <Plus className="inline h-4 w-4" />
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Confirme tocando em "Adicionar"</h4>
                    <p className="text-sm text-muted-foreground">
                      O app será adicionado à sua tela inicial
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="desktop" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Instalação no Desktop (Chrome/Edge)
                </CardTitle>
                <CardDescription>
                  Instale como um app de desktop para acesso rápido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Procure o ícone de instalação</h4>
                    <p className="text-sm text-muted-foreground">
                      Na barra de endereços, clique no ícone <Download className="inline h-4 w-4" /> ou <Plus className="inline h-4 w-4" />
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Ou use o menu do navegador</h4>
                    <p className="text-sm text-muted-foreground">
                      Menu → Mais ferramentas → Criar atalho (ou "Instalar app")
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Confirme a instalação</h4>
                    <p className="text-sm text-muted-foreground">
                      Marque "Abrir como janela" e clique em "Criar" ou "Instalar"
                    </p>
                  </div>
                </div>

                {deferredPrompt && (
                  <Button onClick={handleInstall} className="w-full mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Instalar Agora
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Abra direto da tela inicial sem precisar digitar URL
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📴 Funciona Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acesse recursos básicos mesmo sem conexão com internet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📱 Tela Cheia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Experiência imersiva sem barras do navegador
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
