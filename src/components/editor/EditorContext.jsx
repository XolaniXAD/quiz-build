/**
 * src/components/editor/EditorContext.jsx — context bridge for editor sub-components
 * ────────────────────────────────────────────────────────────────────────────────────
 * Allows deep children (ResizableImage NodeView) to reach editor-level
 * callbacks without prop-drilling through TipTap's node view renderer.
 *
 * Shape: { questionId: number|null, onCropRequest: function|null }
 *   questionId       — forwarded to ImageCropModal so it can upload the result
 *   onCropRequest({ src, onComplete }) — called by ResizableImage to open crop
 *
 * Provider:  <RichTextEditor> wraps its output in <EditorContext.Provider>
 * Consumer:  ResizableImage calls useEditorContext() to get onCropRequest
 */
import { createContext, useContext } from 'react'

export const EditorContext = createContext({
  questionId: null,
  onCropRequest: null,
})

export function useEditorContext() {
  return useContext(EditorContext)
}
