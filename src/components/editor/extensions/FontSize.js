/**
 * src/components/editor/extensions/FontSize.js — UNUSED (kept for reference)
 * ─────────────────────────────────────────────────────────────────────────
 * NOT imported anywhere — TipTap v3 ships FontSize natively.
 * See RichTextEditor.jsx: import { TextStyle, FontSize } from '@tiptap/extension-text-style'
 *
 * Do NOT re-enable this file. Using this custom extension alongside the
 * built-in FontSize causes a naming conflict (both name: 'fontSize') and
 * silently breaks the setFontSize command.
 *
 * To customise font-size behaviour, extend the built-in instead:
 *   import { FontSize } from '@tiptap/extension-text-style'
 *   const MyFontSize = FontSize.extend({ ... })
 */
import { Extension } from '@tiptap/core'

// Custom FontSize extension built on top of TextStyle marks.
// Sets/unsets an inline font-size via the style attribute.
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {}
              return { style: `font-size: ${attrs.fontSize}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ commands }) =>
          commands.setMark('textStyle', { fontSize: size }),
      unsetFontSize:
        () =>
        ({ commands }) =>
          commands.unsetMark('textStyle', { extendsEmptyMarkRange: true }),
    }
  },
})

export default FontSize
