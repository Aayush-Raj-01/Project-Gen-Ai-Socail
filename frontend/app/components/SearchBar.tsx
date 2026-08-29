"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export interface SearchResultItem {
  id: string;
  title: string;
  category: "Templates" | "Tools & AI" | "Selectors" | "Actions" | "History";
  description: string;
  icon: string;
  badge?: string;
  action?: () => void;
}

const SEARCHABLE_DATABASE: SearchResultItem[] = [
  {
    id: "tool-img",
    title: "Image Analysis (Florence-2)",
    category: "Tools & AI",
    description: "Extract key visual details and metadata from uploaded images.",
    icon: "🖼️",
    badge: "AI Vision",
  },
  {
    id: "tool-ocr",
    title: "OCR Text Extractor (EasyOCR)",
    category: "Tools & AI",
    description: "Extract Hindi & English text from images and documents.",
    icon: "📄",
    badge: "Bilingual OCR",
  },
  {
    id: "tool-llm",
    title: "Qwen3-4B Instruct LLM",
    category: "Tools & AI",
    description: "Generate structured social content using local LLM engine.",
    icon: "🤖",
    badge: "Core Model",
  },
  {
    id: "tool-voice",
    title: "Voice Audio Dictation",
    category: "Tools & AI",
    description: "Dictate prompts and record audio instructions directly.",
    icon: "🎙️",
    badge: "Speech",
  },
  {
    id: "tpl-linkedin",
    title: "LinkedIn Thought Leadership Post",
    category: "Templates",
    description: "High-engagement professional post with strong hook and takeaway.",
    icon: "💼",
    badge: "Social",
  },
  {
    id: "tpl-story",
    title: "Viral Storytelling Post",
    category: "Templates",
    description: "Engaging narrative hook with character and resolution.",
    icon: "📖",
    badge: "Creative",
  },
  {
    id: "tpl-bullet",
    title: "Executive Summary (Bullet Points)",
    category: "Templates",
    description: "Concise actionable summary designed for leadership and teams.",
    icon: "📊",
    badge: "Business",
  },
  {
    id: "tpl-carousel",
    title: "Instagram Slide Carousel Script",
    category: "Templates",
    description: "Multi-slide breakdown for visual education and marketing.",
    icon: "📸",
    badge: "Marketing",
  },
  {
    id: "sel-audience-student",
    title: "Target Audience: Student",
    category: "Selectors",
    description: "Optimize tone for educational and young learner context.",
    icon: "👥",
  },
  {
    id: "sel-audience-exec",
    title: "Target Audience: Executive",
    category: "Selectors",
    description: "High-level strategic language for decision makers.",
    icon: "👔",
  },
  {
    id: "sel-audience-tech",
    title: "Target Audience: Technical Team",
    category: "Selectors",
    description: "Detailed engineering and architecture-focused vocabulary.",
    icon: "💻",
  },
  {
    id: "sel-tone-prof",
    title: "Tone: Professional & Formal",
    category: "Selectors",
    description: "Refined corporate communication style.",
    icon: "🎭",
  },
  {
    id: "sel-tone-casual",
    title: "Tone: Casual & Friendly",
    category: "Selectors",
    description: "Conversational, approachable community-first tone.",
    icon: "✨",
  },
  {
    id: "act-history",
    title: "View Generation History",
    category: "Actions",
    description: "Browse past social media drafts, outputs and prompts.",
    icon: "🕒",
  },
  {
    id: "act-settings",
    title: "API & Model Settings",
    category: "Actions",
    description: "Configure FastAPI backend endpoints and model parameters.",
    icon: "⚙️",
  },
];

export interface SearchBarProps {
  onSelectResult?: (item: SearchResultItem) => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectResult,
  onSearchSubmit,
  className = "",
  placeholder = "Search here...",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    let results = SEARCHABLE_DATABASE;

    if (trimmed) {
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed) ||
          item.category.toLowerCase().includes(trimmed) ||
          (item.badge && item.badge.toLowerCase().includes(trimmed))
      );
    }

    if (activeFilter !== "All") {
      results = results.filter((item) => item.category === activeFilter);
    }

    return results;
  }, [query, activeFilter]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (selectedIndex >= 0 && filteredResults[selectedIndex]) {
      handleItemSelect(filteredResults[selectedIndex]);
      return;
    }

    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
    }
    setIsOpen(true);
  };

  const handleItemSelect = (item: SearchResultItem) => {
    if (onSelectResult) {
      onSelectResult(item);
    }
    setIsOpen(false);
    setQuery(item.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const categories = ["All", "Tools & AI", "Templates", "Selectors", "Actions"];

  return (
    <div
      ref={containerRef}
      className={`search-bar-root relative font-sans ${className}`}
      style={{ minWidth: "220px", maxWidth: "440px", flex: "1 1 auto" }}
    >
      <style>{`
        .search-bar-input-wrap {
          display: flex;
          align-items: center;
          background: rgba(10, 24, 22, 0.75);
          border: 1px solid rgba(0, 200, 150, 0.18);
          border-radius: 9999px;
          padding: 6px 14px 6px 12px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-bar-input-wrap:hover {
          border-color: rgba(0, 200, 150, 0.35);
          background: rgba(12, 28, 26, 0.85);
          box-shadow: 0 6px 24px rgba(0, 200, 150, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .search-bar-input-wrap:focus-within {
          border-color: #00c896;
          background: rgba(8, 20, 18, 0.95);
          box-shadow: 0 0 0 3px rgba(0, 200, 150, 0.15), 0 8px 30px rgba(0, 200, 150, 0.12);
        }

        .search-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #00c896;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
          margin-right: 8px;
        }

        .search-icon-btn:hover {
          color: #4aedc4;
          transform: scale(1.1);
        }

        .search-input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e0e8e6;
          font-size: 13.5px;
          font-weight: 400;
          letter-spacing: 0.1px;
          min-width: 80px;
        }

        .search-input-field::placeholder {
          color: rgba(224, 232, 230, 0.4);
        }

        .search-clear-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          margin-left: 6px;
          transition: all 0.15s ease;
        }

        .search-clear-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .search-kbd-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10.5px;
          font-family: monospace;
          color: rgba(0, 200, 150, 0.7);
          background: rgba(0, 200, 150, 0.08);
          border: 1px solid rgba(0, 200, 150, 0.2);
          padding: 2px 6px;
          border-radius: 6px;
          margin-left: 8px;
          user-select: none;
        }

        /* Results Dropdown */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(8, 18, 16, 0.95);
          border: 1px solid rgba(0, 200, 150, 0.2);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 200, 150, 0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          overflow: hidden;
          z-index: 100;
          animation: searchSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 480px;
          display: flex;
          flex-direction: column;
        }

        @keyframes searchSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .search-filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .search-filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .search-filter-btn {
          font-size: 11.5px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .search-filter-btn:hover {
          color: #e0e8e6;
          background: rgba(255, 255, 255, 0.08);
        }

        .search-filter-btn.active {
          background: rgba(0, 200, 150, 0.15);
          border-color: rgba(0, 200, 150, 0.35);
          color: #00c896;
        }

        .search-results-list {
          overflow-y: auto;
          padding: 6px 8px;
          max-height: 340px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .search-result-item:hover, .search-result-item.selected {
          background: rgba(0, 200, 150, 0.08);
          border-color: rgba(0, 200, 150, 0.15);
        }

        .search-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0, 200, 150, 0.1);
          border: 1px solid rgba(0, 200, 150, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .search-item-info {
          flex: 1;
          min-width: 0;
        }

        .search-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #e0e8e6;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .search-item-desc {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .search-item-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 200, 150, 0.12);
          color: #00c896;
          border: 1px solid rgba(0, 200, 150, 0.2);
        }

        .search-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
        }

        .search-footer-hint {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .search-footer-key {
          padding: 1px 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          font-family: monospace;
          font-size: 9.5px;
        }

        @media (max-width: 640px) {
          .search-bar-root {
            min-width: 140px;
          }
          .search-kbd-badge {
            display: none;
          }
        }
      `}</style>

      {/* Main Search Input Wrap */}
      <form onSubmit={handleSearch} className="search-bar-input-wrap">
        <button
          type="submit"
          className="search-icon-btn"
          title="Search"
          aria-label="Submit search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          className="search-input-field"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={clearQuery}
            title="Clear search"
          >
            ×
          </button>
        )}

        <div className="search-kbd-badge" title="Press ⌘K or Ctrl+K to search">
          <span>⌘K</span>
        </div>
      </form>

      {/* Dropdown Results Box */}
      {isOpen && (
        <div className="search-dropdown">
          {/* Filter Categories */}
          <div className="search-filter-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`search-filter-btn ${
                  activeFilter === cat ? "active" : ""
                }`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="search-results-list">
            {filteredResults.length > 0 ? (
              filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    className={`search-result-item ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleItemSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="search-item-icon">{item.icon}</div>
                    <div className="search-item-info">
                      <div className="search-item-title">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="search-item-badge">{item.badge}</span>
                        )}
                      </div>
                      <div className="search-item-desc">{item.description}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>🔍</div>
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="search-footer">
            <div className="search-footer-hint">
              <span>Navigate</span>
              <span className="search-footer-key">↑</span>
              <span className="search-footer-key">↓</span>
              <span>Select</span>
              <span className="search-footer-key">↵</span>
            </div>
            <div>
              <span>{filteredResults.length} items found</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
