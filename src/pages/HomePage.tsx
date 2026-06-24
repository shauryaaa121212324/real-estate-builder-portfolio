import { Helmet } from 'react-helmet-async';
import HeroSection from '../sections/HeroSection';
import AboutSection from '../sections/AboutSection';
import SignatureNumbersSection from '../sections/SignatureNumbersSection';
import PhilosophySection from '../sections/PhilosophySection';
import HighlightsSection from '../sections/HighlightsSection';
import TestimonialsPreviewSection from '../sections/TestimonialsPreviewSection';

const SITE_URL = 'https://www.autorbuilders.com';
const PAGE_TITLE = 'Autor Builders | Luxury Real Estate Development in Hyderabad';
const PAGE_DESCRIPTION =
  'Autor Builders crafts architectural landmarks across Hyderabad — luxury residences, private villas, and master-planned communities defined by uncompromising design and craftsmanship since 2009.';
// Falls back to the existing hero-fallback asset — no og-home.jpg exists in public/images.
const OG_IMAGE = `${SITE_URL}/images/hero-fallback.jpg`;

// ---------------------------------------------------------------------------
// JSON-LD — Organization
// NOTE: logo, telephone, address, and sameAs are PLACEHOLDER values.
// Replace with real business details before production deploy.
// ---------------------------------------------------------------------------

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Autor Builders',
  alternateName: 'Aurelia Estates',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`, // PLACEHOLDER — replace with actual logo asset URL
  description: PAGE_DESCRIPTION,
  foundingDate: '2009',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'PLACEHOLDER — Street Address', // PLACEHOLDER
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: 'PLACEHOLDER', // PLACEHOLDER
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-00000-00000', // PLACEHOLDER
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['en', 'te'],
  },
  sameAs: [
    'https://www.facebook.com/PLACEHOLDER', // PLACEHOLDER
    'https://www.instagram.com/PLACEHOLDER', // PLACEHOLDER
    'https://www.linkedin.com/company/PLACEHOLDER', // PLACEHOLDER
  ],
};

// ---------------------------------------------------------------------------
// JSON-LD — RealEstateAgent
// NOTE: geo coordinates and areaServed are PLACEHOLDER values.
// ---------------------------------------------------------------------------

const realEstateAgentSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#realestateagent`,
  name: 'Autor Builders',
  image: OG_IMAGE,
  url: SITE_URL,
  description: PAGE_DESCRIPTION,
  priceRange: '₹₹₹', // PLACEHOLDER — relative price tier indicator
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'PLACEHOLDER — Street Address', // PLACEHOLDER
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: 'PLACEHOLDER', // PLACEHOLDER
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 17.385, // PLACEHOLDER — approximate Hyderabad center, replace with real HQ coords
    longitude: 78.4867, // PLACEHOLDER
  },
  areaServed: [
    { '@type': 'City', name: 'Hyderabad' },
    { '@type': 'City', name: 'Bengaluru' }, // PLACEHOLDER — confirm actual service cities
    { '@type': 'City', name: 'Chennai' }, // PLACEHOLDER
  ],
  telephone: '+91-00000-00000', // PLACEHOLDER
};

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:site_name" content="Autor Builders" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* JSON-LD: Organization */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>

        {/* JSON-LD: RealEstateAgent */}
        <script type="application/ld+json">
          {JSON.stringify(realEstateAgentSchema)}
        </script>
      </Helmet>

      <HeroSection />
      <AboutSection />
      <SignatureNumbersSection />
      <PhilosophySection />
      <HighlightsSection />
      <TestimonialsPreviewSection />
    </>
  );
}