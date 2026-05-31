/**
 * src/components/editor/RichTextEditor.jsx — TipTap rich text editor
 * ───────────────────────────────────────────────────────────────────
 * Props:
 *   questionId:       number|null  — ID used for image upload endpoint
 *   initialContent:   object|''   — TipTap JSON doc to pre-load
 *   onSave(content):  function    — called with TipTap JSON after AUTOSAVE_DELAY_MS
 *
 * Auto-save:  every content change debounces AUTOSAVE_DELAY_MS → calls onSave(json)
 * Images:     paste or toolbar → uploadImages() → POST /api/questions/:id/images
 * Crop:       right-click image → opens <ImageCropModal> overlay
 *
 * TipTap extensions (order matters — StarterKit must be first):
 *   StarterKit          — base (bulletList/orderedList disabled; Custom* replaces them)
 *   TextAlign           — left/center/right on headings + paragraphs
 *   Highlight           — yellow highlight mark
 *   TextStyle           — base <span> mark; required by Color + FontSize
 *   Color               — inline text color (extends TextStyle)
 *   FontSize            — inline font-size (extends TextStyle, built into @tiptap/extension-text-style)
 *   Placeholder         — ghost text when editor is empty
 *   ResizableImage      — custom node: drag-resizable images with wrap modes
 *   CustomBulletList    — extends BulletList with listType attribute
 *   CustomOrderedList   — extends OrderedList with listType attribute
 *
 * Context provided: EditorContext { questionId, onCropRequest }
 *   → consumed by ResizableImage NodeView to trigger crop modal
 *
 * ⚠️  TipTap v3: FontSize and Color MUST be imported from
 *     @tiptap/extension-text-style. Do NOT use a custom FontSize extension —
 *     it will conflict with the built-in and break setFontSize.
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useState, useRef } from 'react'
import { ResizableImage } from './extensions/ResizableImage'
import { CustomBulletList, CustomOrderedList } from './extensions/CustomLists'
import EditorToolbar from './EditorToolbar'
import ImageCropModal from './ImageCropModal'
import { EditorContext } from './EditorContext'
import { uploadImages } from '../../api/index'
import { AUTOSAVE_DELAY_MS, EDITOR_PLACEHOLDER } from '../../constants'

export default function RichTextEditor({ questionId, initialContent, onSave }) {
  const [cropState,  setCropState]  = useState(null)    // { src, onComplete } | null
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving' | 'saved' | 'error'
  const saveTimerRef = useRef(null)
  const mountedRef   = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Auto-save ─────────────────────────────────────────────────────────────
  // Resets the timer on every content change. Fires onSave() once the editor
  // has been idle for AUTOSAVE_DELAY_MS ms.
  function scheduleAutoSave(content) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return
      try {
        if (onSave) await onSave(content)
        if (mountedRef.current) setSaveStatus('saved')
      } catch {
        if (mountedRef.current) setSaveStatus('error')
      }
    }, AUTOSAVE_DELAY_MS)
  }

  // ── TipTap instance ───────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bulletList: false, orderedList: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle,   // must come before Color + FontSize (they extend it)
      Color,
      FontSize,
      Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
      ResizableImage,
      CustomBulletList,
      CustomOrderedList,
    ],
    content: initialContent || '',
    onUpdate: ({ editor: e }) => scheduleAutoSave(e.getJSON()),
    editorProps: {
      attributes: { class: 'quiz-editor-content' },
      handleKeyDown: (_view, event) => {
        const mod = event.ctrlKey || event.metaKey
        if (!mod) return false
        const key = event.key.toLowerCase()
        // Ctrl/Cmd + A — select all content in the editor
        if (key === 'a') {
          event.preventDefault()
          editor?.commands.selectAll()
          return true
        }
        // Ctrl/Cmd + C and X — let the browser fire the native copy/cut DOM
        // events, which ProseMirror intercepts to serialise the selection to
        // the clipboard (preserving rich-text formatting).
        if (key === 'c' || key === 'x') return false
        return false
      },
      handlePaste: (_view, event) => {
        // Intercept image pastes → upload to server instead of embedding base64
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const blob = item.getAsFile()
            if (blob) handleImageFile(blob)
            return true
          }
        }
        return false
      },
    },
  })

  // ── Image handling ────────────────────────────────────────────────────────
  async function handleImageFile(file) {
    if (!questionId || !editor) return
    try {
      const [img] = await uploadImages(questionId, [file])
      editor.chain().focus().insertContent({
        type: 'resizableImage',
        attrs: { src: `/uploads/${img.filename}` },
      }).run()
      // If the cursor is now at the end of its block (common after pasting
      // an image into an empty paragraph or at the end of content), split
      // the block so the user has an empty paragraph to type into below.
      const { $to } = editor.state.selection
      if ($to.pos === $to.end()) {
        editor.commands.splitBlock()
      }
    } catch (err) {
      console.error('Image upload failed', err)
    }
  }

  function handleImageUrl(url) {
    if (!editor) return
    editor.chain().focus().insertContent({
      type: 'resizableImage',
      attrs: { src: url },
    }).run()
    // Same newline-after-image UX as handleImageFile
    const { $to } = editor.state.selection
    if ($to.pos === $to.end()) {
      editor.commands.splitBlock()
    }
  }

  // ── Crop modal ────────────────────────────────────────────────────────────
  // ResizableImage NodeView calls onCropRequest via EditorContext
  function handleCropRequest({ src, onComplete }) {
    setCropState({ src, onComplete })
  }

  function handleCropDone(newSrc) {
    cropState?.onComplete(newSrc)
    setCropState(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <EditorContext.Provider value={{ questionId, onCropRequest: handleCropRequest }}>
      <div className="quiz-editor-wrap">
        <EditorToolbar
          editor={editor}
          onImageFile={handleImageFile}
          onImageUrl={handleImageUrl}
          saveStatus={saveStatus}
        />
        <EditorContent editor={editor} />
      </div>

      {cropState && (
        <ImageCropModal
          imageSrc={cropState.src}
          questionId={questionId}
          onComplete={handleCropDone}
          onCancel={() => setCropState(null)}
        />
      )}
    </EditorContext.Provider>
  )
}
