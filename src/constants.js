/**
 * src/constants.js — application-wide constants
 * ──────────────────────────────────────────────
 * All magic numbers and shared configuration strings live here.
 * Import from this file — never hardcode these values in components.
 *
 * To change auto-save timing:     edit AUTOSAVE_DELAY_MS / TITLE_SAVE_DELAY_MS
 * To change available font sizes: edit EDITOR_FONT_SIZES
 * To add a question type:         add its key to QUESTION_TYPES, then add a
 *   TYPE_META entry in QuestionCard.jsx and an option in QuestionTypePicker.jsx
 */

// ── Timing (milliseconds) ─────────────────────────────────────────────────────

/** Wait after last editor keystroke before auto-saving question content */
export const AUTOSAVE_DELAY_MS = 1500

/** Wait after last title keystroke before saving quiz title to API */
export const TITLE_SAVE_DELAY_MS = 1200

// ── Question types ────────────────────────────────────────────────────────────

/** All valid question type strings. Keep in sync with QuestionCard TYPE_META
 *  and QuestionTypePicker options. */
export const QUESTION_TYPES = [
  'multiple_choice',
  'checkbox',
  'drag_drop_order',
  'drag_drop_fill',
  'dropdown',
]

// ── Editor ────────────────────────────────────────────────────────────────────

/** Placeholder shown in the TipTap editor when content is empty */
export const EDITOR_PLACEHOLDER = 'Type your question here, or paste / insert an image…'

/** Preset font sizes (px) listed in the FontSizeDropdown toolbar button */
export const EDITOR_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

/** Font size shown in the toolbar when no fontSize mark is active on the cursor */
export const EDITOR_DEFAULT_FONT_SIZE = 15
