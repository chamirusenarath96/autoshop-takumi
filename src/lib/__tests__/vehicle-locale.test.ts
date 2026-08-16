import { describe, it, expect } from 'vitest'
import type { SerializedEditorState } from 'lexical'
import {
  isTextPresent,
  isNumberPresent,
  isRichTextPresent,
  resolveLocalizedField,
  resolveLocalizedRichText,
} from '../vehicle-locale'

const emptyParagraphRichText = {
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [], direction: null, format: '', indent: 0, version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState

const populatedRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Hello', detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState

describe('isTextPresent', () => {
  it('treats a non-empty string as present', () => {
    expect(isTextPresent('hello')).toBe(true)
  })
  it('treats a whitespace-only string as blank', () => {
    expect(isTextPresent('   ')).toBe(false)
  })
  it('treats null/undefined as blank', () => {
    expect(isTextPresent(null)).toBe(false)
    expect(isTextPresent(undefined)).toBe(false)
  })
})

describe('isNumberPresent', () => {
  it('treats 0 as present', () => {
    expect(isNumberPresent(0)).toBe(true)
  })
  it('treats a positive number as present', () => {
    expect(isNumberPresent(4500000)).toBe(true)
  })
  it('treats null/undefined/NaN as blank', () => {
    expect(isNumberPresent(null)).toBe(false)
    expect(isNumberPresent(undefined)).toBe(false)
    expect(isNumberPresent(NaN)).toBe(false)
  })
})

describe('isRichTextPresent', () => {
  it('treats an empty-paragraph Lexical structure as blank', () => {
    expect(isRichTextPresent(emptyParagraphRichText)).toBe(false)
  })
  it('treats a populated Lexical structure as present', () => {
    expect(isRichTextPresent(populatedRichText)).toBe(true)
  })
  it('treats null/undefined as blank', () => {
    expect(isRichTextPresent(null)).toBe(false)
    expect(isRichTextPresent(undefined)).toBe(false)
  })
})

describe('resolveLocalizedField', () => {
  it('returns the active locale value when both are present', () => {
    expect(resolveLocalizedField('日本語タイトル', 'English Title', 'ja')).toBe('日本語タイトル')
    expect(resolveLocalizedField('日本語タイトル', 'English Title', 'en')).toBe('English Title')
  })

  it('falls back to the other language when the active one is blank', () => {
    expect(resolveLocalizedField('日本語タイトル', undefined, 'en')).toBe('日本語タイトル')
    expect(resolveLocalizedField(undefined, 'English Title', 'ja')).toBe('English Title')
    expect(resolveLocalizedField('日本語タイトル', '   ', 'en')).toBe('日本語タイトル')
  })

  it('returns undefined when both languages are blank', () => {
    expect(resolveLocalizedField(undefined, undefined, 'ja')).toBeUndefined()
    expect(resolveLocalizedField('   ', '', 'en')).toBeUndefined()
  })

  it('resolves each field independently (e.g. a spec row label vs value)', () => {
    const label = resolveLocalizedField('ラベル', undefined, 'en')
    const value = resolveLocalizedField(undefined, 'Value', 'en')
    expect(label).toBe('ラベル')
    expect(value).toBe('Value')
  })
})

describe('resolveLocalizedRichText', () => {
  it('returns the active locale value when present', () => {
    expect(resolveLocalizedRichText(populatedRichText, undefined, 'ja')).toEqual(populatedRichText)
  })

  it('falls back to the other language when the active one is an empty-paragraph structure', () => {
    expect(resolveLocalizedRichText(emptyParagraphRichText, populatedRichText, 'ja')).toEqual(populatedRichText)
  })

  it('returns undefined when both are blank/empty-paragraph', () => {
    expect(resolveLocalizedRichText(emptyParagraphRichText, null, 'en')).toBeUndefined()
  })
})
