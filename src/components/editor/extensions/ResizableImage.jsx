import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'
import { useEditorContext } from '../EditorContext'

// ── Wrap mode configs ─────────────────────────────────────────────────────────
const WRAP_MODES = [
  { mode: 'inline',  icon: 'format_image_right', label: 'Inline with text' },
  { mode: 'left',    icon: 'format_align_left',  label: 'Float left (text wraps right)' },
  { mode: 'center',  icon: 'format_align_center',label: 'Center (block)' },
  { mode: 'right',   icon: 'format_align_right', label: 'Float right (text wraps left)' },
  { mode: 'inFront', icon: 'flip_to_front',       label: 'In front of text' },
  { mode: 'behind',  icon: 'flip_to_back',        label: 'Behind text' },
]

// 8 resize handles – position offsets from the image edges
const HANDLES = [
  { dir: 'nw', cursor: 'nw-resize', style: { top: -7,         left: -7          } },
  { dir: 'n',  cursor: 'n-resize',  style: { top: -7,         left: 'calc(50% - 7px)' } },
  { dir: 'ne', cursor: 'ne-resize', style: { top: -7,         right: -7         } },
  { dir: 'e',  cursor: 'e-resize',  style: { top: 'calc(50% - 7px)', right: -7  } },
  { dir: 'se', cursor: 'se-resize', style: { bottom: -7,      right: -7         } },
  { dir: 's',  cursor: 's-resize',  style: { bottom: -7,      left: 'calc(50% - 7px)' } },
  { dir: 'sw', cursor: 'sw-resize', style: { bottom: -7,      left: -7          } },
  { dir: 'w',  cursor: 'w-resize',  style: { top: 'calc(50% - 7px)', left: -7   } },
]

// ── NodeView React component ──────────────────────────────────────────────────
function ResizableImageView({ node, updateAttributes, deleteNode, selected }) {
  const { onCropRequest } = useEditorContext()
  const [hover, setHover]             = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const containerRef = useRef(null)
  const mountedRef   = useRef(true)

  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [contextMenu])

  const { src, alt, width, height, wrapMode = 'inline', posX = 0, posY = 0 } = node.attrs

  // ── Set initial dimensions on first image load ─────────────────────────────
  function onImgLoad(e) {
    if (!node.attrs.width && !node.attrs.height) {
      updateAttributes({
        width:  `${e.currentTarget.offsetWidth}px`,
        height: `${e.currentTarget.offsetHeight}px`,
      })
    }
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  function startResize(e, dir) {
    e.preventDefault()
    e.stopPropagation()

    const el = containerRef.current
    if (!el) return

    // Use getBoundingClientRect for reliable rendered dimensions
    const rect   = el.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startW = rect.width
    const startH = rect.height
    const ar     = startH > 0 ? startW / startH : 1
    const corner = dir.length === 2

    // Capture pointer so events keep firing even if pointer leaves element
    e.currentTarget.setPointerCapture(e.pointerId)

    function onMove(ev) {
      if (!mountedRef.current) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let nW = startW
      let nH = startH

      if (dir.includes('e')) nW = Math.max(40, startW + dx)
      if (dir.includes('w')) nW = Math.max(40, startW - dx)
      if (dir.includes('s')) nH = Math.max(30, startH + dy)
      if (dir.includes('n')) nH = Math.max(30, startH - dy)

      // Corner: lock aspect ratio
      if (corner) {
        if (Math.abs(dx) >= Math.abs(dy)) nH = Math.round(nW / ar)
        else nW = Math.round(nH * ar)
      }

      updateAttributes({ width: `${Math.round(nW)}px`, height: `${Math.round(nH)}px` })
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ── Drag to reposition (inFront / behind) ──────────────────────────────────
  function startDrag(e) {
    if (wrapMode !== 'inFront' && wrapMode !== 'behind') return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const origX = posX, origY = posY

    function onMove(ev) {
      if (!mountedRef.current) return
      updateAttributes({ posX: origX + (ev.clientX - startX), posY: origY + (ev.clientY - startY) })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  function handleContextMenu(e) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 100),
    })
  }

  function handleCrop(e) {
    e.stopPropagation()
    setContextMenu(null)
    if (onCropRequest) {
      onCropRequest({
        src,
        onComplete: (newSrc) => updateAttributes({ src: newSrc, width: null, height: null }),
      })
    }
  }

  function handleDelete(e) {
    e.stopPropagation()
    setContextMenu(null)
    deleteNode()
  }

  // ── Container style ────────────────────────────────────────────────────────
  const isAbsolute = wrapMode === 'inFront' || wrapMode === 'behind'
  const containerStyle = {
    position:      isAbsolute ? 'absolute' : 'relative',
    display:       isAbsolute || wrapMode === 'center' ? 'block' : 'inline-block',
    userSelect:    'none',
    maxWidth:      '100%',
    verticalAlign: !isAbsolute ? 'bottom' : undefined,
    outline:       (selected || hover) ? `2px ${selected ? 'solid' : 'dashed'} #2463eb` : 'none',
    outlineOffset: 2,
    borderRadius:  2,
    cursor:        isAbsolute ? 'move' : 'default',
    zIndex:        wrapMode === 'inFront' ? 10 : wrapMode === 'behind' ? -1 : 'auto',
    left:          isAbsolute ? posX : undefined,
    top:           isAbsolute ? posY : undefined,
    float:         wrapMode === 'left' ? 'left' : wrapMode === 'right' ? 'right' : 'none',
    marginRight:   wrapMode === 'left'   ? '1em' : undefined,
    marginLeft:    wrapMode === 'right'  ? '1em' : wrapMode === 'center' ? 'auto' : undefined,
    marginBottom:  (wrapMode === 'left' || wrapMode === 'right' || wrapMode === 'center') ? '0.5em' : undefined,
    marginTop:     wrapMode === 'center' ? '0.5em' : undefined,
  }
  if (width)                       containerStyle.width  = width
  if (height && height !== 'auto') containerStyle.height = height

  const showHandles = selected || hover

  return (
    <NodeViewWrapper as="span" style={{ display: 'contents' }}>
      <span
        ref={containerRef}
        contentEditable={false}
        style={containerStyle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onContextMenu={handleContextMenu}
        onPointerDown={isAbsolute ? startDrag : undefined}
      >
        <img
          src={src}
          alt={alt || ''}
          draggable={false}
          crossOrigin="anonymous"
          onLoad={onImgLoad}
          style={{
            display:       'block',
            width:         width  || 'auto',
            height:        height || 'auto',
            maxWidth:      '100%',
            pointerEvents: 'none',
          }}
        />

        {/* ── 8 resize handles ─────────────────────────────────── */}
        {showHandles && HANDLES.map(({ dir, cursor, style }) => (
          <span
            key={dir}
            style={{
              position:    'absolute',
              width:       14,
              height:      14,
              background:  'white',
              border:      '2px solid #2463eb',
              borderRadius: 3,
              zIndex:      20,
              boxShadow:   '0 1px 5px rgba(0,0,0,0.3)',
              cursor,
              ...style,
            }}
            onPointerDown={(e) => { e.stopPropagation(); startResize(e, dir) }}
          />
        ))}

        {/* ── Floating wrap-mode toolbar (shown when selected) ── */}
        {selected && (
          <span
            style={{
              position:   'absolute',
              top:        -48,
              left:       '50%',
              transform:  'translateX(-50%)',
              background: '#1e293b',
              borderRadius: 10,
              padding:    '4px 6px',
              display:    'inline-flex',
              gap:        2,
              zIndex:     30,
              boxShadow:  '0 4px 14px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap',
              pointerEvents: 'all',
            }}
          >
            {WRAP_MODES.map(({ mode, icon, label }) => (
              <button
                key={mode}
                title={label}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ wrapMode: mode }) }}
                style={{
                  background:  wrapMode === mode ? '#2463eb' : 'transparent',
                  border:      'none',
                  color:       'white',
                  padding:     '5px 7px',
                  borderRadius: 7,
                  cursor:      'pointer',
                  display:     'flex',
                  alignItems:  'center',
                  fontSize:    0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
              </button>
            ))}
          </span>
        )}

        {/* ── Context menu ─────────────────────────────────────── */}
        {contextMenu && (
          <>
            <span
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onPointerDown={() => setContextMenu(null)}
            />
            <span
              style={{
                position:     'fixed',
                left:         contextMenu.x,
                top:          contextMenu.y,
                background:   'white',
                borderRadius: 12,
                boxShadow:    '0 8px 32px rgba(0,0,0,0.18)',
                border:       '1px solid #e2e8f0',
                minWidth:     200,
                zIndex:       999,
                padding:      '6px 0',
                overflow:     'hidden',
              }}
            >
              <CtxItem icon="crop"   label="Crop image"   onClick={handleCrop}   />
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
              <CtxItem icon="delete" label="Delete image" onClick={handleDelete} danger />
            </span>
          </>
        )}
      </span>
    </NodeViewWrapper>
  )
}

function CtxItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onClick(e) }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 16px',
        background: hov ? '#f8fafc' : 'none',
        border: 'none', cursor: 'pointer',
        color: danger ? '#dc2626' : '#1e293b',
        fontSize: 13, textAlign: 'left',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17, color: danger ? '#dc2626' : '#64748b' }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

// ── TipTap extension definition ───────────────────────────────────────────────
export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src:      { default: null },
      alt:      { default: null },
      width:    { default: null },
      height:   { default: null },
      wrapMode: { default: 'inline' },
      posX:     { default: 0 },
      posY:     { default: 0 },
    }
  },

  parseHTML()  { return [{ tag: 'img[src]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)] },
  addNodeView() { return ReactNodeViewRenderer(ResizableImageView) },
})
