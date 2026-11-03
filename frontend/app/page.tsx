import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { MarqueeTicker } from "../components/MarqueeTicker";
import { Stats } from "../components/Stats";
import { CirclesShowcase } from "../components/CirclesShowcase";
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
      <main className="bg-white">
        <Hero />
        <MarqueeTicker />
        <Stats />
        <CirclesShowcase />
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
