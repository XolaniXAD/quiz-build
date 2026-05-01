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
