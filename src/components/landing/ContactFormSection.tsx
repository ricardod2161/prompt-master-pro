import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPixelEvent } from "@/hooks/usePixelTracking";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  phone: z.string().optional(),
  restaurant_name: z.string().max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  employee_count: z.string().optional(),
  message: z.string().max(1000, "Mensagem deve ter no máximo 1000 caracteres").optional(),
});

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  restaurant_name: string;
  employee_count: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  restaurant_name?: string;
  message?: string;
}

function ContactInfo() {
  return (
    <div className="md:col-span-2 space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6">
        <h3 className="font-semibold text-lg mb-6">Informações de Contato</h3>

        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Email</p>
              <a
                href="mailto:contato@restaurantos.com.br"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                contato@restaurantos.com.br
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">WhatsApp</p>
              <a
                href="https://wa.me/5598982549505"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                (98) 98254-9505
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Localização</p>
              <p className="text-sm text-muted-foreground">
                São Luís, Maranhão - Brasil
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Horário</p>
              <p className="text-sm text-muted-foreground">
                Segunda a Sexta, 9h às 18h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactFormSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    restaurant_name: "",
    employee_count: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert({
        name: result.data.name,
        email: result.data.email,
        phone: formData.phone || null,
        restaurant_name: formData.restaurant_name || null,
        employee_count: formData.employee_count || null,
        message: formData.message || null,
        source: "landing_page",
      });

      if (error) throw error;

      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        restaurant_name: "",
        employee_count: "",
        message: "",
      });

      trackPixelEvent("Lead", { content_name: "contact_form", content_category: "landing_page" });
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    if (field === "phone") {
      value = formatPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (isSuccess) setIsSuccess(false);
  };

  return (
    <section id="contact" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Entre em{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Contato
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas ou solicite uma demonstração personalizada do sistema.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
            <ContactInfo />

            {/* Contact Form */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6 md:p-8">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Mensagem Enviada!</h3>
                    <p className="text-muted-foreground mb-6">
                      Recebemos sua mensagem e entraremos em contato em breve.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsSuccess(false)}
                    >
                      Enviar outra mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          placeholder="Seu nome"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          maxLength={100}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          maxLength={255}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp</Label>
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          inputMode="numeric"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="restaurant">Nome do restaurante</Label>
                        <Input
                          id="restaurant"
                          placeholder="Nome do seu negócio"
                          value={formData.restaurant_name}
                          onChange={(e) => handleChange("restaurant_name", e.target.value)}
                          maxLength={100}
                          className={errors.restaurant_name ? "border-destructive" : ""}
                        />
                        {errors.restaurant_name && (
                          <p className="text-sm text-destructive">{errors.restaurant_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employees">Número de funcionários</Label>
                      <Select
                        value={formData.employee_count}
                        onValueChange={(value) => handleChange("employee_count", value)}
                      >
                        <SelectTrigger id="employees">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1 a 5 funcionários</SelectItem>
                          <SelectItem value="6-15">6 a 15 funcionários</SelectItem>
                          <SelectItem value="16-30">16 a 30 funcionários</SelectItem>
                          <SelectItem value="30+">Mais de 30 funcionários</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        placeholder="Como podemos ajudar?"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        maxLength={1000}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
