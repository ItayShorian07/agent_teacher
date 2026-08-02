import sharp from "sharp";
import { fileURLToPath } from "node:url";

const svg = `
<svg width="1600" height="1000" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1000" fill="#f7f8f5"/>
  <circle cx="1450" cy="80" r="260" fill="#e6edff"/>
  <circle cx="70" cy="940" r="230" fill="#ffe9e2"/>
  <text x="90" y="90" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0d5f4b" letter-spacing="3">ADAPTIVE AI TEACHER</text>
  <text x="90" y="155" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#102032">Dynamic ReAct Architecture</text>
  <text x="90" y="198" font-family="Arial, sans-serif" font-size="22" fill="#647184">No fixed path · The supervisor chooses one action on every turn</text>

  <rect x="90" y="310" width="275" height="145" rx="28" fill="#102032"/>
  <text x="227" y="365" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="white">Student</text>
  <text x="227" y="402" text-anchor="middle" font-family="Arial" font-size="18" fill="#c8d3df">Text · replies · interests</text>

  <path d="M365 382 H535" stroke="#ff6b4a" stroke-width="8"/>
  <polygon points="535,382 505,364 505,400" fill="#ff6b4a"/>
  <path d="M535 430 H365" stroke="#8a98a8" stroke-width="5" stroke-dasharray="10 10"/>
  <polygon points="365,430 395,412 395,448" fill="#8a98a8"/>

  <rect x="535" y="270" width="470" height="230" rx="38" fill="#0d5f4b"/>
  <text x="770" y="338" text-anchor="middle" font-family="Arial" font-size="34" font-weight="800" fill="white">LearningSupervisor</text>
  <text x="770" y="382" text-anchor="middle" font-family="Arial" font-size="20" fill="#dff2e9">Observe → reason → choose one action</text>
  <line x1="610" y1="414" x2="930" y2="414" stroke="#65a995" stroke-width="2"/>
  <text x="770" y="452" text-anchor="middle" font-family="Arial" font-size="18" fill="white">Stops on mastery, request, or 16 LLM calls</text>

  <path d="M1005 382 H1175" stroke="#ff6b4a" stroke-width="8"/>
  <polygon points="1175,382 1145,364 1145,400" fill="#ff6b4a"/>
  <path d="M1175 430 H1005" stroke="#8a98a8" stroke-width="5" stroke-dasharray="10 10"/>
  <polygon points="1005,430 1035,412 1035,448" fill="#8a98a8"/>

  <rect x="1175" y="310" width="335" height="145" rx="28" fill="white" stroke="#ccd6dd" stroke-width="3"/>
  <text x="1342" y="365" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="#102032">Temporary Memory</text>
  <text x="1342" y="402" text-anchor="middle" font-family="Arial" font-size="18" fill="#647184">Material · interests · mastery</text>

  <path d="M770 500 V590" stroke="#ff6b4a" stroke-width="8"/>
  <polygon points="770,610 752,580 788,580" fill="#ff6b4a"/>
  <text x="790" y="557" font-family="Arial" font-size="16" font-weight="700" fill="#647184">SELECTED TOOL</text>

  <g font-family="Arial" font-size="21" font-weight="700" fill="#102032">
    <rect x="90" y="650" width="310" height="95" rx="20" fill="white" stroke="#ccd6dd" stroke-width="2"/><text x="245" y="706" text-anchor="middle">AskInterests</text>
    <rect x="420" y="650" width="310" height="95" rx="20" fill="white" stroke="#ccd6dd" stroke-width="2"/><text x="575" y="706" text-anchor="middle">AnalyzeMaterial</text>
    <rect x="750" y="650" width="310" height="95" rx="20" fill="white" stroke="#ccd6dd" stroke-width="2"/><text x="905" y="706" text-anchor="middle">ExplainMaterial</text>
    <rect x="1080" y="650" width="310" height="95" rx="20" fill="#dff2e9" stroke="#0d5f4b" stroke-width="2"/><text x="1235" y="706" text-anchor="middle">StoryTool</text>
    <rect x="255" y="770" width="310" height="95" rx="20" fill="white" stroke="#ccd6dd" stroke-width="2"/><text x="410" y="826" text-anchor="middle">QuestionTool</text>
    <rect x="585" y="770" width="310" height="95" rx="20" fill="#e6edff" stroke="#2d5bff" stroke-width="2"/><text x="740" y="826" text-anchor="middle">AnswerEvaluator</text>
    <rect x="915" y="770" width="310" height="95" rx="20" fill="white" stroke="#ccd6dd" stroke-width="2"/><text x="1070" y="826" text-anchor="middle">RespondDirectly</text>
    <rect x="1245" y="770" width="265" height="95" rx="20" fill="#102032"/><text x="1377" y="826" text-anchor="middle" fill="white">Stop</text>
  </g>
  <text x="90" y="950" font-family="Arial" font-size="18" fill="#647184">Source policy: supplied material is authoritative; general model knowledge may enrich but never override it.</text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(fileURLToPath(new URL("../public/model-architecture.png", import.meta.url)));

const favicon = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" rx="36" fill="#102032"/><circle cx="91" cy="37" r="42" fill="#2d5bff" opacity=".55"/><text x="64" y="82" text-anchor="middle" font-family="Arial" font-size="62" font-weight="800" fill="white">A</text></svg>`;
await sharp(Buffer.from(favicon))
  .png()
  .toFile(fileURLToPath(new URL("../public/favicon.png", import.meta.url)));
