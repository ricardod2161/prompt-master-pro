import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Pricing Preview */}
        <PricingPreview />

        {/* FAQ */}
        <FAQSection />

        {/* Final CTA */}
        <CTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
