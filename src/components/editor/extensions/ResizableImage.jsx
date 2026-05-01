import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorContext } from '../EditorContext'

// ─────────────────────────────────────────────────────────────────────────────
//  ResizeOverlay — portal into document.body, OUTSIDE ProseMirror's DOM.
//  PM registers native listeners on .ProseMirror. Events here never reach PM.
// ─────────────────────────────────────────────────────────────────────────────

const DIRS    = ['nw','n','ne','e','se','s','sw','w']
const CURSORS = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize',
                  se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }

function getHandleXY(dir, r) {
  const cx = r.left + r.width  / 2 - 7
  const cy = r.top  + r.height / 2 - 7
  const rx = r.left + r.width  - 7
  const by = r.top  + r.height - 7
  return {
    nw: { left: r.left - 7, top: r.top - 7 },
    n:  { left: cx,          top: r.top - 7 },
    ne: { left: rx,          top: r.top - 7 },
    e:  { left: rx,          top: cy        },
    se: { left: rx,          top: by        },
    s:  { left: cx,          top: by        },
    sw: { left: r.left - 7,  top: by        },
    w:  { left: r.left - 7,  top: cy        },
  }[dir]
}

function ResizeOverlay({ imgEl, onResize }) {
  const [state, setState] = useState(null) // { rect, visTop, visBottom }
  const rafRef = useRef(null)

  useEffect(() => {
    if (!imgEl) return

    // Walk up to find the scrollable editor container — its top edge is
    // exactly where the navbar ends and content begins.
    function getScrollParent(el) {
      let node = el.parentElement
      while (node && node !== document.documentElement) {
        const { overflow, overflowY } = window.getComputedStyle(node)
        if (/auto|scroll/.test(overflow + overflowY)) return node
        node = node.parentElement
      }
      return document.documentElement
    }
    const scrollParent = getScrollParent(imgEl)

    function tick() {
      const r  = imgEl.getBoundingClientRect()
      const sr = scrollParent.getBoundingClientRect()
      const visTop    = Math.max(0, sr.top)
      const visBottom = Math.min(window.innerHeight, sr.bottom)

      // Completely outside visible editor area — hide
      if (r.bottom < visTop || r.top > visBottom ||
          r.right  < 0     || r.left > window.innerWidth) {
        setState(null)
      } else {
        setState(prev => {
          if (prev &&
              prev.rect.left === r.left && prev.rect.top  === r.top &&
              prev.rect.width === r.width && prev.rect.height === r.height &&
              prev.visTop === visTop && prev.visBottom === visBottom) return prev
          return { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, visTop, visBottom }
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [imgEl])

  function handleMouseDown(e, dir) {
    e.preventDefault()
    e.stopPropagation()

    const container = imgEl.parentElement
    const r      = imgEl.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const startW = r.width,   startH = r.height
    const ar     = startH > 0 ? startW / startH : 1
    const corner = dir.length === 2

    let lastW = startW, lastH = startH

    function calc(ev) {
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
      return [Math.round(nW), Math.round(nH)]
    }

    function onMove(ev) {
      const [nW, nH] = calc(ev)
      lastW = nW; lastH = nH
      // ── Direct DOM manipulation — zero React/PM overhead during drag ──
      imgEl.style.width      = nW + 'px'
      imgEl.style.height     = nH + 'px'
      if (container) {
        container.style.width  = nW + 'px'
        container.style.height = nH + 'px'
      }
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      // ── Commit final size to TipTap once, after drag ends ──
      onResize(lastW, lastH)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  if (!state) return null
  const { rect, visTop, visBottom } = state

  // Clamp the outline box so it never bleeds above the editor container
  const outTop    = Math.max(rect.top - 2, visTop)
  const outBottom = Math.min(rect.top + rect.height + 2, visBottom)
  const outH      = Math.max(0, outBottom - outTop)

  return createPortal(
    <>
      {outH > 0 && (
        <div style={{ position:'fixed', left:rect.left-2, top:outTop,
                      width:rect.width+4, height:outH,
                      border:'2px solid #2463eb', borderRadius:2,
                      pointerEvents:'none', zIndex:99998 }} />
      )}
      {DIRS.map(dir => {
        const pos = getHandleXY(dir, rect)
        // Hide handles that sit above the visible editor area (behind navbar)
        if (pos.top < visTop - 7 || pos.top > visBottom) return null
        return (
          <div key={dir} onMouseDown={(e) => handleMouseDown(e, dir)}
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
const WRAP_MODES = [
  { mode:'inline',  icon:'format_image_right', label:'Inline with text' },
  { mode:'left',    icon:'format_align_left',  label:'Float left' },
  { mode:'center',  icon:'format_align_center',label:'Center' },
  { mode:'right',   icon:'format_align_right', label:'Float right' },
  { mode:'inFront', icon:'flip_to_front',      label:'In front' },
  { mode:'behind',  icon:'flip_to_back',       label:'Behind' },
]

// ─────────────────────────────────────────────────────────────────────────────
function ResizableImageView({ node, updateAttributes, deleteNode, selected, editor, getPos }) {
  const { onCropRequest } = useEditorContext()
  const [hover,       setHover]       = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const imgRef          = useRef(null)
  const mountedRef      = useRef(true)
  // Always-fresh ref — avoids stale updateAttributes captured in drag closures
  const updateAttrsRef  = useRef(updateAttributes)
  updateAttrsRef.current = updateAttributes

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
      const el = e.currentTarget
      updateAttributes({ width:`${el.offsetWidth}px`, height:`${el.offsetHeight}px` })
    }
  }

  // Stable callback — always calls the freshest updateAttributes via ref
  const handleResize = useCallback((w, h) => {
    if (mountedRef.current) {
      updateAttrsRef.current({ width:`${w}px`, height:`${h}px` })
    }
  }, [])

  function startDrag(e) {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX, startY = e.clientY, origX = posX, origY = posY
    const imgDom = imgRef.current
    let lastX = origX, lastY = origY
    function onMove(ev) {
      lastX = origX + (ev.clientX - startX)
      lastY = origY + (ev.clientY - startY)
      // Direct DOM for smooth visual feedback during drag
      if (imgDom) { imgDom.style.left = lastX + 'px'; imgDom.style.top = lastY + 'px' }
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (mountedRef.current) updateAttrsRef.current({ posX: lastX, posY: lastY })
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  function insertParagraph(before) {
    const pos = getPos()
    const $pos = editor.state.doc.resolve(pos)
    let d = $pos.depth
    while (d > 0 && !$pos.node(d).type.isBlock) d--
    if (before) {
      const at = $pos.before(d)
      editor.chain().insertContentAt(at, { type: 'paragraph' }).setTextSelection(at + 1).run()
    } else {
      const at = $pos.after(d)
      editor.chain().insertContentAt(at, { type: 'paragraph' }).setTextSelection(at + 1).run()
    }
  }

  function handleContextMenu(e) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x:Math.min(e.clientX,window.innerWidth-220), y:Math.min(e.clientY,window.innerHeight-100) })
  }

  function handleCrop(e) {
    e.stopPropagation(); setContextMenu(null)
    if (onCropRequest) onCropRequest({ src, onComplete:(newSrc)=>updateAttributes({ src:newSrc, width:null, height:null }) })
  }

  function handleDelete(e) { e.stopPropagation(); setContextMenu(null); deleteNode() }

  const isAbsolute = wrapMode === 'inFront' || wrapMode === 'behind'

  // inFront/behind: zero-size inline anchor — text flows normally, image floats over/behind
  const containerStyle = isAbsolute
    ? { display:'inline-block', position:'relative', width:0, height:0, overflow:'visible',
        userSelect:'none', verticalAlign:'bottom' }
    : { position:'relative',
        display: wrapMode !== 'center' ? 'inline-block' : 'block',
        userSelect:'none', maxWidth:'100%', verticalAlign:'bottom', borderRadius:2,
        float:       wrapMode==='left' ? 'left' : wrapMode==='right' ? 'right' : 'none',
        marginRight: wrapMode==='left'   ? '1em' : undefined,
        marginLeft:  wrapMode==='right'  ? '1em' : wrapMode==='center' ? 'auto' : undefined,
        marginBottom:(wrapMode==='left'||wrapMode==='right'||wrapMode==='center') ? '0.5em' : undefined,
        marginTop:    wrapMode==='center' ? '0.5em' : undefined,
        width:  width   || undefined,
        height: (height && height !== 'auto') ? height : undefined,
      }

  const imgStyle = isAbsolute
    ? { display:'block', position:'absolute', left:posX, top:posY,
        width:width||'auto', height:height||'auto',
        zIndex: wrapMode==='inFront' ? 10 : -1, cursor:'move', userSelect:'none' }
    : { display:'block', width:width||'auto', height:height||'auto', maxWidth:'100%', pointerEvents:'none' }

  const showOverlay = selected || hover

  return (
    <NodeViewWrapper as="span" style={{ display:'contents' }}>
      <span contentEditable={false} style={containerStyle}
        onMouseEnter={!isAbsolute ? () => setHover(true)  : undefined}
        onMouseLeave={!isAbsolute ? () => setHover(false) : undefined}
        onContextMenu={!isAbsolute ? handleContextMenu : undefined}
      >
        <img ref={imgRef} src={src} alt={alt||''} draggable={false} crossOrigin="anonymous" onLoad={onImgLoad}
          onMouseEnter={isAbsolute ? () => setHover(true)  : undefined}
          onMouseLeave={isAbsolute ? () => setHover(false) : undefined}
          onMouseDown={isAbsolute ? startDrag : undefined}
          onContextMenu={isAbsolute ? handleContextMenu : undefined}
          style={imgStyle} />

        {/* Portal resize overlay — document.body, invisible to ProseMirror */}
        {showOverlay && imgRef.current && (
          <ResizeOverlay imgEl={imgRef.current} onResize={handleResize} />
        )}

        {/* Wrap mode toolbar */}
        {selected && (
          <span style={{ position:'absolute', top:-48, left:'50%', transform:'translateX(-50%)',
            background:'#1e293b', borderRadius:10, padding:'4px 6px', display:'inline-flex', alignItems:'center',
            gap:2, zIndex:30, boxShadow:'0 4px 14px rgba(0,0,0,0.35)', whiteSpace:'nowrap', pointerEvents:'all' }}>
            {WRAP_MODES.map(({ mode, icon, label }) => (
              <button key={mode} title={label}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ wrapMode:mode }) }}
                style={{ background:wrapMode===mode?'#2463eb':'transparent', border:'none', color:'white',
                         padding:'5px 7px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', fontSize:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:17 }}>{icon}</span>
              </button>
            ))}
            {!isAbsolute && <>
              <span style={{ width:1, height:20, background:'rgba(255,255,255,0.2)', margin:'0 3px' }} />
              <button title="Insert paragraph above"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertParagraph(true) }}
                style={{ background:'transparent', border:'none', color:'white', padding:'5px 7px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', fontSize:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:17 }}>vertical_align_top</span>
              </button>
              <button title="Insert paragraph below"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertParagraph(false) }}
                style={{ background:'transparent', border:'none', color:'white', padding:'5px 7px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', fontSize:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:17 }}>vertical_align_bottom</span>
              </button>
            </>}
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
export const ResizableImage = Node.create({
  name:'resizableImage', group:'inline', inline:true,
  selectable:true, draggable:false, atom:true,

  addAttributes() {
    return {
      src:{ default:null }, alt:{ default:null },
      width:{ default:null }, height:{ default:null },
      wrapMode:{ default:'inline' }, posX:{ default:0 }, posY:{ default:0 },
    }
  },

  parseHTML()  { return [{ tag:'img[src]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)] },
  addNodeView() { return ReactNodeViewRenderer(ResizableImageView) },
})
