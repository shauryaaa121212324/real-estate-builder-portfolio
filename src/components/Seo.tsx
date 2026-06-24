// ---------------------------------------------------------------------------
// Reusable SEO component
// Wraps react-helmet-async to apply page title, meta description, canonical
// URL, Open Graph, and Twitter card tags consistently across public pages.
// ---------------------------------------------------------------------------

import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://www.autorbuilders.com';
export const SITE_NAME = 'Autor Builders';

// Fallback social-preview image — points at an existing public asset so
// crawlers always resolve a real file rather than a placeholder URL.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero-fallback.jpg`;

export interface SeoProps {
  /** Full page title, e.g. "Our Projects | Autor Builders" */
  title: string;
  /** Meta description (ideally ≤160 characters) */
  description: string;
  /** Site-relative path used to build the canonical URL and og:url, e.g. "/projects" */
  path?: string;
  /** Absolute image URL for Open Graph / Twitter. Falls back to DEFAULT_OG_IMAGE. */
  image?: string;
  /** Open Graph type. Defaults to "website". */
  type?: 'website' | 'article' | 'product';
  /** Set true to discourage indexing of this page (e.g. internal/utility pages). */
  noindex?: boolean;
}

export function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noindex = false,
}: SeoProps) {
  const canonicalUrl = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default Seo;