import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { SECTION_NAVIGATION_EVENT, scrollToHomeSection } from '@/lib/sectionNavigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { Hero } from '@/components/sections/Hero';
import { StatsBar } from '@/components/sections/StatsBar';
import { CatalogPreview } from '@/components/sections/CatalogPreview';
import { Services } from '@/components/sections/Services';
import { CompressedGases } from '@/components/sections/CompressedGases';
import { FeaturedMachines } from '@/components/sections/FeaturedMachines';
import { FeaturedOffers } from '@/components/sections/FeaturedOffers';
import { Brands } from '@/components/sections/Brands';
import { Testimonios } from '@/components/sections/Testimonios';
import { TechnicalConsulting } from '@/components/sections/TechnicalConsulting';
import { Hours } from '@/components/sections/Hours';
import { QuoteForm } from '@/components/features/QuoteForm';

export default function Home() {
  const [location] = useLocation();
  useEffect(() => {
    let cancelScroll = () => {};
    const navigate = (id: string) => {
      cancelScroll();
      cancelScroll = scrollToHomeSection(id);
    };
    const scroll = () => {
      try { navigate(decodeURIComponent(window.location.hash.slice(1))); } catch { /* Ignore malformed anchors. */ }
    };
    const onSection = (event: Event) => navigate((event as CustomEvent<string>).detail);
    scroll();
    window.addEventListener('hashchange', scroll);
    window.addEventListener(SECTION_NAVIGATION_EVENT, onSection);
    return () => {
      cancelScroll();
      window.removeEventListener('hashchange', scroll);
      window.removeEventListener(SECTION_NAVIGATION_EVENT, onSection);
    };
  }, [location]);
  return (
    <main className="min-h-screen bg-background relative">
      <Header />
      <Hero />
      <Services />
      <StatsBar />
      <FeaturedOffers />
      <CatalogPreview />
      <CompressedGases />
      <FeaturedMachines />
      <Brands />
      <Testimonios />
      <TechnicalConsulting />
      <Hours />
      <QuoteForm />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
