import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  const [open, setOpen] = useState(false)
  const isActive = editor.isActive('bulletList')

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
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
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
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onMouseDown={() => setOpen(false)} />
          <DropPanel top={36}>
            {BULLET_TYPES.map((t) => (
              <DropItem key={t.id} preview={t.preview} label={t.label} onSelect={() => apply(t.id)} />
            ))}
          </DropPanel>
        </>
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
  const [open, setOpen] = useState(false)
  const isActive = editor.isActive('orderedList')

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
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
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
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onMouseDown={() => setOpen(false)} />
          <DropPanel top={36}>
            {ORDERED_TYPES.map((t) => (
              <DropItem key={t.id} preview={t.preview} label={t.label} onSelect={() => apply(t.id)} />
            ))}
          </DropPanel>
        </>
      )}
    </div>
  )
}

// ── Font size dropdown ────────────────────────────────────────────────────────
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

function FontSizeDropdown({ editor }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const current = editor.getAttributes('textStyle').fontSize
  const currentNum = current ? parseInt(current) : null
  const displayVal = currentNum || 15

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
              {FONT_SIZES.map((s) => (
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

      {/* Highlight */}
      <ToolBtn
        icon="highlight"
        title="Highlight"
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />

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
