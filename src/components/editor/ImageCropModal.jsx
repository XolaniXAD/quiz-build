import { useState, useRef, useEffect, useCallback } from 'react'

// 8 handle directions for the crop marquee
const HANDLES = ['nw','n','ne','e','se','s','sw','w']

// Position each handle on the border of the crop rect
function handleStyle(dir, crop) {
  const { x, y, w, h } = crop
  const map = {
    nw: { left: x - 6,         top: y - 6          },
    n:  { left: x + w/2 - 6,   top: y - 6          },
    ne: { left: x + w - 6,     top: y - 6          },
    e:  { left: x + w - 6,     top: y + h/2 - 6    },
    se: { left: x + w - 6,     top: y + h - 6      },
    s:  { left: x + w/2 - 6,   top: y + h - 6      },
    sw: { left: x - 6,         top: y + h - 6      },
    w:  { left: x - 6,         top: y + h/2 - 6    },
  }
  const cursors = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }
  return { ...map[dir], cursor: cursors[dir] }
}

export default function ImageCropModal({ imageSrc, questionId, onComplete, onCancel }) {
  // imgRect: rendered image's {x, y, w, h} relative to the container div
  const [imgRect,  setImgRect]  = useState(null)
  // crop: {x, y, w, h} in pixels relative to the container (same coord space as imgRect)
  const [crop,     setCrop]     = useState(null)
  const [loading,  setLoading]  = useState(false)

  const containerRef = useRef(null)
  const imgRef       = useRef(null)
  // Refs for drag closure — avoids stale state
  const cropRef    = useRef(null)
  const imgRectRef = useRef(null)

  // Keep refs in sync
  useEffect(() => { cropRef.current    = crop    }, [crop])
  useEffect(() => { imgRectRef.current = imgRect }, [imgRect])

  // Measure image position once it loads
  const onImgLoad = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return
    const cRect = containerRef.current.getBoundingClientRect()
    const iRect = imgRef.current.getBoundingClientRect()
    const rect = {
      x: iRect.left - cRect.left,
      y: iRect.top  - cRect.top,
      w: iRect.width,
      h: iRect.height,
    }
    setImgRect(rect)
    setCrop({ x: rect.x, y: rect.y, w: rect.w, h: rect.h })
  }, [])

  // ── Handle drag ──────────────────────────────────────────────────────────
  function startHandle(e, dir) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const orig   = { ...cropRef.current }
    const ir     = imgRectRef.current

    function onMove(ev) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let { x, y, w, h } = orig

      // Adjust edges based on handle direction
      if (dir.includes('n')) { y = orig.y + dy; h = orig.h - dy }
      if (dir.includes('s')) { h = orig.h + dy }
      if (dir.includes('w')) { x = orig.x + dx; w = orig.w - dx }
      if (dir.includes('e')) { w = orig.w + dx }

      // Enforce minimum size
      const MIN = 20
      if (w < MIN) { if (dir.includes('w')) x = orig.x + orig.w - MIN; w = MIN }
      if (h < MIN) { if (dir.includes('n')) y = orig.y + orig.h - MIN; h = MIN }

      // Clamp to image bounds
      const maxX = ir.x + ir.w - w
      const maxY = ir.y + ir.h - h
      x = Math.max(ir.x, Math.min(x, maxX))
      y = Math.max(ir.y, Math.min(y, maxY))
      w = Math.min(w, ir.x + ir.w - x)
      h = Math.min(h, ir.y + ir.h - y)

      setCrop({ x, y, w, h })
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }

  // ── Move entire crop rect ─────────────────────────────────────────────────
  function startMove(e) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const orig   = { ...cropRef.current }
    const ir     = imgRectRef.current

    function onMove(ev) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const x = Math.max(ir.x, Math.min(ir.x + ir.w - orig.w, orig.x + dx))
      const y = Math.max(ir.y, Math.min(ir.y + ir.h - orig.h, orig.y + dy))
      setCrop({ ...orig, x, y })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }

  // ── Apply crop via canvas ─────────────────────────────────────────────────
  async function handleApply() {
    if (!crop || !imgRef.current || loading) return
    setLoading(true)
    try {
      const img = imgRef.current
      const ir  = imgRectRef.current

      // Scale factors from rendered → natural pixel size
      const scaleX = img.naturalWidth  / ir.w
      const scaleY = img.naturalHeight / ir.h

      // Crop coords in natural pixels (relative to image top-left)
      const sx = (crop.x - ir.x) * scaleX
      const sy = (crop.y - ir.y) * scaleY
      const sw = crop.w * scaleX
      const sh = crop.h * scaleY

      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(sw)
      canvas.height = Math.round(sh)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })

      if (questionId) {
        const formData = new FormData()
        formData.append('images', file)
        const resp  = await fetch(`/api/questions/${questionId}/images`, { method: 'POST', body: formData })
        const [saved] = await resp.json()
        onComplete(`/uploads/${saved.filename}`)
      } else {
        onComplete(URL.createObjectURL(blob))
      }
    } catch (err) {
      console.error('Crop failed', err)
      setLoading(false)
    }
  }

  const containerW = imgRect ? imgRect.w + 80 : 'min(90vw, 900px)'
  const containerH = imgRect ? imgRect.h + 80 : '75vh'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#111',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* ── Stage ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width:    containerW,
          height:   containerH,
          flexShrink: 0,
        }}
      >
        {/* Image */}
        <img
          ref={imgRef}
          src={imageSrc}
          onLoad={onImgLoad}
          crossOrigin="anonymous"
          draggable={false}
          style={{
            position:   'absolute',
            top:        '50%',
            left:       '50%',
            transform:  'translate(-50%, -50%)',
            maxWidth:   'min(90vw, 840px)',
            maxHeight:  '72vh',
            display:    'block',
            userSelect: 'none',
          }}
        />

        {/* ── Dark overlay panels (outside crop rect) ─────────── */}
        {crop && imgRect && (() => {
          const { x, y, w, h } = crop
          const { x: ix, y: iy, w: iw, h: ih } = imgRect
          const panels = [
            // top band
            { left: ix,       top: iy,       width: iw,            height: y - iy       },
            // bottom band
            { left: ix,       top: y + h,    width: iw,            height: iy + ih - y - h },
            // left strip (between top and bottom bands)
            { left: ix,       top: y,        width: x - ix,        height: h            },
            // right strip
            { left: x + w,    top: y,        width: ix + iw - x - w, height: h          },
          ]
          return panels.map((s, i) => (
            <div key={i} style={{
              position: 'absolute', background: 'rgba(0,0,0,0.55)',
              pointerEvents: 'none', ...s,
            }} />
          ))
        })()}

        {/* ── Crop border + grid lines ─────────────────────────── */}
        {crop && (
          <div
            style={{
              position: 'absolute',
              left: crop.x, top: crop.y,
              width: crop.w, height: crop.h,
              border: '1.5px solid rgba(255,255,255,0.9)',
              boxSizing: 'border-box',
              cursor: 'move',
            }}
            onPointerDown={startMove}
          >
            {/* Rule-of-thirds grid */}
            {[1,2].map(n => (
              <div key={'v'+n} style={{
                position:'absolute', top:0, bottom:0,
                left: `${n*100/3}%`, width:1,
                background:'rgba(255,255,255,0.25)',
                pointerEvents:'none',
              }} />
            ))}
            {[1,2].map(n => (
              <div key={'h'+n} style={{
                position:'absolute', left:0, right:0,
                top: `${n*100/3}%`, height:1,
                background:'rgba(255,255,255,0.25)',
                pointerEvents:'none',
              }} />
            ))}
          </div>
        )}

        {/* ── 8 resize handles ─────────────────────────────────── */}
        {crop && HANDLES.map(dir => {
          const { left, top, cursor } = handleStyle(dir, crop)
          return (
            <div
              key={dir}
              style={{
                position:   'absolute',
                left, top,
                width:      12, height: 12,
                background: 'white',
                border:     '2px solid #2463eb',
                borderRadius: 2,
                cursor,
                zIndex: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
              onPointerDown={(e) => startHandle(e, dir)}
            />
          )
        })}
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, margin:0 }}>
          Drag handles to crop · Drag inside to move · Corner handles lock aspect ratio
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding:'10px 28px', borderRadius:10,
              border:'1px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.1)',
              color:'white', cursor:'pointer', fontSize:14,
              fontFamily:'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !crop}
            style={{
              padding:'10px 28px', borderRadius:10, border:'none',
              background: loading ? '#64748b' : '#2463eb',
              color:'white', cursor: loading ? 'wait' : 'pointer',
              fontSize:14, fontWeight:600,
              fontFamily:'Inter, sans-serif',
            }}
          >
            {loading ? 'Saving…' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}

