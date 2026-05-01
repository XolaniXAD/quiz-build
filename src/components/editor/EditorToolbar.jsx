import { useState, useRef } from 'react'

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
  { id: 'disc',   label: 'Disc',   preview: '●' },
  { id: 'circle', label: 'Circle', preview: '○' },
  { id: 'square', label: 'Square', preview: '■' },
  { id: 'arrow',  label: 'Arrow',  preview: '→' },
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
