import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  route?: boolean;
};

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  produto: [
    { label: "Recursos", href: "#features" },
    { label: "Preços", href: "#pricing" },
    { label: "Nossa Loja", href: "https://restauranteos-11roq.myshopify.com", external: true },
    { label: "Roadmap", href: "#" },
  ],
  empresa: [
    { label: "Sobre Nós", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Parceiros", href: "#" },
  ],
  suporte: [
    { label: "Central de Ajuda", href: "#faq" },
    { label: "Documentação", href: "#how-it-works" },
    { label: "Status do Sistema", href: "#" },
    { label: "Contato", href: "#contact" },
  ],
  legal: [
    { label: "Privacidade", href: "/privacy", route: true },
    { label: "Termos de Uso", href: "/terms", route: true },
    { label: "Cookies", href: "/privacy", route: true },
    { label: "LGPD", href: "/privacy", route: true },
  ],
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const scrollToSection = (href: string) => {
    if (href.startsWith("#") && href.length > 1) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {link.label}
      </a>
    );
  }

  if (link.route) {
    return (
      <Link
        to={link.href}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {link.label}
      </Link>
    );
  }

  if (link.href === "#") {
    return (
      <span className="text-sm text-muted-foreground/40 cursor-default flex items-center gap-1.5">
        {link.label}
        <span className="text-[10px] bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded-full leading-none">
          Em breve
        </span>
      </span>
    );
  }

  return (
    <button
      onClick={() => scrollToSection(link.href)}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {link.label}
    </button>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="mb-4 inline-block">
              <Logo size="sm" />
            </Link>

            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Sistema completo de gestão para restaurantes. Simplifique suas operações 
              e aumente seus lucros com tecnologia inteligente.
            </p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>ricardodelima1988@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>(98) 98254-9505</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Alexandria, RN - Brasil</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {(["produto", "empresa", "suporte", "legal"] as const).map((section) => (
            <div key={section}>
              <h4 className="font-semibold mb-4 capitalize">
                {section === "produto" ? "Produto" : section === "empresa" ? "Empresa" : section === "suporte" ? "Suporte" : "Legal"}
              </h4>
              <ul className="space-y-2">
                {FOOTER_LINKS[section].map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RestaurantOS. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => {
              const isDisabled = social.href === "#";
              return isDisabled ? (
                <span
                  key={social.label}
                  className="p-2 rounded-lg text-muted-foreground/40 cursor-default"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </span>
              ) : (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
