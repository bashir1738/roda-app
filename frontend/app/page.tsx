import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { MarqueeTicker } from "../components/MarqueeTicker";
import { Stats } from "../components/Stats";
import { CirclesShowcase } from "../components/CirclesShowcase";
import { CommunityCoordination } from "../components/CommunityCoordination";
import { DemoSection } from "../components/DemoSection";
import { Features } from "../components/Features";
import { VaultTiers } from "../components/VaultTiers";
import { HowItWorks } from "../components/HowItWorks";
import { Security } from "../components/Security";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-surface-sand">
        <Hero />
        <MarqueeTicker />
        <Stats />
        <CirclesShowcase />
        <CommunityCoordination />
        <DemoSection />
        <Features />
        <VaultTiers />
        <HowItWorks />
        <Security />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
