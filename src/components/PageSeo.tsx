import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface PageSeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

const SITE_NAME = "FanRealms";
const ORIGIN = "https://fanrealms.com";

/**
 * Per-route SEO tags. Sets title, meta description, canonical, and og:* overrides.
 * Title is auto-suffixed with the site name unless it already contains it.
 */
export const PageSeo = ({ title, description, canonicalPath }: PageSeoProps) => {
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
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default PageSeo;
