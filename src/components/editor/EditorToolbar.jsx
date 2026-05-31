/**
 * src/components/editor/EditorToolbar.jsx — rich text formatting toolbar
 * ────────────────────────────────────────────────────────────
 * Props:
 *   editor:       TipTap Editor instance
 *   onImageFile:  (file: File) => void    — toolbar file-input handler
 *   onImageUrl:   (url: string) => void   — insert-by-URL handler
 *   saveStatus:   'saving' | 'saved' | 'error'
 *
 * ⚠️  OVERFLOW / DROPDOWN RULE:
 *   The toolbar container sets overflowX: auto. CSS spec forces overflow-y to
 *   also be auto, which CLIPS absolutely-positioned children that extend below
 *   the toolbar. ALL dropdown panels MUST render via createPortal(panel, document.body)
 *   with position: fixed and coordinates from getBoundingClientRect().
 *   See FontSizeDropdown, BulletDropdown, OrderedDropdown for the pattern.
 *
 * Dropdown data:
 *   BULLET_TYPES / ORDERED_TYPES — list style options
 *   EDITOR_FONT_SIZES            — font size list (from src/constants.js)
 *   EDITOR_DEFAULT_FONT_SIZE     — fallback when no fontSize mark is active
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { EDITOR_FONT_SIZES, EDITOR_DEFAULT_FONT_SIZE } from '../../constants'

// ── Shared primitives ─────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, icon, disabled }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick() }}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 7, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: active ? '#e0e7ff' : 'transparent',
        color: active ? '#2463eb' : disabled ? '#cbd5e1' : '#475569',
        flexShrink: 0,
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = '#f1f5f9' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? '#e0e7ff' : 'transparent' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 3px', flexShrink: 0 }} />
}

// ── Bullet list dropdown ──────────────────────────────────────────────────────
const BULLET_TYPES = [
  { id: 'disc',      label: 'Bullet',    preview: '●' },
  { id: 'circle',    label: 'Circle',    preview: '○' },
  { id: 'square',    label: 'Square',    preview: '■' },
  { id: 'arrow',     label: 'Arrow',     preview: '→' },
  { id: 'star',      label: 'Star',      preview: '★' },
  { id: 'triangle',  label: 'Triangle',  preview: '▶' },
  { id: 'check',     label: 'Check',     preview: '✓' },
  { id: 'dash',      label: 'Dash',      preview: '–' },
]

function BulletDropdown({ editor }) {
  const [open,     setOpen]     = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef   = useRef(null)
  const isActive = editor.isActive('bulletList')

  function toggleOpen(e) {
    e.preventDefault()
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((v) => !v)
  }

  function apply(listType) {
    if (!isActive) {
      editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType }).run()
    } else {
      editor.chain().focus().updateAttributes('bulletList', { listType }).run()
    }
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onMouseDown={toggleOpen}
        title="Bullet list"
        style={{
          display: 'flex', alignItems: 'center', gap: 1,
          height: 32, padding: '0 4px 0 6px', borderRadius: 7, border: 'none',
          cursor: 'pointer', flexShrink: 0,
          background: isActive ? '#e0e7ff' : 'transparent',
          color: isActive ? '#2463eb' : '#475569',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_list_bulleted</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_drop_down</span>
      </button>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
          <div style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 9999,
            background: 'white', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            border: '1px solid #e2e8f0', width: 160,
            padding: '5px 0', overflow: 'hidden',
          }}>
            {BULLET_TYPES.map((t) => (
              <DropItem key={t.id} preview={t.preview} label={t.label} onSelect={() => apply(t.id)} />
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}

// ── Ordered list dropdown ─────────────────────────────────────────────────────
const ORDERED_TYPES = [
  { id: 'decimal',     label: '1, 2, 3',   preview: '1.' },
  { id: 'lower-alpha', label: 'a, b, c',   preview: 'a.' },
  { id: 'upper-alpha', label: 'A, B, C',   preview: 'A.' },
  { id: 'lower-roman', label: 'i, ii, iii',preview: 'i.' },
  { id: 'upper-roman', label: 'I, II, III',preview: 'I.' },
]

function OrderedDropdown({ editor }) {
  const [open,     setOpen]     = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef   = useRef(null)
  const isActive = editor.isActive('orderedList')

  function toggleOpen(e) {
    e.preventDefault()
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((v) => !v)
  }

  function apply(listType) {
    if (!isActive) {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listType }).run()
    } else {
      editor.chain().focus().updateAttributes('orderedList', { listType }).run()
    }
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onMouseDown={toggleOpen}
        title="Ordered list"
        style={{
          display: 'flex', alignItems: 'center', gap: 1,
          height: 32, padding: '0 4px 0 6px', borderRadius: 7, border: 'none',
          cursor: 'pointer', flexShrink: 0,
          background: isActive ? '#e0e7ff' : 'transparent',
          color: isActive ? '#2463eb' : '#475569',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_list_numbered</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_drop_down</span>
      </button>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
          <div style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 9999,
            background: 'white', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            border: '1px solid #e2e8f0', width: 170,
            padding: '5px 0', overflow: 'hidden',
          }}>
            {ORDERED_TYPES.map((t) => (
              <DropItem key={t.id} preview={t.preview} label={t.label} onSelect={() => apply(t.id)} />
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}

// ── Highlight color dropdown ─────────────────────────────────────────────────
function HighlightDropdown({ editor }) {
  const [open,     setOpen]     = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef   = useRef(null)
  const isActive    = editor.isActive('highlight')
  const activeColor = editor.getAttributes('highlight').color || null

  function toggleOpen(e) {
    e.preventDefault()
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((v) => !v)
  }

  function applyColor(color) {
    const { from, to } = editor.state.selection
    const mt = editor.state.schema.marks.highlight
    if (mt && from !== to) {
      editor.view.dispatch(editor.state.tr.addMark(from, to, mt.create({ color })))
    }
    setOpen(false)
  }

  function removeHighlight() {
    const { from, to } = editor.state.selection
    const mt = editor.state.schema.marks.highlight
    if (mt && from !== to) {
      editor.view.dispatch(editor.state.tr.removeMark(from, to, mt))
    }
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onMouseDown={toggleOpen}
        title="Highlight color"
        style={{
          display: 'flex', alignItems: 'center', gap: 1,
          height: 32, padding: '0 4px 0 6px', borderRadius: 7, border: 'none',
          cursor: 'pointer', flexShrink: 0,
          background: isActive ? '#e0e7ff' : 'transparent',
          color: isActive ? '#2463eb' : '#475569',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>highlight</span>
          <div style={{ width: 16, height: 3, borderRadius: 2, background: activeColor || '#fef08a' }} />
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_drop_down</span>
      </button>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
          <div style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 9999,
            background: 'white', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            border: '1px solid #e2e8f0',
            padding: 8,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 6 }}>
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  onMouseDown={(e) => { e.preventDefault(); applyColor(color) }}
                  title={label}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: color,
                    border: activeColor === color ? '2px solid #2463eb' : '1.5px solid #d1d5db',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0 4px', borderTop: '1px solid #f1f5f9' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="color"
                  defaultValue="#fef08a"
                  onMouseDown={(e) => e.stopPropagation()}
                  onInput={(e) => {
                    const { from, to } = editor.state.selection
                    const mt = editor.state.schema.marks.highlight
                    if (mt && from !== to) editor.view.dispatch(editor.state.tr.addMark(from, to, mt.create({ color: e.target.value })))
                  }}
                  style={{ width: 22, height: 22, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }}
                />
                Custom
              </label>
            </div>
            {isActive && (
              <button
                onMouseDown={(e) => { e.preventDefault(); removeHighlight() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, width: '100%',
                  padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: 'none', color: '#64748b', fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>format_color_reset</span>
                Remove highlight
              </button>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}

// ── Font size dropdown ────────────────────────────────────────────────────────
// Font sizes are imported from src/constants.js (EDITOR_FONT_SIZES)

function FontSizeDropdown({ editor }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const current = editor.getAttributes('textStyle').fontSize
  const currentNum = current ? parseInt(current) : null
  const displayVal = currentNum || EDITOR_DEFAULT_FONT_SIZE

  function toggleOpen(e) {
    e.preventDefault()
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((v) => !v)
  }

  function apply(size) {
    const { from, to } = editor.state.selection
    const markType = editor.state.schema.marks.textStyle
    if (markType && from !== to) {
      editor.view.dispatch(editor.state.tr.addMark(from, to, markType.create({ fontSize: `${size}px` })))
    }
    setOpen(false)
    setCustom('')
  }

  function submitCustom() {
    const n = parseInt(custom)
    if (n > 0 && n <= 400) apply(n)
    setOpen(false)
    setCustom('')
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onMouseDown={toggleOpen}
        title="Font size"
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          height: 32, padding: '0 5px', borderRadius: 7,
          border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0,
          background: open ? '#f1f5f9' : 'white',
          color: '#475569', fontFamily: 'Inter, sans-serif',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>format_size</span>
        <span style={{ fontSize: 12, minWidth: 18, textAlign: 'center', fontWeight: 500 }}>
          {displayVal}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_drop_down</span>
      </button>
      {open && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onMouseDown={() => { setOpen(false); setCustom('') }}
          />
          <div style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 9999,
            background: 'white', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            border: '1px solid #e2e8f0', width: 90,
            padding: '6px 0',
          }}>
            <div style={{ padding: '4px 8px 6px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                autoFocus
                type="number" min={1} max={400} placeholder="pt"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitCustom() }}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '4px 6px', borderRadius: 6,
                  border: '1.5px solid #cbd5e1', fontSize: 12,
                  outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1e293b',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2463eb' }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1' }}
              />
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {EDITOR_FONT_SIZES.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); apply(s) }}
                  style={{
                    display: 'block', width: '100%', padding: '5px 14px',
                    background: currentNum === s ? '#e0e7ff' : 'none',
                    color: currentNum === s ? '#2463eb' : '#1e293b',
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    fontFamily: 'Inter, sans-serif', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { if (currentNum !== s) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={(e) => { if (currentNum !== s) e.currentTarget.style.background = 'none' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── Font color picker ─────────────────────────────────────────────────────────
const COLOR_SWATCHES = [
  '#000000','#374151','#6b7280','#9ca3af','#d1d5db','#ffffff',
  '#dc2626','#ea580c','#d97706','#65a30d','#16a34a','#0891b2',
  '#2463eb','#7c3aed','#db2777','#be123c','#b45309','#166534',
]

function FontColorPicker({ editor }) {
  const [open, setOpen] = useState(false)
  const nativeRef = useRef(null)

  const current = editor.getAttributes('textStyle').color || '#000000'

  function apply(color) {
    editor.chain().focus().setColor(color).run()
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="Font color"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 7, border: 'none',
          cursor: 'pointer', flexShrink: 0,
          background: open ? '#f1f5f9' : 'transparent',
          gap: 1, padding: '4px 6px',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#475569', lineHeight: 1 }}>format_color_text</span>
        <span style={{ width: 16, height: 3, borderRadius: 2, background: current }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onMouseDown={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 36, left: 0, zIndex: 50,
            background: 'white', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            border: '1px solid #e2e8f0', padding: '10px',
            width: 156,
          }}>
            {/* Swatch grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 8 }}>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); apply(c) }}
                  title={c}
                  style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: c, border: current === c ? '2px solid #2463eb' : '1px solid #e2e8f0',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
            {/* Custom color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                ref={nativeRef}
                type="color"
                value={current}
                style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Custom…</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Image dropdown ────────────────────────────────────────────────────────────
function ImageDropdown({ onImageFile, onImageUrl }) {
  const [open, setOpen] = useState(false)
  const [urlMode, setUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef(null)

  function submitUrl() {
    if (urlInput.trim()) onImageUrl(urlInput.trim())
    setUrlInput('')
    setUrlMode(false)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <ToolBtn
        icon="image"
        title="Insert image"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onMouseDown={() => { setOpen(false); setUrlMode(false); setUrlInput('') }} />
          <DropPanel top={36} width={220}>
            {!urlMode ? (
              <>
                <button
                  onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click() }}
                  style={dropItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>upload</span>
                  Upload from device
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setUrlMode(true) }}
                  style={dropItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>link</span>
                  From URL
                </button>
                <div style={{ padding: '8px 14px', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
                  Or paste an image (Ctrl+V)
                </div>
              </>
            ) : (
              <div style={{ padding: '10px 12px' }}>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitUrl() }}
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '7px 10px', borderRadius: 8,
                    border: '1.5px solid #cbd5e1', fontSize: 12,
                    outline: 'none', fontFamily: 'Inter, sans-serif',
                    color: '#1e293b',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2463eb' }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setUrlMode(false) }}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, color: '#64748b' }}
                  >
                    Back
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); submitUrl() }}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', background: '#2463eb', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600 }}
                  >
                    Insert
                  </button>
                </div>
              </div>
            )}
          </DropPanel>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) onImageFile(e.target.files[0])
          setOpen(false)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Shared dropdown primitives ────────────────────────────────────────────────
function DropPanel({ children, top = 36, width = 180 }) {
  return (
    <div
      style={{
        position: 'absolute', top, left: 0, zIndex: 50,
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
        border: '1px solid #e2e8f0', width,
        padding: '5px 0', overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

const dropItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '9px 14px',
  background: 'none', border: 'none',
  cursor: 'pointer', fontSize: 13,
  color: '#1e293b', textAlign: 'left',
  fontFamily: 'Inter, sans-serif',
}

function DropItem({ preview, label, onSelect }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...dropItemStyle,
        background: hov ? '#f8fafc' : 'none',
      }}
    >
      <span style={{ width: 22, fontSize: 14, color: '#475569', fontWeight: 600, textAlign: 'center' }}>
        {preview}
      </span>
      {label}
    </button>
  )
}

// ── Save status badge ─────────────────────────────────────────────────────────
function SaveBadge({ status }) {
  const map = {
    saving: { text: 'Saving…',  color: '#94a3b8', icon: 'sync' },
    saved:  { text: 'Saved',    color: '#22c55e', icon: 'check_circle' },
    error:  { text: 'Not saved',color: '#f43f5e', icon: 'error' },
  }
  const { text, color, icon } = map[status] || map.saved
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color, marginLeft: 'auto', flexShrink: 0 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{icon}</span>
      {text}
    </span>
  )
}

// ── Main toolbar ──────────────────────────────────────────────────────────────
export default function EditorToolbar({ editor, onImageFile, onImageUrl, saveStatus }) {
  if (!editor) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
        gap: 2, padding: '6px 10px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fafafa',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* Font size */}
      <FontSizeDropdown editor={editor} />

      <Divider />

      {/* Font color */}
      <FontColorPicker editor={editor} />

      <Divider />

      {/* Bold */}
      <ToolBtn
        icon="format_bold"
        title="Bold (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />

      {/* Italic */}
      <ToolBtn
        icon="format_italic"
        title="Italic (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />

      {/* Highlight color */}
      <HighlightDropdown editor={editor} />

      <Divider />

      {/* Align left */}
      <ToolBtn
        icon="format_align_left"
        title="Align left"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      />

      {/* Align center */}
      <ToolBtn
        icon="format_align_center"
        title="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      />

      {/* Align right */}
      <ToolBtn
        icon="format_align_right"
        title="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      />

      <Divider />

      {/* Bullet list (with type dropdown) */}
      <BulletDropdown editor={editor} />

      {/* Ordered list (with type dropdown) */}
      <OrderedDropdown editor={editor} />

      <Divider />

      {/* Image */}
      <ImageDropdown onImageFile={onImageFile} onImageUrl={onImageUrl} />

      {/* Save status — pushed to far right */}
      <SaveBadge status={saveStatus} />
    </div>
  )
}

// ── Floating Selection Toolbar ────────────────────────────────────────────────
// Dark pill that appears above (or below) highlighted text, giving quick access
// to common formatting tools without requiring the user to scroll to the toolbar.
// Renders via createPortal so it is never clipped by any parent overflow.

function FloatBtn({ icon, title, active, onClick }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.82)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'rgba(255,255,255,0.18)' : 'transparent' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
    </button>
  )
}

function FloatSep() {
  return (
    <span style={{
      width: 1, height: 18, flexShrink: 0, margin: '0 2px',
      background: 'rgba(255,255,255,0.14)',
    }} />
  )
}

const HIGHLIGHT_COLORS = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#fecdd3', label: 'Pink' },
  { color: '#e9d5ff', label: 'Purple' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#a5f3fc', label: 'Cyan' },
  { color: '#fca5a5', label: 'Red' },
]

const FLOAT_MINI_COLORS = [
  '#000000', '#374151', '#dc2626', '#d97706',
  '#16a34a', '#2463eb', '#7c3aed', '#ffffff',
]

const FLOAT_TOOLBAR_W = 424

export function FloatingSelectionToolbar({ editor }) {
  const [pos,         setPos]         = useState(null)   // { top, left, arrowX, arrowBelow } | null
  const [colorOpen,     setColorOpen]     = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [bulletOpen,    setBulletOpen]    = useState(false)
  const [orderedOpen,   setOrderedOpen]   = useState(false)

  useEffect(() => {
    if (!editor) return

    function update() {
      const sel = editor.state.selection
      // Hide for cursor-only or node selections (e.g. a selected image)
      if (sel.empty || sel.node) { setPos(null); setColorOpen(false); return }

      const domSel = window.getSelection()
      if (!domSel || domSel.rangeCount === 0) { setPos(null); return }

      const rect = domSel.getRangeAt(0).getBoundingClientRect()
      if (!rect.width && !rect.height) { setPos(null); return }

      const TOOLBAR_H = 44
      const GAP       = 10

      // Center toolbar over selection, clamped to viewport
      const rawLeft = rect.left + rect.width / 2 - FLOAT_TOOLBAR_W / 2
      const left    = Math.max(8, Math.min(rawLeft, window.innerWidth - FLOAT_TOOLBAR_W - 8))

      // Arrow X: points at the center of the selection
      const arrowX = Math.max(14, Math.min(rect.left + rect.width / 2 - left, FLOAT_TOOLBAR_W - 14))

      // Show below if selection is too close to the top of the viewport
      const arrowBelow = rect.top < TOOLBAR_H + GAP + 12
      const top = arrowBelow ? rect.bottom + GAP : rect.top - TOOLBAR_H - GAP

      setPos({ top, left, arrowX, arrowBelow })
    }

    function hide() { setPos(null); setColorOpen(false); setHighlightOpen(false); setBulletOpen(false); setOrderedOpen(false) }

    editor.on('selectionUpdate', update)
    editor.on('blur', hide)
    // Scrolling makes the stored coords stale — just hide and let re-selection reposition
    document.addEventListener('scroll', hide, { capture: true, passive: true })
    window.addEventListener('resize', hide)

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', hide)
      document.removeEventListener('scroll', hide, { capture: true })
      window.removeEventListener('resize', hide)
    }
  }, [editor])

  if (!pos || !editor) return null

  const { top, left, arrowX, arrowBelow } = pos
  const curColor = editor.getAttributes('textStyle').color || '#000000'

  function changeSize(dir) {
    const curSize = parseInt(editor.getAttributes('textStyle').fontSize) || EDITOR_DEFAULT_FONT_SIZE
    let idx = EDITOR_FONT_SIZES.indexOf(curSize)
    if (idx === -1) {
      // Snap to nearest known size
      idx = EDITOR_FONT_SIZES.reduce(
        (best, s, i) => Math.abs(s - curSize) < Math.abs(EDITOR_FONT_SIZES[best] - curSize) ? i : best, 0,
      )
    }
    const nextIdx  = dir === 'up' ? Math.min(idx + 1, EDITOR_FONT_SIZES.length - 1) : Math.max(idx - 1, 0)
    const nextSize = EDITOR_FONT_SIZES[nextIdx]
    const { from, to } = editor.state.selection
    const mt = editor.state.schema.marks.textStyle
    if (mt && from !== to) {
      editor.view.dispatch(editor.state.tr.addMark(from, to, mt.create({ fontSize: `${nextSize}px` })))
    }
  }

  const sharedArrow = {
    position: 'absolute', left: arrowX, transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
  }

  return createPortal(
    <>
      {/* Full-screen backdrop to close any open dropdown — z-index below the toolbar */}
      {(colorOpen || highlightOpen || bulletOpen || orderedOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          onMouseDown={() => { setColorOpen(false); setHighlightOpen(false); setBulletOpen(false); setOrderedOpen(false) }}
        />
      )}

      <div
        onMouseDown={(e) => e.preventDefault()}
        style={{
          position: 'fixed', top, left, zIndex: 10000,
          fontFamily: 'Inter, sans-serif',
          animation: `${arrowBelow ? 'floatInBelow' : 'floatIn'} 0.13s ease`,
          pointerEvents: 'auto',
        }}
      >
        {/* Arrow pointing UP — toolbar is below the selection */}
        {arrowBelow && (
          <div style={{ ...sharedArrow, top: -6, borderBottom: '6px solid #1e293b' }} />
        )}

        {/* Main dark pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1,
          height: 44, padding: '0 6px', boxSizing: 'border-box',
          background: '#1e293b', borderRadius: 10,
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>

          {/* Font size — A– decrease and A+ increase */}
          {[
            { dir: 'down', big: 13, small: '–', title: 'Decrease font size' },
            { dir: 'up',   big: 16, small: '+', title: 'Increase font size'  },
          ].map(({ dir, big, small, title }) => (
            <button
              key={dir}
              title={title}
              onMouseDown={(e) => { e.preventDefault(); changeSize(dir) }}
              style={{
                display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                flexShrink: 0, gap: 0, paddingBottom: 3,
                background: 'transparent', color: 'rgba(255,255,255,0.82)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: big, fontWeight: 700, lineHeight: 1 }}>A</span>
              <span style={{ fontSize: 9,   fontWeight: 700, lineHeight: 1, marginBottom: 1 }}>{small}</span>
            </button>
          ))}

          <FloatSep />

          <FloatBtn icon="format_bold"   title="Bold (Ctrl+B)"   active={editor.isActive('bold')}   onClick={() => editor.chain().focus().toggleBold().run()} />
          <FloatBtn icon="format_italic" title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />

          {/* Highlight color picker */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              title="Highlight color"
              onMouseDown={(e) => { e.preventDefault(); setHighlightOpen((v) => !v); setColorOpen(false); setBulletOpen(false); setOrderedOpen(false) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                gap: 1, padding: '3px 6px', boxSizing: 'border-box',
                background: highlightOpen || editor.isActive('highlight') ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: 'rgba(255,255,255,0.82)',
              }}
              onMouseEnter={(e) => { if (!highlightOpen && !editor.isActive('highlight')) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { if (!highlightOpen && !editor.isActive('highlight')) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>highlight</span>
              <span style={{
                width: 14, height: 3, borderRadius: 2,
                background: editor.getAttributes('highlight').color || '#fef08a',
                opacity: editor.isActive('highlight') ? 1 : 0.45,
              }} />
            </button>
            {highlightOpen && (
              <div style={{
                position: 'absolute',
                ...(arrowBelow ? { top: 34 } : { bottom: 34 }),
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 10001,
                background: '#1e293b', borderRadius: 8,
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 6,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 4 }}>
                  {HIGHLIGHT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const { from, to } = editor.state.selection
                        const mt = editor.state.schema.marks.highlight
                        if (mt && from !== to) editor.view.dispatch(editor.state.tr.addMark(from, to, mt.create({ color })))
                        setHighlightOpen(false)
                      }}
                      title={label}
                      style={{
                        width: 22, height: 22, borderRadius: 5, padding: 0, cursor: 'pointer',
                        background: color, boxSizing: 'border-box',
                        border: editor.getAttributes('highlight').color === color
                          ? '2px solid #60a5fa'
                          : '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 5 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                    <input
                      type="color"
                      defaultValue="#fef08a"
                      onMouseDown={(e) => e.stopPropagation()}
                      onInput={(e) => {
                        const { from, to } = editor.state.selection
                        const mt = editor.state.schema.marks.highlight
                        if (mt && from !== to) editor.view.dispatch(editor.state.tr.addMark(from, to, mt.create({ color: e.target.value })))
                      }}
                      style={{ width: 20, height: 20, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 3 }}
                    />
                    Custom
                  </label>
                  {editor.isActive('highlight') && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const { from, to } = editor.state.selection
                        const mt = editor.state.schema.marks.highlight
                        if (mt && from !== to) editor.view.dispatch(editor.state.tr.removeMark(from, to, mt))
                        setHighlightOpen(false)
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, width: '100%',
                        padding: '5px 4px 2px', border: 'none', cursor: 'pointer',
                        background: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 11,
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>format_color_reset</span>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <FloatSep />

          {/* Text color with mini palette */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              title="Text color"
              onMouseDown={(e) => { e.preventDefault(); setColorOpen((v) => !v) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                gap: 1, padding: '3px 6px', boxSizing: 'border-box',
                background: colorOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: 'rgba(255,255,255,0.82)',
              }}
              onMouseEnter={(e) => { if (!colorOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { if (!colorOpen) e.currentTarget.style.background = colorOpen ? 'rgba(255,255,255,0.18)' : 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, lineHeight: 1 }}>format_color_text</span>
              <span style={{
                width: 14, height: 3, borderRadius: 2,
                background: curColor === '#ffffff' ? 'rgba(255,255,255,0.5)' : curColor,
              }} />
            </button>

            {colorOpen && (
              <div style={{
                position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10001,
                background: '#1e293b', borderRadius: 8,
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 6,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {FLOAT_MINI_COLORS.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        editor.chain().focus().setColor(c).run()
                        setColorOpen(false)
                      }}
                      style={{
                        width: 20, height: 20, borderRadius: 4, padding: 0, cursor: 'pointer',
                        background: c, boxSizing: 'border-box',
                        border: curColor === c
                          ? '2px solid #60a5fa'
                          : c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.12)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <FloatSep />

          <FloatBtn icon="format_align_left"   title="Align left"   active={editor.isActive({ textAlign: 'left' })}   onClick={() => editor.chain().focus().setTextAlign('left').run()} />
          <FloatBtn icon="format_align_center" title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
          <FloatBtn icon="format_align_right"  title="Align right"  active={editor.isActive({ textAlign: 'right' })}  onClick={() => editor.chain().focus().setTextAlign('right').run()} />

          <FloatSep />

          {/* Bullet list dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              title="Bullet list"
              onMouseDown={(e) => { e.preventDefault(); setBulletOpen((v) => !v); setOrderedOpen(false); setColorOpen(false); setHighlightOpen(false) }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 30, padding: '0 3px 0 5px', borderRadius: 6, border: 'none',
                cursor: 'pointer', flexShrink: 0, gap: 0,
                background: bulletOpen || editor.isActive('bulletList') ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: 'rgba(255,255,255,0.82)',
              }}
              onMouseEnter={(e) => { if (!bulletOpen && !editor.isActive('bulletList')) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { if (!bulletOpen && !editor.isActive('bulletList')) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>format_list_bulleted</span>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{arrowBelow ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
            </button>
            {bulletOpen && (
              <div style={{
                position: 'absolute',
                ...(arrowBelow ? { top: 34 } : { bottom: 34 }),
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 10001,
                background: '#1e293b', borderRadius: 8,
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 0', minWidth: 140,
              }}>
                {BULLET_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (!editor.isActive('bulletList')) {
                        editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType: t.id }).run()
                      } else {
                        editor.chain().focus().updateAttributes('bulletList', { listType: t.id }).run()
                      }
                      setBulletOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '7px 12px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.85)', fontSize: 12,
                      fontFamily: 'Inter, sans-serif', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                  >
                    <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{t.preview}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ordered list dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              title="Ordered list"
              onMouseDown={(e) => { e.preventDefault(); setOrderedOpen((v) => !v); setBulletOpen(false); setColorOpen(false); setHighlightOpen(false) }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 30, padding: '0 3px 0 5px', borderRadius: 6, border: 'none',
                cursor: 'pointer', flexShrink: 0, gap: 0,
                background: orderedOpen || editor.isActive('orderedList') ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: 'rgba(255,255,255,0.82)',
              }}
              onMouseEnter={(e) => { if (!orderedOpen && !editor.isActive('orderedList')) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { if (!orderedOpen && !editor.isActive('orderedList')) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>format_list_numbered</span>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{arrowBelow ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
            </button>
            {orderedOpen && (
              <div style={{
                position: 'absolute',
                ...(arrowBelow ? { top: 34 } : { bottom: 34 }),
                left: '50%', transform: 'translateX(-50%)',
                zIndex: 10001,
                background: '#1e293b', borderRadius: 8,
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 0', minWidth: 160,
              }}>
                {ORDERED_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (!editor.isActive('orderedList')) {
                        editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listType: t.id }).run()
                      } else {
                        editor.chain().focus().updateAttributes('orderedList', { listType: t.id }).run()
                      }
                      setOrderedOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '7px 12px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.85)', fontSize: 12,
                      fontFamily: 'Inter, sans-serif', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                  >
                    <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>{t.preview}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Arrow pointing DOWN — toolbar is above the selection (normal case) */}
        {!arrowBelow && (
          <div style={{ ...sharedArrow, bottom: -6, borderTop: '6px solid #1e293b' }} />
        )}
      </div>
    </>,
    document.body,
  )
}
