import React, { useState, useEffect } from 'react'

/**
 * Validates whether a URL is safe for browser navigation/linking.
 * Allows strictly:
 * - https://
 * - http://
 * - relative paths starting with / (excluding //)
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Parses markdown-style inline links [Label](URL) and standalone "Label | URL"
 * into a structured array of text and link tokens.
 */
export function parseInlineTokens(text) {
  if (!text) return []

  // Check if entire text or line matches standalone "Label | URL"
  const pipeMatch = text.match(/^\s*([^|\n]+?)\s*\|\s*(\S.*?)\s*$/)
  if (pipeMatch && isSafeUrl(pipeMatch[2])) {
    const url = pipeMatch[2].trim()
    return [
      {
        type: 'link',
        label: pipeMatch[1].trim(),
        url,
        isExternal: /^https?:\/\//i.test(url),
      },
    ]
  }

  const tokens = []
  // Matches [Label](URL)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      })
    }
    const label = match[1]
    const rawUrl = match[2].trim()
    if (isSafeUrl(rawUrl)) {
      tokens.push({
        type: 'link',
        label,
        url: rawUrl,
        isExternal: /^https?:\/\//i.test(rawUrl),
      })
    } else {
      tokens.push({
        type: 'text',
        value: match[0],
      })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  return tokens
}

/**
 * Sorts .txt file descriptors ascending by leading numeric prefix (/^(\d+)/).
 * Files without a leading number sort after numbered files, alphabetically by filename.
 */
export function sortTextFiles(files = []) {
  return [...files].sort((a, b) => {
    const nameA = (typeof a === 'string' ? a : a.filename || a.name || '').split('/').pop() || ''
    const nameB = (typeof b === 'string' ? b : b.filename || b.name || '').split('/').pop() || ''

    const matchA = nameA.match(/^(\d+)/)
    const matchB = nameB.match(/^(\d+)/)

    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10)
      const numB = parseInt(matchB[1], 10)
      if (numA !== numB) return numA - numB
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
    }
    if (matchA && !matchB) return -1
    if (!matchA && matchB) return 1
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
  })
}

/**
 * Parses a single .txt file's content into structured headline, context, bullets, and hyperlinks.
 */
export function parseStructuredText(rawContent = '', filename = '', url = null) {
  const basename = (filename || '').split('/').pop() || ''
  const numMatch = basename.match(/^(\d+)/)
  const order = numMatch ? parseInt(numMatch[1], 10) : 999

  const normalized = (rawContent || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  let headline = null
  const remainingLines = []
  const headlineRegex = /^(?:#\s*|(?:Headline|H1)\s*:\s*)(.*)$/i

  for (const line of lines) {
    if (headline === null && headlineRegex.test(line)) {
      const m = line.match(headlineRegex)
      const val = (m ? m[1] : '').trim()
      if (val) {
        headline = val
        continue
      }
    }
    remainingLines.append ? remainingLines.append(line) : remainingLines.push(line)
  }

  const items = []
  const paragraphs = []
  const bullets = []
  const links = []

  let currentParaLines = []

  const flushParagraph = () => {
    if (currentParaLines.length > 0) {
      const pText = currentParaLines.join(' ').trim()
      if (pText) {
        const tokens = parseInlineTokens(pText)
        const pObj = {
          type: 'paragraph',
          text: pText,
          tokens,
        }
        items.push(pObj)
        paragraphs.push(pText)
        tokens.forEach((t) => {
          if (t.type === 'link') {
            links.push({ label: t.label, url: t.url, isExternal: t.isExternal })
          }
        })
      }
      currentParaLines = []
    }
  }

  const bulletRegex = /^[\t ]*[-*•]\s+(.*)$/
  const standaloneLinkRegex = /^\s*([^|\n]+?)\s*\|\s*(\S.*?)\s*$/

  for (const line of remainingLines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      continue
    }

    // Check for standalone link: "Label | URL"
    const linkMatch = trimmed.match(standaloneLinkRegex)
    if (linkMatch && isSafeUrl(linkMatch[2])) {
      flushParagraph()
      const label = linkMatch[1].trim()
      const linkUrl = linkMatch[2].trim()
      const linkObj = {
        type: 'link',
        label,
        url: linkUrl,
        isExternal: /^https?:\/\//i.test(linkUrl),
      }
      items.push(linkObj)
      links.push(linkObj)
      continue
    }

    // Check for bullet list item: "- Item", "* Item", "• Item"
    const bulletMatch = trimmed.match(bulletRegex)
    if (bulletMatch) {
      flushParagraph()
      const bText = bulletMatch[1].trim()
      const tokens = parseInlineTokens(bText)
      const bulletObj = {
        type: 'bullet',
        text: bText,
        tokens,
      }
      items.push(bulletObj)
      bullets.push(bText)
      tokens.forEach((t) => {
        if (t.type === 'link') {
          links.push({ label: t.label, url: t.url, isExternal: t.isExternal })
        }
      })
      continue
    }

    // Standard paragraph line (accumulated and grouped across line breaks)
    currentParaLines.push(trimmed)
  }

  flushParagraph()

  const headlineTokens = headline ? parseInlineTokens(headline) : []

  return {
    id: `text-block-${basename || order}`,
    filename: basename,
    order,
    url,
    headline,
    headlineTokens,
    items,
    paragraphs,
    bullets,
    links,
    raw: rawContent,
  }
}

/**
 * Renders tokens containing mixed text and hyperlinks.
 */
export function TextTokens({ tokens = [] }) {
  if (!tokens || tokens.length === 0) return null

  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === 'link') {
          return (
            <a
              key={idx}
              href={token.url}
              target={token.isExternal ? '_blank' : undefined}
              rel={token.isExternal ? 'noopener noreferrer' : undefined}
              className="text-[#ccff00] underline underline-offset-4 hover:text-white transition-colors font-medium cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {token.label}
              {token.isExternal && (
                <span className="ml-0.5 text-xs inline-block font-mono select-none" aria-hidden="true">
                  ↗
                </span>
              )}
            </a>
          )
        }
        return <span key={idx}>{token.value}</span>
      })}
    </>
  )
}

/**
 * Component to render a single structured text block card.
 * Fetches content dynamically from url if raw is not available.
 */
export function ProjectTextBlockCard({ block }) {
  const [data, setData] = useState(block)

  useEffect(() => {
    if (!block) return
    if ((!block.raw || block.raw.trim() === '') && block.url) {
      fetch(block.url)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch text file')
          return res.text()
        })
        .then((text) => {
          setData(parseStructuredText(text, block.filename, block.url))
        })
        .catch(() => {})
    } else {
      setData(block)
    }
  }, [block])

  if (!data || ((!data.headline) && (!data.items || data.items.length === 0))) {
    return null
  }

  return (
    <article
      className="project-text-card w-full rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 md:p-6 shadow-lg transition-all"
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* Optional Headline */}
      {data.headline && (
        <h3 className="project-text-headline font-['Archivo'] font-bold text-lg sm:text-xl md:text-2xl uppercase tracking-tight text-[#ccff00] mb-3 flex items-center gap-2">
          <TextTokens tokens={data.headlineTokens} />
        </h3>
      )}

      {/* Sequential Items (Paragraphs, Bullets, Standalone Links) */}
      <div className="project-text-body space-y-3">
        {data.items.map((item, iIdx) => {
          if (item.type === 'paragraph') {
            return (
              <p
                key={iIdx}
                className="project-text-paragraph text-sm sm:text-base text-white/85 leading-relaxed m-0"
              >
                <TextTokens tokens={item.tokens} />
              </p>
            )
          }

          if (item.type === 'bullet') {
            return (
              <div
                key={iIdx}
                className="project-text-bullet flex items-start gap-2.5 text-sm sm:text-base text-white/85 leading-relaxed"
              >
                <span className="text-[#ccff00] font-bold text-sm leading-relaxed select-none shrink-0" aria-hidden="true">
                  •
                </span>
                <span className="flex-1">
                  <TextTokens tokens={item.tokens} />
                </span>
              </div>
            )
          }

          if (item.type === 'link') {
            return (
              <div key={iIdx} className="project-text-standalone-link pt-1">
                <a
                  href={item.url}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00]/10 hover:bg-[#ccff00] text-[#ccff00] hover:text-black border border-[#ccff00]/30 hover:border-[#ccff00] transition-all font-mono text-xs uppercase tracking-wider font-bold shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{item.label}</span>
                  <span className="select-none text-xs" aria-hidden="true">
                    {item.isExternal ? '↗' : '→'}
                  </span>
                </a>
              </div>
            )
          }

          return null
        })}
      </div>
    </article>
  )
}

/**
 * Container rendering all parsed text blocks for a project.
 */
export function ProjectTextContent({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="project-text-content-wrapper w-full flex flex-col gap-4 py-3">
      {blocks.map((block, idx) => (
        <ProjectTextBlockCard key={block.id || block.filename || `text-block-${idx}`} block={block} />
      ))}
    </div>
  )
}
