import { LandingPage } from "@/components/landing/Landing";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/pages/hero-section";
import FeaturesSection from "@/components/pages/features-section";
import TestimonialsSection from "@/components/pages/testimonials-section";
import CtaSection from "@/components/pages/cta-section";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
