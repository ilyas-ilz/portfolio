export const siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

export interface Profile {
  name: string;
  shortName: string;
  role: string;
  email: string;
  phone: string;
  phoneHref: string;
  location: string;
  employer: string;
  /** Leave empty to hide the link. */
  linkedin: string;
  /** Leave empty to hide the link. */
  github: string;
  intro: string;
  summary: string;
  /** Phrases that rotate after "I build" in the hero. */
  builds: string[];
}

export const profile: Profile = {
  name: "Muhammed Ilyas MK",
  shortName: "Ilyas MK",
  role: "Full Stack Developer",
  email: "ilyasibnusalam.mk@gmail.com",
  phone: "",
  phoneHref: "",
  location: "Malappuram, Kerala, India",
  employer: "D4DX Innovations LLP",
  linkedin: "",
  github: "",
  intro:
    "Full stack developer working with Next.js, React, Node.js, MongoDB, MySQL and Redis. I ship secure, fast web applications that real teams use every day.",
  summary:
    "I build scalable web applications with Next.js, React.js, Node.js, Express.js, MongoDB, MySQL and Redis. My work covers multi-role SaaS platforms, REST APIs, authentication systems and cloud-based document management, with AI-powered features, role-based access control and performance optimization where they matter. I care about secure, high-performance applications and keep learning modern web technologies to deliver better user experiences.",
  builds: ["SaaS platforms.", "REST APIs.", "AI features.", "admin dashboards.", "mobile backends."],
};

export interface Stat {
  value: number;
  label: string;
}

export const stats: Stat[] = [
  { value: 7, label: "Products live in production" },
  { value: 2, label: "Years building full stack" },
  { value: 6, label: "Languages served by one app" },
  { value: 5, label: "User roles in one SaaS" },
];


export interface Project {
  id: string;
  name: string;
  kind: string;
  description: string;
  points: string[];
  stack: string[];
  url: string;
  host: string;
  /** Brand colour of the product, used for the card glow. */
  accent: string;
  desktop: string;
  mobile: string;
  category: "SaaS & AI" | "Platforms & Media" | "ERP & Systems";
  featured?: boolean;
  /** Set for mobile apps: the media is an app slideshow instead of a site recording. */
  app?: { playStore: string; appStore: string };
}

export interface ProjectMedia {
  desktopVideo: string;
  desktopPoster: string;
  mobileVideo: string;
  mobilePoster: string;
}

/** Recorded videos live in /public/videos, named by project id. */
export function mediaFor(project: Project): ProjectMedia {
  if (project.app) {
    return {
      desktopVideo: "",
      desktopPoster: project.desktop,
      mobileVideo: `/videos/${project.id}-app.mp4`,
      mobilePoster: `/videos/${project.id}-app.webp`,
    };
  }
  return {
    desktopVideo: `/videos/${project.id}-desktop.mp4`,
    desktopPoster: `/videos/${project.id}-desktop.webp`,
    mobileVideo: `/videos/${project.id}-mobile.mp4`,
    mobilePoster: `/videos/${project.id}-mobile.webp`,
  };
}

export const projects: Project[] = [
  {
    id: "mployedin",
    name: "Mployedin",
    kind: "AI-powered recruitment and applicant tracking system",
    description:
      "A recruitment SaaS for Admin, Super Agent, Agent, Employer and Job Seeker roles, covering the whole path from job posting to onboarding.",
    points: [
      "RBAC with granular permissions and workflow approvals",
      "AI resume parsing, candidate-job matching and recommendations",
      "Redis caching and DigitalOcean Spaces with presigned URLs",
      "REST APIs, real-time messaging, notifications and dashboards",
    ],
    stack: ["Next.js", "Node.js", "Express.js", "MongoDB", "Redis", "RBAC", "REST APIs", "AI API Integration", "Resume Parsing", "Candidate Matching", "Job Recommendations", "DigitalOcean Spaces", "JWT Authentication"],
    url: "https://mployedin-app-jr8h5.ondigitalocean.app",
    host: "mployedin.app",
    accent: "#3b74ff",
    category: "SaaS & AI",
    featured: true,
    desktop: "/shots/mployedin-desktop.webp",
    mobile: "/shots/mployedin-mobile.webp",
  },
  {
    id: "thafheem",
    name: "Thafheemul Quran",
    kind: "Multi-language Quran application",
    description:
      "A Quran platform with translations and Tafsir in Malayalam, English, Arabic, Hindi, Urdu and Bangla, with streaming recitation from several Qari reciters.",
    points: [
      "MySQL architecture for Quran text, translations, Tafsir and metadata",
      "Multiple audio recitation sources behind one seamless player",
      "Optimized queries so every language stays smooth and responsive",
    ],
    stack: ["React.js", "Node.js", "MySQL", "SQL", "REST APIs"],
    url: "https://thafheem.net",
    host: "thafheem.net",
    accent: "#06b6d4",
    category: "Platforms & Media",
    featured: true,
    desktop: "/shots/thafheem-desktop.webp",
    mobile: "/shots/thafheem-mobile.webp",
  },
  {
    id: "zaitoon",
    name: "Zaitoon Kids",
    kind: "Kids streaming and storytelling platform for iOS and Android",
    description:
      "Backend services for a kids streaming and storytelling app that serves video, images, PDFs and learning content across mobile devices.",
    points: [
      "REST APIs for managing videos, images, PDFs and lessons from the admin panel",
      "Content delivery and media management for large libraries",
      "Quiz, activity submission and engagement modules",
      "Backend architecture sized for concurrent mobile users",
    ],
    stack: ["Node.js", "Express.js", "MongoDB", "REST APIs"],
    url: "https://play.google.com/store/apps/details?id=co.d4dx.zaitoon",
    host: "Google Play",
    accent: "#a855f7",
    category: "Platforms & Media",
    featured: true,
    desktop: "/shots/zaitoon-desktop.webp",
    mobile: "/shots/zaitoon-mobile.webp",
    app: {
      playStore: "https://play.google.com/store/apps/details?id=co.d4dx.zaitoon",
      appStore: "https://apps.apple.com/in/app/zai-toon-kids/id6737912105",
    },
  },
  {
    id: "zaad",
    name: "ZAAD",
    kind: "Mahallu community and family management ERP",
    description:
      "A community management platform on the MERN stack for families, members, beneficiaries and administration.",
    points: [
      "Family management, committee administration and relationship tracking",
      "Finance and welfare: accounting, Zakat, claims and Qard Hasan loans",
      "Nikah registration, death records, NOCs and asset management",
      "Institutes, employees, salaries, notifications and reporting",
    ],
    stack: ["React.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "RBAC", "DigitalOcean"],
    url: "https://zaad.info",
    host: "zaad.info",
    accent: "#10b981",
    category: "ERP & Systems",
    featured: true,
    desktop: "/shots/zaad-desktop.webp",
    mobile: "/shots/zaad-mobile.webp",
  },
  {
    id: "lockshield",
    name: "Lockshield.ae",
    kind: "Fire protection solutions website",
    description:
      "A responsive Next.js business website for a fire protection and safety company, with an admin dashboard that manages the content.",
    points: [
      "Backend and admin dashboard for content and frontend updates",
      "MongoDB content storage, Cloudflare R2 media, Netlify hosting",
      "SEO: page metadata, indexing support and structured content",
      "GEO work for discoverability in AI-powered search",
    ],
    stack: ["Next.js", "MongoDB", "Cloudflare R2", "Netlify", "Technical SEO", "On-Page SEO", "Next.js Metadata", "XML Sitemaps", "Structured Data (JSON-LD)", "Search Engine Indexing"],
    url: "https://lockshield.ae",
    host: "lockshield.ae",
    accent: "#f43f5e",
    category: "SaaS & AI",
    desktop: "/shots/lockshield-desktop.webp",
    mobile: "/shots/lockshield-mobile.webp",
  },
  {
    id: "bodhanam",
    name: "Bodhanam",
    kind: "Malayalam quarterly research journal",
    description:
      "The online home of a Malayalam Islamic quarterly research journal, with the latest issue, cover stories, archives and an index of authors.",
    points: ["Issue, article and author browsing with search", "Archive of past volumes", "Light and dark reading modes"],
    stack: ["React.js", "Node.js", "Express.js", "MongoDB", "REST APIs"],
    url: "https://bodhanam.net",
    host: "bodhanam.net",
    accent: "#f59e0b",
    category: "Platforms & Media",
    desktop: "/shots/bodhanam-desktop.webp",
    mobile: "/shots/bodhanam-mobile.webp",
  },
  {
    id: "d4erp",
    name: "D4 Media ERP",
    kind: "Internal operations ERP",
    description:
      "An ERP for teams, finance, attendance and system controls, with separate admin and staff portals and role-secured access.",
    points: ["Admin, department and accounts views kept segmented", "Installable from the browser as an app"],
    stack: ["React.js", "Node.js", "Express.js", "MongoDB", "RBAC", "REST APIs"],
    url: "https://d4-erp.d4dx.co",
    host: "d4-erp.d4dx.co",
    accent: "#6366f1",
    category: "ERP & Systems",
    desktop: "/shots/d4erp-desktop.webp",
    mobile: "/shots/d4erp-mobile.webp",
  },
];

export interface SkillGroup {
  label: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  { label: "Languages", skills: ["JavaScript (ES6+)", "TypeScript", "SQL"] },
  { label: "Frontend", skills: ["React.js", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Redux Toolkit"] },
  { label: "Backend", skills: ["Node.js", "Express.js", "REST APIs", "JWT Authentication", "RBAC"] },
  { label: "Database", skills: ["MongoDB", "MySQL", "Redis"] },
  { label: "Cloud and DevOps", skills: ["DigitalOcean", "DigitalOcean Spaces", "Cloudflare R2", "Netlify", "Vercel"] },
  {
    label: "AI and integrations",
    skills: ["OpenRouter", "Google Gemini", "Muse", "AI API Integration", "Resume Parsing", "Candidate Matching", "Job Recommendations"],
  },
  {
    label: "SEO",
    skills: ["Technical SEO", "On-Page SEO", "Next.js Metadata", "XML Sitemaps", "Structured Data (JSON-LD)", "Search Engine Indexing"],
  },
  { label: "Tools", skills: ["Git", "GitHub", "VS Code", "Postman"] },
];

export const marquee: string[] = [
  "Next.js",
  "React.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "MySQL",
  "Redis",
  "TypeScript",
  "Tailwind CSS",
  "REST APIs",
  "RBAC",
  "DigitalOcean",
  "Cloudflare R2",
  "Google Gemini",
];

export interface Job {
  title: string;
  org: string;
  place: string;
  when: string;
  points: string[];
}

export const jobs: Job[] = [
  {
    title: "MERN Stack Developer",
    org: "D4DX Innovations LLP",
    place: "Calicut, India",
    when: "09/2025 – Present",
    points: [
      "Develop and maintain full-stack web applications with Next.js, React.js, Node.js, Express.js, MongoDB and MySQL.",
      "Contribute to an AI-powered recruitment platform with RBAC, candidate management, job workflows and document management.",
      "Build and optimize RESTful APIs, authentication mechanisms and database operations for scalability and performance.",
      "Integrate Redis caching and cloud storage for performance and secure document handling.",
      "Build multilingual content management, audio integrations and AI-assisted user experiences across several applications.",
      "Work with UI/UX designers and cross-functional teams on responsive, accessible, high-performance applications.",
    ],
  },
  {
    title: "Full Stack Intern",
    org: "TechMaghi",
    place: "Kochi, Kerala",
    when: "07/2024 – 01/2025",
    points: [
      "Developed full-stack features with React.js, Node.js, Express.js and MongoDB.",
      "Built admin and user dashboards for real estate listings, offers and property information.",
      "Implemented secure CRUD operations, authentication workflows and role-based access controls.",
      "Designed and integrated RESTful APIs between front-end and back-end systems.",
      "Built responsive interfaces and optimized database queries for performance.",
      "Collaborated with senior developers on scalable, maintainable features.",
    ],
  },
];

export interface School {
  title: string;
  org: string;
  place: string;
  when: string;
}

export const education: School[] = [
  {
    title: "B-Tech, Computer Science and Engineering",
    org: "Ponnaiyah Ramajayam Institute of Science & Technology",
    place: "Tamil Nadu",
    when: "06/2021 – 07/2025",
  },
  { title: "MERN Stack Development", org: "TechMaghi", place: "Kochi, Kerala", when: "07/2024 – 06/2025" },
  { title: "Higher Secondary Education", org: "GJHSS Naduvattom", place: "Palakkad", when: "2018 – 2020" },
];

export const certificates: string[] = ["Application Development using Flutter", "Cyber Security and Ethical Hacking Workshop"];
