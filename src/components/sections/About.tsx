import { imgFallback } from '../../utils/imgFallback'
import heroImg   from '../../assets/DG-West-Sitting.webp'
import heroImg2  from '../../assets/img-scaled.jpg'

export default function About() {
  return (
    <section id="about" className="py-24 px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center bg-[#f8faf9]">
      {/* Image Section */}
      <div className="relative">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 rounded-xl">
          <img
            src={heroImg}
            alt="Grand luxury villa interior"
            className="w-full h-full object-cover"
            onError={imgFallback}
            loading="lazy"
          />
        </div>
        <div className="absolute -bottom-8 -right-8 w-48 h-48 hidden md:block overflow-hidden rounded-xl border-4 border-[#f8faf9] shadow-lg">
          <img
            src={heroImg2}
            alt="Luxury estate exterior"
            className="w-full h-full object-cover"
            onError={imgFallback}
            loading="lazy"
          />
        </div>
        <div className="absolute -top-8 -left-8 w-32 h-32 border-t-2 border-l-2 border-[#2d6a4f]/30 hidden md:block rounded-tl-xl" />
      </div>

      {/* Content Section */}
      <div className="md:pl-8">
        <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
          About ARSA REALESTATE
        </p>
        <h2 className="font-display text-4xl md:text-5xl mb-8 green-line text-[#111827]">
          A Legacy of<br />
          <em>Refined Living</em>
        </h2>
        <p className="text-[#333333] leading-relaxed mb-5 font-medium">
          Founded in 2002, ARSA REALESTATE has quietly become the most trusted name in ultra-luxury
          residential real estate. We represent a select number of extraordinary properties — never
          volume, always quality.
        </p>
        <p className="text-[#333333] leading-relaxed mb-10 font-medium">
          Our advisors are drawn from the worlds of architecture, private banking, and hospitality.
          Each brings a personal network and an eye for what makes a home genuinely exceptional, not
          simply expensive.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-10">
          {[
            { v: '22 yrs', l: 'Established 2002' },
            { v: 'Private', l: 'By Referral Only' },
            { v: 'Global', l: 'Seven Markets' },
            { v: '100%', l: 'Client Retention' },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-2xl text-[#2d6a4f]">{s.v}</div>
              <div className="text-[#333333] text-xs tracking-widest uppercase mt-1 font-medium">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
