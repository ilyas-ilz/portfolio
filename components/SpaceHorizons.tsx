"use client";

import { useEffect, useRef } from "react";

export default function SpaceHorizons() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="space-horizons" aria-hidden="true">
      {/* Top Left Cosmic Moon from Figma community pack */}
      <div className="horizon-moon">
        <img
          src="/space/planets/planet-01.svg"
          alt=""
          width={220}
          height={220}
          className="moon-glow-anim"
          loading="eager"
        />
        <div className="horizon-moon-ring" />
      </div>

      {/* Signature Diagonal Comets / Shooting Stars from Figma Model */}
      <div className="horizon-comet comet-primary">
        <svg viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line
            x1="10"
            y1="10"
            x2="300"
            y2="125"
            stroke="url(#cometTailGrad1)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="300" cy="125" r="5" fill="#ffffff" filter="url(#cometGlow1)" />
          <circle cx="300" cy="125" r="12" fill="rgba(255, 122, 198, 0.45)" />
          <defs>
            <linearGradient id="cometTailGrad1" x1="10" y1="10" x2="300" y2="125" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff7ac6" stopOpacity="0" />
              <stop offset="0.6" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="0.9" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <filter id="cometGlow1" x="270" y="95" width="60" height="60" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      <div className="horizon-comet comet-secondary">
        <svg viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line
            x1="10"
            y1="10"
            x2="200"
            y2="88"
            stroke="url(#cometTailGrad2)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="200" cy="88" r="4" fill="#ffffff" filter="url(#cometGlow2)" />
          <circle cx="200" cy="88" r="9" fill="rgba(0, 240, 255, 0.5)" />
          <defs>
            <linearGradient id="cometTailGrad2" x1="10" y1="10" x2="200" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="0.65" stopColor="#818cf8" stopOpacity="0.5" />
              <stop offset="0.9" stopColor="#00f0ff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <filter id="cometGlow2" x="180" y="68" width="40" height="40" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Left Rocky Alien Spire with Glowing Energy Pods (from Figma Cover Model) */}
      <svg
        className="horizon-spire spire-left"
        viewBox="0 0 340 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 640V190L48 230L72 150L112 270L150 210L186 350L240 430L290 530L340 640H0Z"
          fill="url(#gradSpireLeft)"
        />
        <path
          d="M0 640V280L38 310L58 240L96 350L130 310L160 420L210 500L260 580L300 640H0Z"
          fill="url(#gradSpireLeftInner)"
          opacity="0.6"
        />
        {/* Glowing Energy Pods / Windows from Figma Cover */}
        <g className="pod-pulse-group">
          <ellipse cx="68" cy="390" rx="14" ry="24" fill="url(#pinkPodGrad)" className="pod-glow pod-1" />
          <ellipse cx="142" cy="470" rx="16" ry="26" fill="url(#pinkPodGrad)" className="pod-glow pod-2" />
          <ellipse cx="44" cy="530" rx="12" ry="20" fill="url(#pinkPodGrad)" className="pod-glow pod-3" />
        </g>
        <defs>
          <linearGradient id="gradSpireLeft" x1="0" y1="150" x2="300" y2="640" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e133d" stopOpacity="0.88" />
            <stop offset="0.55" stopColor="#120c29" stopOpacity="0.96" />
            <stop offset="1" stopColor="#080514" />
          </linearGradient>
          <linearGradient id="gradSpireLeftInner" x1="0" y1="240" x2="260" y2="640" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2b1a56" />
            <stop offset="0.6" stopColor="#170f33" />
            <stop offset="1" stopColor="#0b071c" />
          </linearGradient>
          <radialGradient id="pinkPodGrad" cx="50%" cy="50%" r="50%">
            <stop stopColor="#ff7ac6" />
            <stop offset="0.45" stopColor="#ec4899" />
            <stop offset="0.8" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="1" stopColor="#1e133d" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Right Rocky Alien Spire with Glowing Energy Pods (from Figma Cover Model) */}
      <svg
        className="horizon-spire spire-right"
        viewBox="0 0 360 740"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M360 740V30L308 110L328 170L266 230L298 300L214 410L160 530L88 610L0 740H360Z"
          fill="url(#gradSpireRight)"
        />
        <path
          d="M360 740V120L320 180L336 230L286 280L312 340L236 440L190 550L130 620L60 740H360Z"
          fill="url(#gradSpireRightInner)"
          opacity="0.55"
        />
        {/* Glowing Energy Pods / Windows from Figma Cover */}
        <g className="pod-pulse-group">
          <ellipse cx="295" cy="220" rx="16" ry="26" fill="url(#pinkPodGradRight)" className="pod-glow pod-4" />
          <ellipse cx="250" cy="380" rx="18" ry="30" fill="url(#pinkPodGradRight)" className="pod-glow pod-5" />
          <ellipse cx="282" cy="540" rx="15" ry="24" fill="url(#pinkPodGradRight)" className="pod-glow pod-6" />
        </g>
        <defs>
          <linearGradient id="gradSpireRight" x1="360" y1="30" x2="80" y2="740" gradientUnits="userSpaceOnUse">
            <stop stopColor="#251447" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#150d2e" stopOpacity="0.96" />
            <stop offset="1" stopColor="#080514" />
          </linearGradient>
          <linearGradient id="gradSpireRightInner" x1="360" y1="120" x2="130" y2="740" gradientUnits="userSpaceOnUse">
            <stop stopColor="#321b61" />
            <stop offset="0.55" stopColor="#1a1038" />
            <stop offset="1" stopColor="#0c071e" />
          </linearGradient>
          <radialGradient id="pinkPodGradRight" cx="50%" cy="50%" r="50%">
            <stop stopColor="#ff7ac6" />
            <stop offset="0.45" stopColor="#f43f5e" />
            <stop offset="0.8" stopColor="#9333ea" stopOpacity="0.6" />
            <stop offset="1" stopColor="#251447" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
