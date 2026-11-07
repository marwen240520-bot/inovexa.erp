"use client";
// ============================================================
//  components/assistant/ChatMarkdown.tsx
//  Rendu Markdown SÛR (sans dangerouslySetInnerHTML) des réponses
//  de l'Assistant IA : titres, gras/italique, listes, tableaux,
//  citations, blocs de code, liens internes (navigation dans l'app)
//  et lignes d'action « → … » mises en valeur. RTL automatique.
// ============================================================

import React from "react";

type Theme = Record<string, any>;

interface Props {
  text: string;
  theme: Theme;
  onNavigate?: (path: string) => void;
  /** Curseur clignotant en fin de texte pendant le streaming */
  streaming?: boolean;
  fontFamily?: string;
}

const isSafeInternal = (href: string) => /^\/(?!\/)[\w\-/?=&%.#]*$/.test(href);
const isExternal = (href: string) => /^https?:\/\/[^\s]+$/i.test(href);

// ── Inline : `code`, **gras**, *italique*, [lien](url) ──
// (pas de lookbehind ni de \p{…} : compatibilité iOS / anciens navigateurs)
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\[[^\]\n]+\]\([^)\s]+\))|(\*[^*\s][^*\n]*?\*)/g;

function renderInline(text: string, theme: Theme, onNavigate: Props["onNavigate"], keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  // RegExp locale : renderInline est récursif (gras imbriqué), un lastIndex partagé casserait la boucle.
  const re = new RegExp(INLINE.source, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (m[1]) {
      out.push(
        <code key={k} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.9em", background: `${theme.primary}14`, padding: "1px 5px", borderRadius: 5 }}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(<strong key={k} style={{ fontWeight: 700, color: theme.text }}>{renderInline(tok.slice(2, -2), theme, onNavigate, k)}</strong>);
    } else if (m[3]) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!;
      const label = mm[1];
      const href = mm[2];
      if (isSafeInternal(href) && onNavigate) {
        out.push(
          <button
            key={k}
            type="button"
            onClick={() => onNavigate(href)}
            style={{ background: "none", border: "none", padding: 0, margin: 0, color: theme.primaryText || theme.primary, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, font: "inherit" }}
          >
            {label}
          </button>,
        );
      } else if (isExternal(href)) {
        out.push(
          <a key={k} href={href} target="_blank" rel="noopener noreferrer" style={{ color: theme.primaryText || theme.primary, fontWeight: 600, textUnderlineOffset: 3 }}>
            {label}
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (m[4]) {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ── Blocs ───────────────────────────────────────────────────
type BlockNode =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: Array<{ text: string; indent: number }> }
  | { kind: "table"; header: string[]; rows: string[][]; align: Array<"left" | "right" | "center"> }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; text: string }
  | { kind: "action"; text: string }
  | { kind: "hr" };

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

function parseBlocks(src: string): BlockNode[] {
  const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;
  const LIST = /^(\s*)([-*•]|\d{1,2}[.)])\s+(.*)$/;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // Bloc de code
    if (/^\s*```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    // Tableau
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const header = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left")) as Array<"left" | "right" | "center">;
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|?\s*$/.test(lines[i]) && lines[i].includes("|")) rows.push(splitRow(lines[i++]));
      blocks.push({ kind: "table", header, rows, align });
      continue;
    }
    // Titres
    const h = /^\s{0,3}(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ kind: "h", level: h[1].length, text: h[2].replace(/#+\s*$/, "") });
      i++;
      continue;
    }
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }
    // Ligne d'action
    if (/^\s*(→|\u27a1\ufe0f?|=>)\s*/.test(line)) {
      blocks.push({ kind: "action", text: line.replace(/^\s*(→|\u27a1\ufe0f?|=>)\s*/, "") });
      i++;
      continue;
    }
    // Citation
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ kind: "quote", lines: buf });
      continue;
    }
    // Liste
    if (LIST.test(line)) {
      const first = LIST.exec(line)!;
      const ordered = /\d/.test(first[2]);
      const items: Array<{ text: string; indent: number }> = [];
      while (i < lines.length && LIST.test(lines[i])) {
        const mm = LIST.exec(lines[i])!;
        items.push({ text: mm[3], indent: Math.min(3, Math.floor(mm[1].replace(/\t/g, "  ").length / 2)) });
        i++;
        // ligne de continuation indentée
        while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !LIST.test(lines[i])) {
          items[items.length - 1].text += " " + lines[i].trim();
          i++;
        }
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    // Paragraphe
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !LIST.test(lines[i]) && !/^\s{0,3}#{1,4}\s/.test(lines[i]) && !/^\s*(```|>|→|\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    blocks.push({ kind: "p", lines: buf });
  }
  return blocks;
}

export default function ChatMarkdown({ text, theme, onNavigate, streaming, fontFamily }: Props) {
  const blocks = React.useMemo(() => parseBlocks(text), [text]);
  const caret = streaming ? (
    <span aria-hidden="true" style={{ display: "inline-block", width: 2, height: "1em", background: theme.primary, marginInlineStart: 2, verticalAlign: "text-bottom", animation: "ixa-blink 1s steps(2) infinite" }} />
  ) : null;
  const n = blocks.length;

  return (
    <div dir="auto" style={{ fontFamily, lineHeight: 1.6, wordBreak: "break-word", overflowWrap: "anywhere" }}>
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        const tail = bi === n - 1 ? caret : null;
        const gap = bi === 0 ? 0 : 8;
        switch (b.kind) {
          case "h":
            return (
              <div key={k} dir="auto" style={{ marginTop: bi === 0 ? 0 : 12, marginBottom: 4, fontWeight: 700, fontSize: b.level <= 2 ? "1.05em" : "1em", color: theme.text }}>
                {renderInline(b.text, theme, onNavigate, k)}
                {tail}
              </div>
            );
          case "p":
            return (
              <p key={k} dir="auto" style={{ margin: `${gap}px 0 0` }}>
                {b.lines.map((l, li) => (
                  <React.Fragment key={li}>
                    {renderInline(l, theme, onNavigate, `${k}-${li}`)}
                    {li < b.lines.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))}
                {tail}
              </p>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag key={k} dir="auto" style={{ margin: `${gap}px 0 0`, paddingInlineStart: b.ordered ? 22 : 18, display: "flex", flexDirection: "column", gap: 3 }}>
                {b.items.map((it, ii) => (
                  <li key={ii} style={{ marginInlineStart: it.indent * 14, paddingInlineStart: 2 }}>
                    {renderInline(it.text, theme, onNavigate, `${k}-${ii}`)}
                    {ii === b.items.length - 1 ? tail : null}
                  </li>
                ))}
              </Tag>
            );
          }
          case "table":
            return (
              <div key={k} style={{ margin: `${gap + 2}px 0 0`, overflowX: "auto", border: `1px solid ${theme.border}`, borderRadius: 10 }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.92em" }}>
                  <thead>
                    <tr style={{ background: `${theme.primary}0f` }}>
                      {b.header.map((c, ci) => (
                        <th key={ci} style={{ textAlign: b.align[ci] || "left", padding: "7px 10px", fontWeight: 700, color: theme.text, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>
                          {renderInline(c, theme, onNavigate, `${k}-h${ci}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} style={{ borderTop: ri ? `1px solid ${theme.border}` : undefined }}>
                        {b.header.map((_, ci) => {
                          const cell = r[ci] ?? "";
                          const numeric = /^[-+]?[\d\s.,]+\s?(%|DT|€|\$|£|TND|EUR|USD)?$/.test(cell.replace(/\*\*/g, ""));
                          return (
                            <td key={ci} style={{ textAlign: b.align[ci] !== "left" ? b.align[ci] : numeric ? "right" : "left", padding: "6px 10px", color: theme.text, fontVariantNumeric: "tabular-nums", whiteSpace: numeric ? "nowrap" : undefined }}>
                              {renderInline(cell, theme, onNavigate, `${k}-${ri}-${ci}`)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tail}
              </div>
            );
          case "quote":
            return (
              <blockquote key={k} dir="auto" style={{ margin: `${gap}px 0 0`, padding: "4px 12px", borderInlineStart: `3px solid ${theme.border}`, color: theme.textSecondary }}>
                {b.lines.map((l, li) => (
                  <div key={li}>{renderInline(l, theme, onNavigate, `${k}-${li}`)}</div>
                ))}
                {tail}
              </blockquote>
            );
          case "code":
            return (
              <pre key={k} style={{ margin: `${gap}px 0 0`, padding: "10px 12px", background: `${theme.text}0d`, borderRadius: 8, overflowX: "auto", fontSize: "0.88em", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {b.text}
                {tail}
              </pre>
            );
          case "action":
            return (
              <div key={k} dir="auto" style={{ margin: `${gap + 2}px 0 0`, padding: "8px 12px", borderRadius: 10, background: `${theme.primary}12`, border: `1px solid ${theme.primary}2a`, color: theme.text, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ color: theme.primaryText || theme.primary, fontWeight: 700 }}>→</span>
                <span>
                  {renderInline(b.text, theme, onNavigate, k)}
                  {tail}
                </span>
              </div>
            );
          case "hr":
            return <hr key={k} style={{ border: "none", borderTop: `1px solid ${theme.border}`, margin: "10px 0" }} />;
        }
      })}
      {n === 0 ? caret : null}
    </div>
  );
}
