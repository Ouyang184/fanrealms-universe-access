import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface PageSeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  /** Optional JSON-LD object (or array) to inject as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "FanRealms";
const ORIGIN = "https://fanrealms.com";

/**
 * Per-route SEO tags. Sets title, meta description, canonical, og:*, twitter:*, and
 * optional structured data. Title is auto-suffixed with the site name unless already present.
 */
export const PageSeo = ({
  title,
  description,
  canonicalPath,
  ogType = "website",
  ogImage,
  jsonLd,
}: PageSeoProps) => {
  const location = useLocation();
  const path = canonicalPath ?? location.pathname;
  const canonical = `${ORIGIN}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default PageSeo;
