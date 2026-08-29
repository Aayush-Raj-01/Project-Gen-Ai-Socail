<<<<<<< HEAD
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavyButton } from "../components/NavyButton";
import { SearchBar, type SearchResultItem } from "../components/SearchBar";

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "vision" | "llm" | "ocr">("all");

  const handleSearchResultSelect = (item: SearchResultItem) => {
    // Navigate to studio with selected item/template
    router.push(`/mainpage?item=${encodeURIComponent(item.title)}&cat=${encodeURIComponent(item.category)}`);
  };

  const handleSearchSubmit = (query: string) => {
    // Navigate to studio with search query
    router.push(`/mainpage?q=${encodeURIComponent(query)}`);
  };

  const quickPrompts = [
    { label: "🚀 Viral Product Launch", query: "Product Launch Announcement" },
    { label: "💼 LinkedIn Thought Leadership", query: "LinkedIn Post" },
    { label: "🖼️ Analyze Image with Florence-2", query: "Image Analysis" },
    { label: "📄 Hindi/English OCR", query: "OCR Text Extractor" },
    { label: "📸 Instagram Carousel", query: "Instagram Slide Carousel" },
  ];

  return (
    <div className="landing-root">
      <style>{`
        /* ── Base & Global Styling ── */
        .landing-root {
          min-height: 100vh;
          background: #050a09;
          color: #e0e8e6;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ── Ambient Glowing Backdrops ── */
        .landing-glow-1 {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 200, 150, 0.12) 0%, rgba(10, 25, 47, 0.18) 50%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .landing-glow-2 {
          position: absolute;
          top: 600px;
          right: -150px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(10, 25, 47, 0.12) 60%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Navbar ── */
        .landing-header {
          position: sticky;
          top: 0;
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 200, 150, 0.08);
          background: rgba(5, 10, 9, 0.75);
        }

        .landing-logo-wrap {
          display: flex;
          align-items: baseline;
          text-decoration: none;
          flex-shrink: 0;
        }

        .landing-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #00c896 0%, #4aedc4 50%, #64b5f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .landing-logo-badge {
          font-size: 10px;
          font-weight: 600;
          color: #00c896;
          background: rgba(0, 200, 150, 0.12);
          border: 1px solid rgba(0, 200, 150, 0.25);
          padding: 2px 6px;
          border-radius: 6px;
          margin-left: 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .landing-nav-link {
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(224, 232, 230, 0.7);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .landing-nav-link:hover {
          color: #00c896;
        }

        .landing-header-search {
          flex: 1 1 360px;
          max-width: 420px;
        }

        .landing-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        /* ── Hero Section ── */
        .landing-hero {
          position: relative;
          z-index: 10;
          max-width: 1080px;
          margin: 0 auto;
          padding: 70px 24px 80px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: rgba(0, 200, 150, 0.08);
          border: 1px solid rgba(0, 200, 150, 0.22);
          color: #4aedc4;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.3px;
          margin-bottom: 24px;
          box-shadow: 0 0 20px rgba(0, 200, 150, 0.1);
        }

        .landing-title {
          font-size: 54px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1.5px;
          color: #ffffff;
          margin-bottom: 36px;
          max-width: 900px;
        }

        .landing-title-highlight {
          background: linear-gradient(135deg, #00c896 0%, #4aedc4 50%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .landing-subtitle {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(224, 232, 230, 0.7);
          max-width: 680px;
          margin-bottom: 36px;
        }

        .landing-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        /* ── Interactive Hero Search Showcase ── */
        .landing-search-showcase {
          width: 100%;
          max-width: 680px;
          background: rgba(10, 24, 22, 0.85);
          border: 1px solid rgba(0, 200, 150, 0.2);
          border-radius: 24px;
          padding: 24px 28px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 200, 150, 0.08);
          backdrop-filter: blur(30px);
          margin-bottom: 60px;
        }

        .landing-search-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(0, 200, 150, 0.8);
          margin-bottom: 12px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .landing-chip-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
          justify-content: flex-start;
        }

        .landing-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(224, 232, 230, 0.75);
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 11.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .landing-chip:hover {
          background: rgba(0, 200, 150, 0.12);
          border-color: rgba(0, 200, 150, 0.3);
          color: #4aedc4;
          transform: translateY(-1px);
        }

        /* ── Features Grid ── */
        .landing-features {
          max-width: 1200px;
          margin: 0 auto 90px;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          width: 100%;
        }

        .landing-section-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .landing-section-title {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .landing-section-desc {
          font-size: 15px;
          color: rgba(224, 232, 230, 0.6);
        }

        .landing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .landing-card {
          background: rgba(10, 20, 18, 0.75);
          border: 1px solid rgba(0, 200, 150, 0.1);
          border-radius: 20px;
          padding: 32px 28px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .landing-card:hover {
          border-color: rgba(0, 200, 150, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 200, 150, 0.06);
        }

        .landing-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(0, 200, 150, 0.1);
          border: 1px solid rgba(0, 200, 150, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .landing-card-title {
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
        }

        .landing-card-desc {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(224, 232, 230, 0.65);
          margin-bottom: 24px;
          flex-grow: 1;
        }

        /* ── Footer ── */
        .landing-footer {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(3, 7, 6, 0.9);
          padding: 40px 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        .landing-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        /* ── Responsive Queries ── */
        @media (max-width: 900px) {
          .landing-nav-links {
            display: none;
          }
          .landing-title {
            font-size: 38px;
          }
          .landing-subtitle {
            font-size: 16px;
          }
        }

        @media (max-width: 768px) {
          .landing-header {
            padding: 14px 18px;
            flex-wrap: wrap;
          }
          .landing-header-search {
            order: 3;
            width: 100%;
            max-width: 100%;
          }
          .landing-title {
            font-size: 32px;
          }
          .landing-cta-group {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>

      {/* Ambient Lighting */}
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />

      {/* ── Top Header / Navbar ── */}
      <header className="landing-header">
        <Link href="/" className="landing-logo-wrap">
          <span className="landing-logo">GenAI Social</span>
          <span className="landing-logo-badge">Studio</span>
        </Link>

        {/* Navigation Links */}
        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#models" className="landing-nav-link">AI Models</a>
          <a href="#templates" className="landing-nav-link">Templates</a>
        </nav>

        {/* ── Search Bar Prominently in Header ── */}
        <SearchBar
          placeholder="Search templates, models, tools..."
          onSelectResult={handleSearchResultSelect}
          onSearchSubmit={handleSearchSubmit}
          className="landing-header-search"
        />

        {/* ── Navy Button Action in Navbar ── */}
        <div className="landing-header-actions">
          <Link href="/mainpage">
            <NavyButton variant="gradient" size="sm">
              Launch Studio ➜
            </NavyButton>
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span>⚡</span> Next-Gen Multimodal Social AI
        </div>

        <h1 className="landing-title">
          Craft High-Impact Social Content with{" "}
          <span className="landing-title-highlight">AI Intelligence</span>
        </h1>

        {/* ── Navy Button CTAs in Hero ── */}
        <div className="landing-cta-group">
          <Link href="/mainpage">
            <NavyButton variant="gradient" size="lg">
              ✨ Start Generating Free
            </NavyButton>
          </Link>

          <Link href="/mainpage">
            <NavyButton variant="glow" size="lg">
              🚀 Explore Studio Workspace
            </NavyButton>
          </Link>

          <a href="#features">
            <NavyButton variant="outline" size="lg">
              📖 View Capabilities
            </NavyButton>
          </a>
        </div>

        {/* ── Interactive Search Showcase in Hero ── */}
        <div className="landing-search-showcase">
          <div className="landing-search-label">
            <span>🔍</span> Search & Quick-Start Studio
          </div>
          
          <SearchBar
            placeholder="Search here... (e.g. LinkedIn post, Florence-2, Hindi OCR)"
            onSelectResult={handleSearchResultSelect}
            onSearchSubmit={handleSearchSubmit}
            className="w-full"
          />

          <div className="landing-chip-list">
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", alignSelf: "center", marginRight: "4px" }}>Trending:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                className="landing-chip"
                onClick={() => handleSearchSubmit(p.query)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features & AI Models Grid ── */}
      <section id="features" className="landing-features">
        <div id="models" className="landing-section-header">
          <h2 className="landing-section-title">Built with State-of-the-Art AI</h2>
          <p className="landing-section-desc">
            A comprehensive pipeline combining vision, multilingual OCR, and generative intelligence.
          </p>
        </div>

        <div className="landing-grid">
          {/* Card 1: Florence-2 */}
          <div className="landing-card">
            <div>
              <div className="landing-card-icon">🖼️</div>
              <h3 className="landing-card-title">Florence-2 Vision Extraction</h3>
              <p className="landing-card-desc">
                Extracts deep semantic visual features, scene details, colors, and object relationships so no creative element is missed.
              </p>
            </div>
            <Link href="/mainpage?item=Florence-2%20Vision&cat=Tools%20%26%20AI">
              <NavyButton variant="solid" size="sm" className="w-full">
                Try Image Vision ➜
              </NavyButton>
            </Link>
          </div>

          {/* Card 2: EasyOCR */}
          <div className="landing-card">
            <div>
              <div className="landing-card-icon">📄</div>
              <h3 className="landing-card-title">Bilingual OCR Engine</h3>
              <p className="landing-card-desc">
                Powered by EasyOCR to extract Hindi & English text from infographics, flyers, screenshots, and PDF documents flawlessly.
              </p>
            </div>
            <Link href="/mainpage?item=EasyOCR%20Text%20Extractor&cat=Tools%20%26%20AI">
              <NavyButton variant="solid" size="sm" className="w-full">
                Extract Text ➜
              </NavyButton>
            </Link>
          </div>

          {/* Card 3: Qwen3-4B */}
          <div className="landing-card">
            <div>
              <div className="landing-card-icon">🤖</div>
              <h3 className="landing-card-title">Qwen3-4B Local LLM</h3>
              <p className="landing-card-desc">
                High-speed local inference tailored for social copy, hooks, hashtags, and executive summaries with fine-grained tone tuning.
              </p>
            </div>
            <Link href="/mainpage?item=Qwen3-4B%20Instruct&cat=Tools%20%26%20AI">
              <NavyButton variant="gradient" size="sm" className="w-full">
                Generate Copy ➜
              </NavyButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Popular Social Templates Section ── */}
      <section id="templates" className="landing-features" style={{ marginTop: "-20px" }}>
        <div className="landing-section-header">
          <h2 className="landing-section-title">Popular Social Formats & Templates</h2>
          <p className="landing-section-desc">
            One-click prompt structures optimized for high conversion and organic engagement.
          </p>
        </div>

        <div className="landing-grid">
          <div className="landing-card">
            <div>
              <div className="landing-card-icon">💼</div>
              <h3 className="landing-card-title">LinkedIn Thought Leadership</h3>
              <p className="landing-card-desc">
                Hooks, structured insight breakdowns, and community engagement prompts tailored for industry professionals.
              </p>
            </div>
            <Link href="/mainpage?item=LinkedIn%20Thought%20Leadership&cat=Templates">
              <NavyButton variant="outline" size="sm" className="w-full">
                Use Template ➜
              </NavyButton>
            </Link>
          </div>

          <div className="landing-card">
            <div>
              <div className="landing-card-icon">📸</div>
              <h3 className="landing-card-title">Instagram Slide Carousel</h3>
              <p className="landing-card-desc">
                Slide-by-slide copy with visual prompts, swipe triggers, and save-worthy educational checklists.
              </p>
            </div>
            <Link href="/mainpage?item=Instagram%20Slide%20Carousel&cat=Templates">
              <NavyButton variant="outline" size="sm" className="w-full">
                Use Template ➜
              </NavyButton>
            </Link>
          </div>

          <div className="landing-card">
            <div>
              <div className="landing-card-icon">📊</div>
              <h3 className="landing-card-title">Executive Brief & Bullets</h3>
              <p className="landing-card-desc">
                Crisp bulleted summaries highlighting key takeaways, metrics, and strategic decisions for leaders.
              </p>
            </div>
            <Link href="/mainpage?item=Executive%20Summary&cat=Templates">
              <NavyButton variant="outline" size="sm" className="w-full">
                Use Template ➜
              </NavyButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div>
            © 2026 GenAI Social Studio. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/landingpage" style={{ color: "inherit", textDecoration: "none" }}>Landing</Link>
            <Link href="/mainpage" style={{ color: "inherit", textDecoration: "none" }}>Studio Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
=======
export default function LandingPage() {
  return (
    <div>
      <h1>Landing Page</h1>
    </div>
  );
}
>>>>>>> cd04194944c3c253701ad571a5115640423c06cb
