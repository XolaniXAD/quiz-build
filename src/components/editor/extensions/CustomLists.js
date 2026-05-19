/**
 * src/components/editor/extensions/CustomLists.js — list type extensions
 * ──────────────────────────────────────────────────────────────────────
 * Extends TipTap's BulletList and OrderedList to carry a `listType` attribute.
 * Stored as a `data-list-type` HTML attribute on the <ul> / <ol> element.
 *
 * CSS in src/index.css maps data-list-type values to visual list styles.
 *
 * To add a new list style:
 *   1. Add a CSS rule in src/index.css targeting the new data-list-type value
 *   2. Add the option to BULLET_TYPES or ORDERED_TYPES in EditorToolbar.jsx
 *
 * Registered in: RichTextEditor.jsx extensions array
 * Controlled by: BulletDropdown + OrderedDropdown in EditorToolbar.jsx
 */
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listType: {
        default: 'disc',
        parseHTML: (el) => el.getAttribute('data-list-type') || 'disc',
        renderHTML: (attrs) => ({ 'data-list-type': attrs.listType }),
      },
    }
  },
})

export const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listType: {
        default: 'decimal',
        parseHTML: (el) => el.getAttribute('data-list-type') || 'decimal',
        renderHTML: (attrs) => ({ 'data-list-type': attrs.listType }),
      },
    }
  },
})
