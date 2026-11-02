import { useEffect, useMemo, useState } from "react"

type Keyword = { label: string; matched: boolean }
type QualityItem = { label: string; value: string }
type Analysis = {
  score: number
  keywords: Keyword[]
  quality: QualityItem[]
  resumeText: string
  summary?: string
  recommendations?: string[]
  ai: boolean
}
type ServerStatus = { aiEnabled: boolean; model: string }
type AiResponse = {
  summary: string
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  recommendations: string[]
  tailoredResume: string
}

const sampleJob = `Pessoa Desenvolvedora Front-end Jr — React e TypeScript

Estamos buscando uma pessoa desenvolvedora front-end para criar interfaces digitais acessíveis, responsivas e de alta qualidade.

Responsabilidades:
• Desenvolver interfaces com React e TypeScript
• Criar componentes reutilizáveis e colaborar com design no Figma
• Integrar APIs REST e trabalhar com Git em equipe
• Garantir responsividade, acessibilidade e qualidade de código

Requisitos:
• HTML, CSS, JavaScript, React e TypeScript
• Familiaridade com testes automatizados e metodologias ágeis
• Comunicação, trabalho em equipe e vontade de aprender
• Diferencial: Next.js, design systems e testes com Jest`

const sampleResume = `ALBERICO JUNIOR
Desenvolvedor Front-end Jr
Recife, PE | alberico@email.com | linkedin.com/in/albericojr | github.com/albericojr

RESUMO PROFISSIONAL
Estudante de Sistemas de Informação com experiência em projetos pessoais de desenvolvimento web e mobile. Interesse em criar interfaces intuitivas e acessíveis, trabalhando com React, JavaScript e TypeScript.

PROJETOS
Portfólio pessoal — React, Next.js, Tailwind CSS
Desenvolvimento de site responsivo para apresentar projetos, habilidades e canais de contato.

Aplicativo UpFit — React Native, Expo, TypeScript
Aplicativo de acompanhamento de treinos com autenticação, registro de progresso e modo escuro.

HABILIDADES
React, JavaScript, TypeScript, HTML, CSS, Next.js, React Native, Git, GitHub, Figma, Tailwind CSS

FORMAÇÃO
Sistemas de Informação — Em andamento`

const canonical: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  reactnative: "React Native",
  html: "HTML",
  css: "CSS",
  git: "Git / GitHub",
  figma: "Figma",
  acessibilidade: "Acessibilidade",
  responsividade: "Responsividade",
  api: "APIs REST",
  testes: "Testes automatizados",
  nextjs: "Next.js",
  comunicacao: "Comunicação",
  equipe: "Trabalho em equipe",
  agil: "Metodologias ágeis",
  designsystem: "Design system",
  componentes: "Componentes reutilizáveis",
  java: "Java",
  python: "Python",
  sql: "SQL",
  node: "Node.js",
  lideranca: "Liderança",
  gestao: "Gestão de projetos",
  ingles: "Inglês",
  cloud: "Cloud",
}
const synonyms: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js", "reactjs"],
  reactnative: ["react native", "react-native"],
  html: ["html", "html5"],
  css: ["css", "css3", "tailwind css", "sass"],
  git: ["git", "github", "versionamento"],
  figma: ["figma"],
  acessibilidade: ["acessibilidade", "accessibility", "wcag", "a11y"],
  responsividade: ["responsividade", "responsivo", "responsive"],
  api: ["apis rest", "api rest", "rest api", "apis", "integração de api"],
  testes: ["testes automatizados", "testes", "jest", "testing"],
  nextjs: ["next.js", "nextjs"],
  comunicacao: ["comunicação", "comunicação clara"],
  equipe: ["trabalho em equipe", "equipe", "colaboração"],
  agil: ["metodologias ágeis", "ágil", "scrum", "kanban"],
  designsystem: ["design system", "design systems"],
  componentes: ["componentes reutilizáveis", "componentes"],
  java: ["java"],
  python: ["python"],
  sql: ["sql"],
  node: ["node.js", "nodejs", "node"],
  lideranca: ["liderança", "liderar"],
  gestao: ["gestão de projetos", "gestão"],
  ingles: ["inglês", "english"],
  cloud: ["aws", "azure", "cloud"],
}
const stopWords = new Set(
  "a ao aos as o os de da das do dos em na nas no nos por para com sem sob sobre e ou que se um uma umas uns sua seu suas seus como mais menos muito pela pelo pelas pelos este esta esse essa isso ele ela eles elas ser ter estar foi são está estão tem temos será pode podem experiência anos ano conhecimento domínio desejável diferencial buscamos pessoa profissional responsabilidades requisitos qualificações trabalho vaga perfil habilidade habilidades cursando formado superior graduação".split(
    " ",
  ),
)

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}
function tokenize(value: string): string[] {
  return normalize(value)
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
}
function findKeywords(job: string, resume: string): Keyword[] {
  const jobText = normalize(job)
  const resumeText = normalize(resume)
  const found = Object.keys(canonical).filter((key) =>
    (synonyms[key] ?? [key]).some((alias) =>
      jobText.includes(normalize(alias)),
    ),
  )
  const tokens = tokenize(job)
  const frequency = new Map<string, number>()
  tokens.forEach((word, index) => {
    if (word.length < 4) return
    const next = tokens[index + 1]
    if (next && !stopWords.has(next)) {
      const phrase = `${word} ${next}`
      frequency.set(phrase, (frequency.get(phrase) ?? 0) + 1)
    }
  })
  const repeated = [...frequency.entries()]
    .filter(
      ([term, count]) =>
        count > 1 && !found.some((key) => normalize(canonical[key]) === term),
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([term]) => term)
  const keys = [...new Set([...found, ...repeated])].slice(0, 18)
  return keys.map((key) => {
    const label =
      canonical[key] ??
      key.replace(/\b\w/g, (character) => character.toUpperCase())
    const aliases = synonyms[key] ?? [key]
    return {
      label,
      matched:
        aliases.some((alias) => resumeText.includes(normalize(alias))) ||
        resumeText.includes(normalize(label)),
    }
  })
}
function tailorLocally(resume: string, keywords: Keyword[]): string {
  const lines = resume.split(/\r?\n/)
  const matchedTerms = keywords
    .filter((keyword) => keyword.matched)
    .map((keyword) => normalize(keyword.label))
  const highlighted = lines
    .map((line, index) => ({
      line: line.trim(),
      index,
      score: matchedTerms.reduce(
        (total, term) => total + (normalize(line).includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.line && item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8)
    .sort((a, b) => a.index - b.index)
  const header = lines.filter(Boolean).slice(0, 2)
  const highlights = highlighted.length
    ? highlighted.map((item) => `• ${item.line}`).join("\n")
    : "Nenhum trecho foi destacado automaticamente. Revise os requisitos manualmente."
  return `${header.join("\n")}\n\nDESTAQUES RELEVANTES PARA ESTA VAGA\n${highlights}\n\nCURRÍCULO COMPLETO\n${lines.slice(2).join("\n").trim()}`.trim()
}
function qualityItems(resume: string, confirmedCount: number): QualityItem[] {
  const normalized = normalize(resume)
  const sections = [
    ["resumo", ["resumo", "objetivo", "perfil profissional"]],
    ["experiência e projetos", ["experiencia", "projetos"]],
    ["formação", ["formacao", "educacao"]],
    ["habilidades", ["habilidades", "competencias", "skills"]],
    ["informações adicionais", ["idiomas", "certificacoes"]],
  ] as const
  const sectionCount = sections.filter(([, aliases]) =>
    aliases.some((alias) => normalized.includes(normalize(alias))),
  ).length
  const words = tokenize(resume).length
  const contact =
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(resume) ||
    /\+?\d[\d\s().-]{7,}/.test(resume)
  const verbs = (
    resume.match(
      /\b(desenvolvi|implementei|criei|liderei|reduzi|aumentei|otimizei|entreguei|coordenei|construí|construi|gerenciei|automatizei)\b/gi,
    ) ?? []
  ).length
  const numbers = (resume.match(/\b\d+(?:[.,]\d+)?\s*%?/g) ?? []).length
  return [
    { label: "Seções reconhecíveis", value: `${sectionCount} de 5` },
    {
      label: "Informações de contato",
      value: contact ? "Localizadas" : "Não localizadas",
    },
    { label: "Verbos de ação", value: String(verbs) },
    { label: "Números e resultados", value: String(numbers) },
    { label: "Volume de conteúdo", value: `${words} palavras` },
    { label: "Requisitos validados por você", value: String(confirmedCount) },
  ]
}

function App() {
  const [job, setJob] = useState("")
  const [resume, setResume] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [aiStatus, setAiStatus] = useState<ServerStatus>({
    aiEnabled: false,
    model: "",
  })
  const [busy, setBusy] = useState<"local" | "ai" | "import" | "pdf" | null>(
    null,
  )
  const [fileMessage, setFileMessage] = useState(
    "Até 8 MB · PDF com texto selecionável",
  )
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [toastTick, setToastTick] = useState(0)
  const quality = useMemo(
    () => (analysis ? qualityItems(resume, confirmed.length) : []),
    [analysis, resume, confirmed.length],
  )

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((data: ServerStatus) => setAiStatus(data))
      .catch(() => setAiStatus({ aiEnabled: false, model: "" }))
  }, [])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        }),
      { threshold: 0.12 },
    )
    document
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timer)
  }, [toast, toastTick])

  function notify(message: string) {
    setToast(message)
    setToastTick((value) => value + 1)
  }
  function loadExample() {
    setJob(sampleJob)
    setResume(sampleResume)
    setFileMessage("Exemplo carregado · revise antes de analisar")
    notify("Exemplo preenchido. Agora é só analisar.")
  }
  function validateInputs(): boolean {
    if (!job.trim() || !resume.trim()) {
      notify("Cole a descrição da vaga e o currículo para continuar.")
      return false
    }
    if (job.trim().length < 40) {
      notify("Cole uma descrição de vaga um pouco mais completa.")
      return false
    }
    if (resume.trim().length < 35) {
      notify("Adicione mais conteúdo do currículo para analisar.")
      return false
    }
    return true
  }
  function analyzeLocally() {
    if (!validateInputs()) return
    setBusy("local")
    window.setTimeout(() => {
      const keywords = findKeywords(job, resume)
      const matches = keywords.filter((keyword) => keyword.matched).length
      const base = keywords.length
        ? Math.round((matches / keywords.length) * 100)
        : 0
      const score = Math.min(
        98,
        Math.max(
          8,
          Math.round(
            base * 0.86 + Math.min(tokenize(resume).length / 280, 1) * 14,
          ),
        ),
      )
      setConfirmed([])
      setAnalysis({
        score,
        keywords,
        quality: qualityItems(resume, 0),
        resumeText: tailorLocally(resume, keywords),
        ai: false,
      })
      setBusy(null)
      document
        .querySelector("#results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 350)
  }
  async function analyzeWithAi() {
    if (!validateInputs()) return
    setBusy("ai")
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, resume }),
      })
      const data = (await response.json()) as AiResponse & { error?: string }
      if (!response.ok)
        throw new Error(data.error || "A análise com IA não ficou disponível.")
      const keywords = [
        ...(data.matchedSkills || []).map((label) => ({
          label,
          matched: true,
        })),
        ...(data.missingSkills || []).map((label) => ({
          label,
          matched: false,
        })),
      ]
      setConfirmed([])
      setAnalysis({
        score: data.score,
        keywords,
        quality: qualityItems(resume, 0),
        resumeText: data.tailoredResume,
        summary: data.summary,
        recommendations: data.recommendations,
        ai: true,
      })
      document
        .querySelector("#results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
      notify("Análise concluída. Confira cada evidência antes de usar.")
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Confira se o servidor e a chave de IA estão configurados.",
      )
    } finally {
      setBusy(null)
    }
  }
  async function importJob() {
    if (!jobUrl.trim()) {
      notify("Cole o link público da vaga.")
      return
    }
    setBusy("import")
    try {
      const response = await fetch("/api/import-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      })
      const data = (await response.json()) as {
        title: string
        description: string
        source: string
        error?: string
      }
      if (!response.ok)
        throw new Error(data.error || "Não foi possível importar esta vaga.")
      setJob(data.description.slice(0, 12000))
      notify(
        `Vaga importada do ${data.source}. Revise o texto antes da análise.`,
      )
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível importar a vaga.",
      )
    } finally {
      setBusy(null)
    }
  }
  async function importPdf(file?: File) {
    if (!file) return
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setFileMessage("Selecione um arquivo PDF.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setFileMessage("O arquivo excede o limite de 8 MB.")
      return
    }
    setBusy("pdf")
    setFileMessage("Extraindo texto localmente…")
    try {
      const [{ default: workerUrl }, pdfjsLib] = await Promise.all([
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        import("pdfjs-dist"),
      ])
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      }).promise
      if (pdf.numPages > 60) throw new Error("O PDF pode ter até 60 páginas.")
      const pages: string[] = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        type PositionedTextItem = (typeof content.items)[number] & {
          str: string
          transform: number[]
        }
        const items = content.items
          .filter(
            (item): item is PositionedTextItem =>
              "str" in item &&
              typeof item.str === "string" &&
              Boolean(item.str.trim()) &&
              "transform" in item &&
              Array.isArray(item.transform),
          )
          .sort((a, b) =>
            Math.abs(b.transform[5] - a.transform[5]) > 2
              ? b.transform[5] - a.transform[5]
              : a.transform[4] - b.transform[4],
          )
        const lines: string[] = []
        let y: number | null = null
        let line = ""
        for (const item of items) {
          if (y !== null && Math.abs(y - item.transform[5]) > 2) {
            if (line.trim()) lines.push(line.trim())
            line = ""
          }
          y = item.transform[5]
          line += `${line ? " " : ""}${item.str}`
        }
        if (line.trim()) lines.push(line.trim())
        pages.push(lines.join("\n"))
        if (pages.join("\n").length > 24000) break
      }
      const extracted = pages.join("\n\n").trim()
      if (!extracted)
        throw new Error(
          "Não encontrei texto selecionável. PDFs digitalizados precisam de OCR.",
        )
      setResume(extracted.slice(0, 24000))
      setFileMessage(`PDF lido · ${pdf.numPages} páginas · confira a extração`)
      notify(
        "Texto extraído no navegador. Revise a formatação antes de analisar.",
      )
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ler este PDF.",
      )
    } finally {
      setBusy(null)
    }
  }
  async function copyResume() {
    if (!analysis) return
    try {
      await navigator.clipboard.writeText(analysis.resumeText)
      notify("Currículo copiado para a área de transferência.")
    } catch {
      notify("Não foi possível copiar. Selecione e copie o texto manualmente.")
    }
  }
  function printResume() {
    if (!analysis) return
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) {
      notify("Permita a janela de impressão para salvar em PDF.")
      return
    }
    printWindow.document.write(
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Currículo personalizado</title><style>@page{size:A4;margin:18mm}body{font:11pt/1.65 Arial,sans-serif;color:#202332}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font:700 10pt Arial;color:#6b55e9;margin-bottom:20px}.notice{font:9pt Arial;color:#687767;border-top:1px solid #ddd;padding-top:10px;margin-top:20px}</style></head><body><h1>CURRÍCULO · VERSÃO PERSONALIZADA</h1><pre></pre><div class="notice">Trechos selecionados do currículo fornecido. Revise os dados antes de enviar.</div></body></html>',
    )
    printWindow.document.close()
    const pre = printWindow.document.querySelector("pre")
    if (pre) pre.textContent = analysis.resumeText
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
  }
  function toggleConfirmed(term: string) {
    setConfirmed((current) =>
      current.includes(term)
        ? current.filter((item) => item !== term)
        : [...current, term],
    )
  }

  const matched = analysis?.keywords.filter((keyword) => keyword.matched) ?? []
  const missing = analysis?.keywords.filter((keyword) => !keyword.matched) ?? []

  return (
    <>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Matcha, início">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M7 23.5 12 8l4 10 4-7 5 12.5" />
              <path d="M8 24h16" />
            </svg>
          </span>
          <span>
            matcha<span className="brand-dot">.</span>
          </span>
        </a>
        <nav
          className={`nav-links ${menuOpen ? "open" : ""}`}
          aria-label="Navegação principal"
        >
          <a href="#como-funciona" onClick={() => setMenuOpen(false)}>
            Como funciona
          </a>
          <a href="#analise" onClick={() => setMenuOpen(false)}>
            Analisar currículo
          </a>
          <a href="#privacidade" onClick={() => setMenuOpen(false)}>
            Privacidade
          </a>
        </nav>
        <a className="nav-cta" href="#analise">
          Começar grátis <span>↗</span>
        </a>
        <button
          className="menu-toggle"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i />
          <i />
        </button>
      </header>

      <main>
        <section className="hero section-shell" id="inicio">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <span className="eyebrow-pulse" /> SUA PRÓXIMA OPORTUNIDADE, COM
              MAIS CLAREZA
            </div>
            <h1>
              Seu talento merece
              <br />
              passar pela{" "}
              <span className="headline-highlight">primeira triagem.</span>
            </h1>
            <p className="hero-lede">
              Compare sua experiência com a vaga, encontre palavras-chave e
              prepare uma versão mais direcionada do currículo.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#analise">
                Analisar meu currículo <span>→</span>
              </a>
              <a className="button button-quiet" href="#como-funciona">
                <span className="play-icon">▶</span> Entenda em 1 minuto
              </a>
            </div>
            <div className="trust-row">
              <div className="avatar-stack">
                <span>A</span>
                <span>M</span>
                <span>J</span>
                <span>+</span>
              </div>
              <div>
                <strong>Mais clareza em cada candidatura</strong>
                <small>Simples, privado e sem promessas mágicas.</small>
              </div>
            </div>
          </div>
          <div
            className="hero-art reveal delay-1"
            aria-label="Prévia de uma análise de currículo"
          >
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <div className="floating-tag tag-one">
              <span className="tag-check">✓</span> Palavras-chave mapeadas
            </div>
            <div className="floating-tag tag-two">
              <span className="tag-spark">✦</span> Perfil em destaque
            </div>
            <div className="preview-card">
              <div className="preview-head">
                <div>
                  <span className="mini-label">ANÁLISE DE COMPATIBILIDADE</span>
                  <strong>Product Designer</strong>
                </div>
                <span className="more-dots">•••</span>
              </div>
              <div className="score-row">
                <div className="score-ring">
                  <div className="ring-inner">
                    <strong>78</strong>
                    <small>/100</small>
                  </div>
                </div>
                <div className="score-copy">
                  <strong>Um ótimo começo</strong>
                  <span>Seu perfil conversa com a vaga.</span>
                  <div className="mini-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <div className="preview-divider" />
              <div className="preview-key-head">
                <span>PALAVRAS-CHAVE</span>
                <span>8 de 11 encontradas</span>
              </div>
              <div className="keyword-cloud">
                <span className="kw kw-ok">Figma</span>
                <span className="kw kw-ok">UX research</span>
                <span className="kw kw-ok">Prototipação</span>
                <span className="kw kw-ok">Design system</span>
                <span className="kw kw-miss">Acessibilidade</span>
              </div>
              <div className="preview-footer">
                <span className="shield-icon">◇</span> Sua experiência continua
                sendo sua.
              </div>
            </div>
            <div className="sparkle sparkle-a">✳</div>
            <div className="sparkle sparkle-b">✦</div>
          </div>
          <a href="#como-funciona" className="scroll-hint">
            <span /> ROLE PARA DESCOBRIR
          </a>
        </section>
        <section className="proof-strip" aria-label="Benefícios">
          <div>
            <span className="proof-icon">✦</span> Análise instantânea
          </div>
          <div>
            <span className="proof-icon">⌘</span> Sem cadastro
          </div>
          <div>
            <span className="proof-icon">♧</span> PDFs e vagas públicas
          </div>
          <div>
            <span className="proof-icon">↗</span> Currículo personalizado
          </div>
        </section>
        <section className="how-section section-shell" id="como-funciona">
          <div className="section-heading reveal">
            <span className="eyebrow">SEM COMPLICAÇÃO</span>
            <h2>
              Um bom match começa
              <br />
              com <span className="text-accent">três passos.</span>
            </h2>
            <p>Uma leitura estratégica do que você já sabe fazer.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card reveal">
              <div className="step-top">
                <span className="step-number">01</span>
                <span className="step-icon icon-violet">↳</span>
              </div>
              <h3>Traga a vaga</h3>
              <p>
                Cole a descrição ou importe uma publicação pública do Greenhouse
                ou Lever.
              </p>
              <div className="step-line">
                <span style={{ width: "34%" }} />
              </div>
            </article>
            <article className="step-card reveal delay-1">
              <div className="step-top">
                <span className="step-number">02</span>
                <span className="step-icon icon-mint">⌕</span>
              </div>
              <h3>Compare seu perfil</h3>
              <p>
                Veja competências evidenciadas, requisitos não localizados e
                pontos de estrutura.
              </p>
              <div className="step-line">
                <span style={{ width: "66%" }} />
              </div>
            </article>
            <article className="step-card reveal delay-2">
              <div className="step-top">
                <span className="step-number">03</span>
                <span className="step-icon icon-peach">✧</span>
              </div>
              <h3>Prepare sua versão</h3>
              <p>
                Priorize trechos relevantes sem criar experiências, resultados
                ou habilidades.
              </p>
              <div className="step-line">
                <span style={{ width: "100%" }} />
              </div>
            </article>
          </div>
        </section>

        <section className="analyzer-section" id="analise">
          <div className="section-shell analyzer-shell">
            <div className="analyzer-title reveal">
              <div>
                <span className="eyebrow">SUA ANÁLISE COMEÇA AQUI</span>
                <h2>
                  Vamos encontrar
                  <br />o seu{" "}
                  <span className="text-accent">próximo match.</span>
                </h2>
              </div>
              <div className="step-status">
                <span className="status-dot" />{" "}
                {busy ? "Processando…" : "Pronto para analisar"}
              </div>
            </div>
            <div className="workspace reveal delay-1">
              <div className="workspace-top">
                <div className="workspace-label">
                  <span className="workspace-glyph">✳</span>
                  <div>
                    <strong>Nova análise</strong>
                    <small>
                      Modo local ou análise semântica opcional com IA.
                    </small>
                  </div>
                </div>
                <button className="sample-button" onClick={loadExample}>
                  <span>✦</span> Usar exemplo
                </button>
              </div>
              <div className="input-grid">
                <div className="text-panel">
                  <label htmlFor="job-input">
                    <span className="panel-label">
                      <span className="panel-index">01</span> DESCRIÇÃO DA VAGA{" "}
                      <span className="required">*</span>
                    </span>
                  </label>
                  <span className="panel-hint">
                    Cole a vaga ou importe uma publicação do Greenhouse ou
                    Lever.
                  </span>
                  <div className="job-import">
                    <input
                      id="job-url"
                      type="url"
                      value={jobUrl}
                      onChange={(event) => setJobUrl(event.target.value)}
                      placeholder="https://jobs.lever.co/empresa/..."
                      aria-label="Link público da vaga"
                    />
                    <button
                      className="mini-action"
                      disabled={busy === "import"}
                      onClick={importJob}
                    >
                      {busy === "import" ? "Importando…" : "Importar"}
                    </button>
                  </div>
                  <textarea
                    id="job-input"
                    value={job}
                    onChange={(event) =>
                      setJob(event.target.value.slice(0, 12000))
                    }
                    placeholder="Ou cole os requisitos e responsabilidades da vaga..."
                    maxLength={12000}
                  />
                  <span className="panel-foot">
                    {job.length.toLocaleString("pt-BR")} / 12.000 caracteres
                  </span>
                </div>
                <div className="text-panel">
                  <label htmlFor="resume-input">
                    <span className="panel-label">
                      <span className="panel-index">02</span> SEU CURRÍCULO{" "}
                      <span className="required">*</span>
                    </span>
                  </label>
                  <span className="panel-hint">
                    Cole o texto ou importe um PDF. A extração ocorre no
                    navegador.
                  </span>
                  <label className="file-drop" htmlFor="resume-file">
                    <span className="file-symbol">↑</span>
                    <span>
                      <strong>Escolher arquivo PDF</strong>
                      <small>{fileMessage}</small>
                    </span>
                    <input
                      id="resume-file"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) =>
                        void importPdf(event.target.files?.[0])
                      }
                    />
                  </label>
                  <textarea
                    id="resume-input"
                    value={resume}
                    onChange={(event) =>
                      setResume(event.target.value.slice(0, 24000))
                    }
                    placeholder="Cole seu currículo aqui: resumo, experiências, formação, habilidades..."
                    maxLength={24000}
                  />
                  <span className="panel-foot">
                    {resume.length.toLocaleString("pt-BR")} / 24.000 caracteres
                  </span>
                </div>
              </div>
              <div className="workspace-bottom">
                <span className="privacy-note">
                  <span>♧</span> No modo local, os textos ficam neste navegador.
                  A opção IA envia os textos ao serviço configurado.
                </span>
                <div className="analysis-actions">
                  <button
                    className="button button-outline"
                    disabled={!aiStatus.aiEnabled || busy !== null}
                    title={
                      aiStatus.aiEnabled
                        ? `Usa ${aiStatus.model}`
                        : "Configure OPENAI_API_KEY no servidor para habilitar"
                    }
                    onClick={analyzeWithAi}
                  >
                    {busy === "ai"
                      ? "Analisando com IA…"
                      : aiStatus.aiEnabled
                        ? "✦ Analisar com IA"
                        : "✦ IA não configurada"}
                  </button>
                  <button
                    className="button button-primary analyze-button"
                    disabled={busy !== null}
                    onClick={analyzeLocally}
                  >
                    {busy === "local" ? "Analisando…" : "Análise local"}{" "}
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {analysis && (
              <section className="results" id="results" aria-live="polite">
                <div className="results-heading">
                  <div>
                    <span className="eyebrow">
                      SEU RELATÓRIO{" "}
                      {analysis.ai ? "· ANÁLISE COM IA" : "· ANÁLISE LOCAL"}
                    </span>
                    <h2>Um caminho mais claro.</h2>
                    <p>
                      Estimativa de compatibilidade: ajuda a revisar o
                      currículo, mas não prevê aprovação ou comprova experiência
                      prática.
                    </p>
                  </div>
                  <button
                    className="reset-button"
                    onClick={() => {
                      setAnalysis(null)
                      setConfirmed([])
                      document
                        .querySelector("#analise")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    ↻ Nova análise
                  </button>
                </div>
                <div className="result-grid">
                  <article className="result-card score-card">
                    <span className="card-kicker">
                      COMPATIBILIDADE ESTIMADA
                    </span>
                    <div className="result-score">
                      <div
                        className="large-ring"
                        style={{
                          background: `conic-gradient(var(--violet) 0deg ${analysis.score * 3.6}deg,#eeecf8 ${analysis.score * 3.6}deg 360deg)`,
                        }}
                      >
                        <div>
                          <strong>{analysis.score}</strong>
                          <small>/100</small>
                        </div>
                      </div>
                      <div>
                        <h3>
                          {analysis.score >= 75
                            ? "Boa compatibilidade"
                            : analysis.score >= 45
                              ? "Boa base para começar"
                              : "Há pontos para explorar"}
                        </h3>
                        <p>
                          {analysis.ai
                            ? "Leitura semântica por IA."
                            : "Estimativa por palavras-chave e estrutura."}{" "}
                          Revise os requisitos.
                        </p>
                      </div>
                    </div>
                    <div className="score-legend">
                      <span>
                        <i className="legend-match" /> Requisitos encontrados
                      </span>
                      <span>
                        <i className="legend-gap" /> Requisitos para revisar
                      </span>
                    </div>
                    <div className="score-bar">
                      <span style={{ width: `${analysis.score}%` }} />
                    </div>
                  </article>
                  <article className="result-card keywords-card">
                    <div className="result-card-head">
                      <div>
                        <span className="card-kicker">
                          LEITURA DA DESCRIÇÃO
                        </span>
                        <h3>Palavras-chave</h3>
                      </div>
                      <span className="keyword-total">
                        {analysis.keywords.length} itens
                      </span>
                    </div>
                    <div className="keyword-group">
                      <span className="group-label">
                        <i className="dot-green" /> Encontradas no currículo
                      </span>
                      <div className="result-chips">
                        {matched.length ? (
                          matched.map((item) => (
                            <span className="result-chip" key={item.label}>
                              {item.label}
                            </span>
                          ))
                        ) : (
                          <span className="hint-copy">
                            Nenhuma evidência clara localizada.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="keyword-group">
                      <span className="group-label">
                        <i className="dot-orange" /> Ainda não localizadas
                      </span>
                      <div className="result-chips">
                        {missing.length ? (
                          missing.map((item) => (
                            <span
                              className="result-chip missing"
                              key={item.label}
                            >
                              {item.label}
                            </span>
                          ))
                        ) : (
                          <span className="result-chip">
                            Requisitos analisados ✓
                          </span>
                        )}
                      </div>
                      <small className="hint-copy">
                        Inclua somente competências que correspondam à sua
                        experiência real.
                      </small>
                    </div>
                    <div className="verification-panel">
                      <span className="group-label">Validação prática</span>
                      <p>
                        O texto não prova domínio. Marque apenas requisitos que
                        você já aplicou e consegue exemplificar.
                      </p>
                      {analysis.keywords.map((item) => (
                        <label className="verify-row" key={item.label}>
                          <input
                            type="checkbox"
                            checked={confirmed.includes(item.label)}
                            onChange={() => toggleConfirmed(item.label)}
                          />
                          <span>Consigo comprovar {item.label} na prática</span>
                        </label>
                      ))}
                      <strong>
                        {confirmed.length} requisito(s) confirmado(s) por você
                      </strong>
                    </div>
                  </article>
                </div>
                <div className="deep-insights">
                  <article className="result-card quality-card">
                    <span className="card-kicker">ESTRUTURA E LEITURA</span>
                    <h3>Qualidade do currículo</h3>
                    <div className="quality-list">
                      {quality.map((item) => (
                        <div className="quality-item" key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                    <small>
                      Indicadores de formato e autoavaliação; não confirmam a
                      veracidade das experiências.
                    </small>
                  </article>
                  {analysis.ai && (
                    <article className="result-card ai-insights">
                      <span className="card-kicker">ANÁLISE SEMÂNTICA</span>
                      <h3>O que a IA percebeu</h3>
                      <p>{analysis.summary}</p>
                      {analysis.recommendations?.map((item) => (
                        <p className="ai-recommendation" key={item}>
                          • {item}
                        </p>
                      ))}
                    </article>
                  )}
                </div>
                <article className="result-card resume-card">
                  <div className="resume-card-head">
                    <div>
                      <span className="card-kicker">
                        VERSÃO AJUSTADA À VAGA
                      </span>
                      <h3>Seu currículo personalizado</h3>
                      <p>
                        Prioriza evidências existentes. Revise o conteúdo antes
                        de usar.
                      </p>
                    </div>
                    <div className="export-actions">
                      <button
                        className="button button-outline"
                        onClick={() => void copyResume()}
                      >
                        ⧉ Copiar texto
                      </button>
                      <button
                        className="button button-primary"
                        onClick={printResume}
                      >
                        ↓ Exportar PDF
                      </button>
                    </div>
                  </div>
                  <pre className="resume-output">{analysis.resumeText}</pre>
                  <div className="resume-integrity">
                    <span>◇</span>
                    <strong>Trechos preservados do original.</strong>
                    <span>
                      A versão reorganiza evidências, sem criar fatos ou
                      competências.
                    </span>
                  </div>
                </article>
              </section>
            )}
            <div className="privacy-explainer" id="privacidade">
              <div className="privacy-seal">♧</div>
              <div>
                <strong>Você escolhe como analisar.</strong>
                <p>
                  A análise local funciona sem enviar dados. Ao optar pela IA,
                  os textos passam pelo servidor da aplicação e pelo provedor
                  configurado. Currículos não são salvos em banco.
                </p>
              </div>
              <a href="#inicio">Voltar ao início ↑</a>
            </div>
          </div>
        </section>
        <section className="final-cta section-shell">
          <div className="cta-orb" />
          <span className="eyebrow">APRESENTE SUA HISTÓRIA</span>
          <h2>
            Seu currículo é o começo
            <br />
            da <span className="text-accent">conversa.</span>
          </h2>
          <p>
            Clareza para mostrar o que você já construiu. Confiança para dar o
            próximo passo.
          </p>
          <a className="button button-primary" href="#analise">
            Começar minha análise <span>→</span>
          </a>
          <span className="cta-footnote">
            Grátis · Sem cadastro · Você controla seus dados
          </span>
        </section>
      </main>
      <footer className="footer">
        <a className="brand" href="#inicio">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M7 23.5 12 8l4 10 4-7 5 12.5" />
              <path d="M8 24h16" />
            </svg>
          </span>
          <span>
            matcha<span className="brand-dot">.</span>
          </span>
        </a>
        <span>Feito para sua experiência falar mais alto.</span>
        <span>© 2026 Matcha · Compatibilidade estimada.</span>
      </footer>
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  )
}

export default App
