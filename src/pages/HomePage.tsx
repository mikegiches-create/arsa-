import Header from '../components/sections/Header'
import Hero from '../components/sections/Hero'
import FeaturedProperties from '../components/sections/FeaturedProperties'
import WhyChooseUs from '../components/sections/WhyChooseUs'
import HowItWorks from '../components/sections/HowItWorks'
import FeaturedLocations from '../components/sections/FeaturedLocations'
import About from '../components/sections/About'
import Testimonials from '../components/sections/Testimonials'
import CTABanner from '../components/sections/CTABanner'
import FAQ from '../components/sections/FAQ'
import Newsletter from '../components/sections/Newsletter'
import Contact from '../components/sections/Contact'
import Footer from '../components/sections/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Header / Navigation */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Featured Properties */}
      <FeaturedProperties />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* CTA Banner */}
      <CTABanner />

      {/* About Section */}
      <About />

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Locations */}
      <FeaturedLocations />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Newsletter Subscription */}
      <Newsletter />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
    </div>
  )
}
