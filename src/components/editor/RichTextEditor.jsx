import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState, useRef } from 'react'
import { ResizableImage } from './extensions/ResizableImage'
import { CustomBulletList, CustomOrderedList } from './extensions/CustomLists'
import EditorToolbar from './EditorToolbar'
import ImageCropModal from './ImageCropModal'
import { EditorContext } from './EditorContext'

export default function RichTextEditor({ questionId, initialContent, onSave }) {
  const [cropState,  setCropState]  = useState(null)   // { src, onComplete }
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving' | 'saved' | 'error'
  const saveTimerRef = useRef(null)
  const mountedRef   = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // ── Auto-save helper ──────────────────────────────────────────────────────
  function scheduleAutoSave(content) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return
      if (onSave) {
        try {
          await onSave(content)
          if (mountedRef.current) setSaveStatus('saved')
        } catch {
          if (mountedRef.current) setSaveStatus('error')
        }
      } else {
        if (mountedRef.current) setSaveStatus('saved')
      }
    }, 1500)
  }

  // ── TipTap editor ─────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Placeholder.configure({ placeholder: 'Type your question here, or paste / insert an image…' }),
      ResizableImage,
      CustomBulletList,
      CustomOrderedList,
    ],
    content: initialContent || '',
    onUpdate: ({ editor: e }) => scheduleAutoSave(e.getJSON()),
    editorProps: {
      attributes: { class: 'quiz-editor-content' },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const blob = item.getAsFile()
            if (blob) uploadImageFile(blob)
            return true
          }
        }
        return false
      },
    },
  })

  // ── Image upload ──────────────────────────────────────────────────────────
  async function uploadImageFile(file) {
    if (!questionId || !editor) return
    try {
      const formData = new FormData()
      formData.append('images', file)
      const res   = await fetch(`/api/questions/${questionId}/images`, { method: 'POST', body: formData })
      const [img] = await res.json()
      editor.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: `/uploads/${img.filename}` } }).run()
    } catch (err) {
      console.error('Image upload failed', err)
    }
  }

  function insertImageUrl(url) {
    editor?.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: url } }).run()
  }

  // ── Crop request from NodeView ────────────────────────────────────────────
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
          onImageFile={uploadImageFile}
          onImageUrl={insertImageUrl}
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
