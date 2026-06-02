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
import { SafetyGear } from '@/components/sections/SafetyGear';
import { Brands } from '@/components/sections/Brands';
import { Testimonios } from '@/components/sections/Testimonios';
import { TechnicalConsulting } from '@/components/sections/TechnicalConsulting';
import { Hours } from '@/components/sections/Hours';
import { QuoteForm } from '@/components/features/QuoteForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <Header />
      <Hero />
      <StatsBar />
      <CatalogPreview />
      <Services />
      <CompressedGases />
      <FeaturedMachines />
      <FeaturedOffers />
      <SafetyGear />
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