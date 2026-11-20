"use client";

import { Check, Copy, FileCode, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "@/lib/sound";

type TabId = "profile" | "architecture" | "metrics";

const codeSnippets: Record<TabId, { filename: string; language: string; code: string }> = {
  profile: {
    filename: "engineer.ts",
    language: "TypeScript",
    code: `// Full Stack Engineer & System Builder
import { Developer } from "@kerala/engineers";

export const ilyas: Developer = {
  name: "Muhammed Ilyas MK",
  role: "MERN & Next.js Full Stack Engineer",
  location: "Kerala, India (IST / UTC+5:30)",
  productionShipped: 7,
  coreStack: ["Next.js", "React", "Node.js", "MongoDB", "MySQL", "Redis"],
  architectures: ["RBAC", "RESTful APIs", "Cloudflare R2", "DigitalOcean Spaces"],
  currentStatus: "Open for High-Impact Roles & Freelance",
  build: (spec) => spec.compileToProduction({ uptime: 0.999, latency: "<20ms" })
};`,
  },
  architecture: {
    filename: "system.config.ts",
    language: "TypeScript",
    code: `// Scalable Backend & Cache Architecture
import { RedisCluster, S3Storage, AuthGuard } from "@backend/core";

export const systemPipeline = {
  auth: new AuthGuard({ strategy: "JWT", roles: ["Admin", "SuperAgent", "Employer", "User"] }),
  cache: new RedisCluster({ ttl: 3600, policy: "LRU" }),
  storage: new S3Storage({ provider: "DigitalOcean Spaces", presignedUrls: true }),
  aiModules: {
    resumeParser: "Gemini-Pro-Vision",
    jobMatcher: "VectorEmbeddings + CosineSimilarity"
  }
};`,
  },
  metrics: {
    filename: "telemetry.json",
    language: "JSON",
    code: `{
  "system": "Production Cluster",
  "productsInProduction": 7,
  "languagesSupported": 6,
  "userRolesSupported": 5,
  "averageResponseTime": "14ms",
  "testCoverage": "Strict Type Safety",
  "securityAudits": "Zero Critical Vulnerabilities",
  "deployments": "DigitalOcean & Netlify CI/CD"
}`,
  },
};

export default function CodeWindow() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const activeSnippet = codeSnippets[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet.code);
      setCopied(true);
      playClickSound();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Gentle 3D tilt towards mouse pointer
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    };

    const onLeave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="code-stage relative select-none" aria-hidden="true">
      <div ref={cardRef} className="terminal-window">
        {/* Terminal Header */}
        <div className="terminal-bar">
          <div className="terminal-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>

          {/* Interactive Tabs */}
          <div className="terminal-tabs">
            {(["profile", "architecture", "metrics"] as TabId[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? "is-active" : ""}`}
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab);
                }}
                onMouseEnter={playHoverSound}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{codeSnippets[tab].filename}</span>
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            className="terminal-copy-btn"
            onClick={handleCopy}
            title="Copy snippet"
            onMouseEnter={playHoverSound}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Code Viewport */}
        <div className="terminal-body">
          <pre className="code-content">
            <code>
              {activeSnippet.code.split("\n").map((line, idx) => (
                <div key={idx} className="code-line-row">
                  <span className="line-num">{idx + 1}</span>
                  <span className="line-text">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Status Bar */}
        <div className="terminal-status-bar">
          <span className="flex items-center gap-2">
            <span className="status-indicator-dot" />
            <span>Node.js v22 · Strict TS</span>
          </span>
          <span className="terminal-lang">{activeSnippet.language}</span>
        </div>
      </div>

      {/* Floating 3D Tech Chips */}
      <span className="float-chip c1">Next.js 16</span>
      <span className="float-chip c2">MongoDB</span>
      <span className="float-chip c3">Redis</span>
      <span className="float-chip c4">Three.js</span>
    </div>
  );
}
