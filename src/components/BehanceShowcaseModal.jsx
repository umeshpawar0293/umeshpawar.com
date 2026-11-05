import React from 'react'
import { cleanAssetUrl } from '../data/portfolioData'

/**
 * Helper to sanitize URLs in case of markdown formatting [url](url)
 */
const sanitizeUrl = (url) => {
  if (!url) return 'https://www.behance.net/umesh_pawar'
  const match = url.match(/\((https?:\/\/[^)]+)\)/)
  if (match) return match[1]
  return url.replace(/^\[(.*?)\]$/, '$1').trim()
}

/**
 * 12 Curated Behance Projects strictly mapped to numbered filenames in /projects/behance/
 * and their verified Behance gallery links.
 */
export const behanceProjects = [
  {
    title: "McDonald's - Eatqual 2022",
    prefix: "01",
    filename: "01-McDonald's -Eatqual 2022.webp",
    cover: "/projects/behance/01-McDonald's%20-Eatqual%202022.webp",
    link: "https://www.behance.net/gallery/191249819/McDonalds-Eatqual-2022",
    category: "Packaging & Inclusive Design",
  },
  {
    title: "McDonald's - Memory Bites",
    prefix: "02",
    filename: "02-McDonald's - Memory Bites.webp",
    cover: "/projects/behance/02-McDonald's%20-%20Memory%20Bites.webp",
    link: "https://www.behance.net/gallery/191250577/McDonalds-Memory-Bites",
    category: "Brand Identity & Spatial",
  },
  {
    title: "Flipkart Big Diwali Sale",
    prefix: "03",
    filename: "03-Flipkart Big Diwali Sale.webp",
    cover: "/projects/behance/03-Flipkart%20Big%20Diwali%20Sale.webp",
    link: "https://www.behance.net/gallery/188939455/Flipkart-Big-Diwali-Sale",
    category: "Campaign & Creative Direction",
  },
  {
    title: "House of McDowells - #YaaronWaliBaat",
    prefix: "04",
    filename: "04-House of McDowells - YaaronWaliBaat.webp",
    cover: "/projects/behance/04-House%20of%20McDowells%20-%20YaaronWaliBaat.webp",
    link: "https://www.behance.net/gallery/188941927/House-of-McDowells-YaaronWaliBaat",
    category: "Art Direction & Key Visual",
  },
  {
    title: "Flipkart - Sale Price Live",
    prefix: "05",
    filename: "05-Flipkart -Sale Price Live.webp",
    cover: "/projects/behance/05-Flipkart%20-Sale%20Price%20Live.webp",
    link: "https://www.behance.net/gallery/183786191/Flipkart-Sale-Price-Live",
    category: "UI & E-Commerce Campaign",
  },
  {
    title: "McDonald's - Mixology Campaign",
    prefix: "06",
    filename: "06-McDonald's - Mixology Campaign.webp",
    cover: "/projects/behance/06-McDonald's%20-%20Mixology%20Campaign.webp",
    link: "https://www.behance.net/gallery/183785083/McDonalds-Mixology-Campaign",
    category: "Beverage Packaging & Brand",
  },
  {
    title: "McDonald's - Shake Shake Fries",
    prefix: "07",
    filename: "07-McDonald's - Shake Shake Fries.webp",
    cover: "/projects/behance/07-McDonald's%20-%20Shake%20Shake%20Fries.webp",
    link: "https://www.behance.net/gallery/183785619/McDonalds-Shake-Shake-Fries",
    category: "Brand Motion & Art Direction",
  },
  {
    title: "McDonald's - IPL Campaign",
    prefix: "08",
    filename: "08-McDonald's - IPL Campaign.webp",
    cover: "/projects/behance/08-McDonald's%20-%20IPL%20Campaign.webp",
    link: "https://www.behance.net/gallery/183784485/McDonalds-IPL-Campaign",
    category: "Sports Activation & Campaign",
  },
  {
    title: "McDowells x FC Goa KV",
    prefix: "09",
    filename: "09-McDowells x FC Goa KV.webp",
    cover: "/projects/behance/09-McDowells%20x%20FC%20Goa%20KV.webp",
    link: "https://www.behance.net/gallery/183785919/McDowells-x-FC-Goa-KV",
    category: "Sports KV & Visual Identity",
  },
  {
    title: "McD Cricket Live Commentory",
    prefix: "10",
    filename: "10-McD Cricket Live Commentory.webp",
    cover: "/projects/behance/10-McD%20Cricket%20Live%20Commentory.webp",
    link: "https://www.behance.net/gallery/160845161/McD-Cricket-Live-Commentory",
    category: "Digital Interactive Experience",
  },
  {
    title: "The Rashmika Meal - McDonald's",
    prefix: "11",
    filename: "11-The Rashmika Meal - McDonald's.webp",
    cover: "/projects/behance/11-The%20Rashmika%20Meal%20-%20McDonald's.webp",
    link: "https://www.behance.net/gallery/144246129/The-Rashmika-Meal-McDonalds",
    category: "Celebrity Campaign & Packaging",
  },
  {
    title: "Supersonic 2023",
    prefix: "12",
    filename: "12-Supersonic 2023.webp",
    cover: "/projects/behance/12-Supersonic%202023.webp",
    link: "https://www.behance.net/gallery/184150501/Supersonic-2023",
    category: "Music Festival Identity & Art",
  },
]

// Backwards compatibility alias
export const BEHANCE_SHOWCASE_PROJECTS = behanceProjects

/**
 * Curated Behance Showcase Hub
 * - Displays official Umesh Pawar profile identity header (horizontal layout)
 * - Uses /projects/behance/avatar.png
 * - Full 12-project responsive 3x4 grid mapped to Behance gallery URLs
 * - Bottom CTA: "Check more work on Behance"
 */
export const BehanceShowcaseModal = ({ onClose }) => {
  return (
    <div className="behance-showcase-hub w-full max-w-5xl mx-auto py-4 px-3 md:px-6 text-white select-none">
      {/* 1. BEHANCE HEADER PROFILE BANNER (HORIZONTAL REFINED LAYOUT) */}
      <div className="behance-profile-banner">
        {/* Profile Identity: Avatar on left, ALL info neatly placed next to avatar horizontally */}
        <div className="behance-profile-identity">
          <div className="behance-avatar-ring">
            <img
              src="/projects/behance/Avatar.webp"
              alt="Umesh Pawar"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = '/projects/behance/avatar.png'
              }}
            />
          </div>

          <div className="behance-profile-details">
            <div className="behance-title-row">
              <h2 className="behance-profile-name">Umesh Pawar</h2>
              <span className="behance-pro-badge">Bēhance Pro</span>
            </div>
            <p className="behance-profile-bio">
              Creative Artist &amp; Visual Designer • Mumbai, India
            </p>
            {/* STATS STRIP: Placed horizontally alongside avatar */}
            <div className="behance-stats-strip">
              <div>
                <span className="behance-stat-val">8,626</span> Project Views
              </div>
              <div className="behance-stat-dot" />
              <div>
                <span className="behance-stat-val">180</span> Appreciations
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY CTA BUTTON */}
        <a
          href="https://www.behance.net/umesh_pawar"
          target="_blank"
          rel="noopener noreferrer"
          className="behance-btn-primary"
        >
          <span>Visit Full Behance Profile</span>
          <span className="behance-btn-arrow">↗</span>
        </a>
      </div>

      {/* 2. 12-PROJECT GRID (3 COLUMNS x 4 ROWS) */}
      <div
        className="behance-grid-3x3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1rem',
          maxHeight: '65vh',
          overflowY: 'auto',
          padding: '1rem',
        }}
      >
        {behanceProjects.map((item, idx) => (
          <a
            key={item.prefix || idx}
            href={sanitizeUrl(item.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="behance-project-tile group"
          >
            {/* THUMBNAIL CONTAINER */}
            <div
              className="behance-tile-thumb"
              style={{
                position: 'relative',
                width: '100%',
                height: '140px', // Ensures explicit height for the thumbnail preview area
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
              }}
            >
              <img
                src={item.cover}
                alt={item.title}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  const currentSrc = e.currentTarget.src
                  if (currentSrc.endsWith('.webp')) {
                    e.currentTarget.src = currentSrc.replace(/\.webp$/i, '.jpg')
                  } else if (item.filename) {
                    e.currentTarget.src = cleanAssetUrl(`/projects/behance/${item.filename}`)
                  }
                }}
              />
              <div className="behance-tile-hover-overlay">
                <span className="behance-tile-view-badge">
                  VIEW ON BEHANCE <span>↗</span>
                </span>
              </div>
            </div>

            {/* INFO BAR */}
            <div className="behance-tile-info">
              <div className="behance-tile-text">
                <div className="behance-tile-title-row">
                  <span className="behance-tile-prefix">{item.prefix}</span>
                  <h4 className="behance-tile-title">
                    {item.title}
                  </h4>
                </div>
                <p className="behance-tile-cat">{item.category}</p>
              </div>
              <span className="behance-tile-arrow">↗</span>
            </div>
          </a>
        ))}
      </div>

      {/* 3. BOTTOM FOOTER CTA */}
      <div className="behance-bottom-footer">
        <a
          href="https://www.behance.net/umesh_pawar"
          target="_blank"
          rel="noopener noreferrer"
          className="behance-btn-bottom"
        >
          <span>Check more work on Behance</span>
          <span className="font-bold">↗</span>
        </a>
      </div>
    </div>
  )
}

export default BehanceShowcaseModal
