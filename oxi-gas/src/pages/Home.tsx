import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { Hero } from '@/components/sections/Hero';
import { StatsBar } from '@/components/sections/StatsBar';
import { CatalogPreview } from '@/components/sections/CatalogPreview';
import { Services } from '@/components/sections/Services';
import { CompressedGases } from '@/components/sections/CompressedGases';
import { FeaturedMachines } from '@/components/sections/FeaturedMachines';
import { SafetyGear } from '@/components/sections/SafetyGear';
import { Brands } from '@/components/sections/Brands';
import { TechnicalConsulting } from '@/components/sections/TechnicalConsulting';
import { Hours } from '@/components/sections/Hours';
import { QuoteForm } from '@/components/features/QuoteForm';
import { useTheme } from '@/hooks/useTheme';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-background relative">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Hero />
      <StatsBar />
      <CatalogPreview />
      <Services />
      <CompressedGases />
      <FeaturedMachines />
      <SafetyGear />
      <Brands />
      <TechnicalConsulting />
      <Hours />
      <QuoteForm />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
