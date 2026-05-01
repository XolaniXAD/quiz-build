import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorContext } from '../EditorContext'

// ─────────────────────────────────────────────────────────────────────────────
//  ResizeOverlay — rendered into document.body via createPortal.
//  Completely outside ProseMirror's DOM. PM never intercepts these events.
// ─────────────────────────────────────────────────────────────────────────────

const DIRS = ['nw','n','ne','e','se','s','sw','w']
const CURSORS = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }

function getHandlePos(dir, rect) {
  const { left: x, top: y, width: w, height: h } = rect
  const mx = x + w/2 - 7, my = y + h/2 - 7, r = x + w - 7, b = y + h - 7
  return { nw:{left:x-7,top:y-7}, n:{left:mx,top:y-7}, ne:{left:r,top:y-7}, e:{left:r,top:my},
           se:{left:r,top:b}, s:{left:mx,top:b}, sw:{left:x-7,top:b}, w:{left:x-7,top:my} }[dir]
}

function ResizeOverlay({ imgEl, onResize }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    let raf
    function tick() {
      if (!imgEl) return
      const r = imgEl.getBoundingClientRect()
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [imgEl])

  const startResize = useCallback((e, dir) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const r = imgEl.getBoundingClientRect()
    const startW = r.width, startH = r.height
    const ar = startH > 0 ? startW / startH : 1
    const corner = dir.length === 2

    function onMove(ev) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      let nW = startW, nH = startH
      if (dir.includes('e')) nW = Math.max(40, startW + dx)
      if (dir.includes('w')) nW = Math.max(40, startW - dx)
      if (dir.includes('s')) nH = Math.max(30, startH + dy)
      if (dir.includes('n')) nH = Math.max(30, startH - dy)
      if (corner) {
        if (Math.abs(dx) >= Math.abs(dy)) nH = Math.round(nW / ar)
        else nW = Math.round(nH * ar)
      }
      onResize(Math.round(nW), Math.round(nH))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [imgEl, onResize])

  if (!rect) return null

  return createPortal(
    <>
      <div style={{ position:'fixed', left:rect.left-2, top:rect.top-2, width:rect.width+4, height:rect.height+4,
                    border:'2px solid #2463eb', borderRadius:2, pointerEvents:'none', zIndex:99998 }} />
      {DIRS.map(dir => {
        const pos = getHandlePos(dir, rect)
        return (
          <div key={dir} onMouseDown={(e) => startResize(e, dir)}
            style={{ position:'fixed', left:pos.left, top:pos.top, width:14, height:14,
                     background:'white', border:'2px solid #2463eb', borderRadius:3,
                     cursor:CURSORS[dir], zIndex:99999, boxShadow:'0 1px 6px rgba(0,0,0,0.35)' }} />
        )
      })}
    </>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Wrap modes toolbar config
// ─────────────────────────────────────────────────────────────────────────────

const WRAP_MODES = [
  { mode:'inline',  icon:'format_image_right', label:'Inline with text' },
  { mode:'left',    icon:'format_align_left',  label:'Float left' },
  { mode:'center',  icon:'format_align_center',label:'Center' },
  { mode:'right',   icon:'format_align_right', label:'Float right' },
  { mode:'inFront', icon:'flip_to_front',      label:'In front' },
  { mode:'behind',  icon:'flip_to_back',       label:'Behind' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  NodeView — only the <img> + toolbar + context menu live in PM's DOM.
//  Resize handles are portal'd into document.body — PM can't interfere.
// ─────────────────────────────────────────────────────────────────────────────

function ResizableImageView({ node, updateAttributes, deleteNode, selected }) {
  const { onCropRequest } = useEditorContext()
  const [hover,       setHover]       = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const imgRef     = useRef(null)
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [contextMenu])

  const { src, alt, width, height, wrapMode = 'inline', posX = 0, posY = 0 } = node.attrs

  function onImgLoad(e) {
    if (!node.attrs.width && !node.attrs.height) {
      updateAttributes({ width:`${e.currentTarget.naturalWidth}px`, height:`${e.currentTarget.naturalHeight}px` })
    }
  }

  const handleResize = useCallback((w, h) => {
    if (mountedRef.current) updateAttributes({ width:`${w}px`, height:`${h}px` })
  }, [updateAttributes])

  function startDrag(e) {
    if (wrapMode !== 'inFront' && wrapMode !== 'behind') return
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startY = e.clientY, origX = posX, origY = posY
    function onMove(ev) {
      if (!mountedRef.current) return
      updateAttributes({ posX: origX+(ev.clientX-startX), posY: origY+(ev.clientY-startY) })
    }
    function onUp() { window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  function handleContextMenu(e) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth-220), y: Math.min(e.clientY, window.innerHeight-100) })
  }

  function handleCrop(e) {
    e.stopPropagation(); setContextMenu(null)
    if (onCropRequest) onCropRequest({ src, onComplete:(newSrc) => updateAttributes({ src:newSrc, width:null, height:null }) })
  }

  function handleDelete(e) { e.stopPropagation(); setContextMenu(null); deleteNode() }

  const isAbsolute = wrapMode === 'inFront' || wrapMode === 'behind'
  const containerStyle = {
    position:      isAbsolute ? 'absolute' : 'relative',
    display:       (!isAbsolute && wrapMode !== 'center') ? 'inline-block' : 'block',
    userSelect:    'none',
    maxWidth:      '100%',
    verticalAlign: !isAbsolute ? 'bottom' : undefined,
    borderRadius:  2,
    cursor:        isAbsolute ? 'move' : 'default',
    zIndex:        wrapMode === 'inFront' ? 10 : wrapMode === 'behind' ? -1 : 'auto',
    left: isAbsolute ? posX : undefined, top: isAbsolute ? posY : undefined,
    float:       wrapMode === 'left' ? 'left' : wrapMode === 'right' ? 'right' : 'none',
    marginRight: wrapMode === 'left'   ? '1em' : undefined,
    marginLeft:  wrapMode === 'right'  ? '1em' : wrapMode === 'center' ? 'auto' : undefined,
    marginBottom:(wrapMode==='left'||wrapMode==='right'||wrapMode==='center') ? '0.5em' : undefined,
    marginTop:   wrapMode === 'center' ? '0.5em' : undefined,
  }
  if (width)                       containerStyle.width  = width
  if (height && height !== 'auto') containerStyle.height = height

  const showOverlay = selected || hover

  return (
    <NodeViewWrapper as="span" style={{ display:'contents' }}>
      <span contentEditable={false} style={containerStyle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onContextMenu={handleContextMenu}
        onMouseDown={isAbsolute ? startDrag : undefined}
      >
        <img ref={imgRef} src={src} alt={alt||''} draggable={false} crossOrigin="anonymous" onLoad={onImgLoad}
          style={{ display:'block', width:width||'auto', height:height||'auto', maxWidth:'100%' }} />

        {/* Portal resize overlay — document.body, outside ProseMirror */}
        {showOverlay && imgRef.current && (
          <ResizeOverlay imgEl={imgRef.current} onResize={handleResize} />
        )}

        {/* Wrap mode toolbar */}
        {selected && (
          <span style={{ position:'absolute', top:-48, left:'50%', transform:'translateX(-50%)',
            background:'#1e293b', borderRadius:10, padding:'4px 6px', display:'inline-flex',
            gap:2, zIndex:30, boxShadow:'0 4px 14px rgba(0,0,0,0.35)', whiteSpace:'nowrap', pointerEvents:'all' }}>
            {WRAP_MODES.map(({ mode, icon, label }) => (
              <button key={mode} title={label}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ wrapMode:mode }) }}
                style={{ background:wrapMode===mode?'#2463eb':'transparent', border:'none', color:'white',
                         padding:'5px 7px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', fontSize:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:17 }}>{icon}</span>
              </button>
            ))}
          </span>
        )}

        {/* Context menu */}
        {contextMenu && (
          <>
            <span style={{ position:'fixed', inset:0, zIndex:998 }} onMouseDown={() => setContextMenu(null)} />
            <span style={{ position:'fixed', left:contextMenu.x, top:contextMenu.y, background:'white', borderRadius:12,
              boxShadow:'0 8px 32px rgba(0,0,0,0.18)', border:'1px solid #e2e8f0', minWidth:200, zIndex:999, padding:'6px 0', overflow:'hidden' }}>
              <CtxItem icon="crop"   label="Crop image"   onClick={handleCrop}   />
              <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }} />
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
    <button onMouseDown={(e) => { e.preventDefault(); onClick(e) }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 16px',
        background:hov?'#f8fafc':'none', border:'none', cursor:'pointer',
        color:danger?'#dc2626':'#1e293b', fontSize:13, textAlign:'left', fontFamily:'Inter, sans-serif' }}>
      <span className="material-symbols-outlined" style={{ fontSize:17, color:danger?'#dc2626':'#64748b' }}>{icon}</span>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  TipTap extension
// ─────────────────────────────────────────────────────────────────────────────

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: false,
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
