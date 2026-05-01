import { createContext, useContext } from 'react'

export const EditorContext = createContext({
  questionId: null,
  onCropRequest: null,
})

export function useEditorContext() {
  return useContext(EditorContext)
}
