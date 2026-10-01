import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ServicesBento from "@/components/ServicesBento";
import Calculator from "@/components/Calculator";
import HowItWorks from "@/components/HowItWorks";
import BookingWizard from "@/components/BookingWizard";
import Footer from "@/components/Footer";

export default function Home() {
  const [preset, setPreset] = useState(null);

  const goBook = (category) => {
    setPreset({ category: category || null, ts: Date.now() });
    setTimeout(() => {
      if (window.__lenis) window.__lenis.scrollTo("#agendar");
      else document.getElementById("agendar")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <main className="min-h-screen bg-obsidian text-slate-100">
      <Navbar />
      <Hero onBook={goBook} />
      <Marquee />
      <ServicesBento onBook={goBook} />
      <Calculator onBook={goBook} />
      <HowItWorks />
      <BookingWizard preset={preset} />
      <Footer />
    </main>
  );
}
