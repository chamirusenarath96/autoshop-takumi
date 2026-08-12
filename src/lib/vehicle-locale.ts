import { hasText } from '@payloadcms/richtext-lexical/shared'
import type { SerializedEditorState } from 'lexical'

export type VehicleLocale = 'ja' | 'en'

/** A value is "present" for a plain text/textarea field if non-empty after trimming. */
export function isTextPresent(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** A value is "present" for a number field if it's a finite number — `0` counts as present. */
export function isNumberPresent(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Lexical can persist a non-null JSON structure (an empty paragraph node) when a user
 * clears all richText content, so a plain truthiness check would wrongly treat it as present.
 */
export function isRichTextPresent(value: unknown): value is SerializedEditorState {
  return hasText(value as SerializedEditorState | null | undefined)
}

/**
 * Resolves a paired text/textarea field's display value for the active locale, falling back
 * to the other language when the active one is blank. Returns undefined when both are blank.
 */
export function resolveLocalizedField(
  valueJa: string | null | undefined,
  valueEn: string | null | undefined,
  activeLocale: VehicleLocale,
): string | undefined {
  const active = activeLocale === 'ja' ? valueJa : valueEn
  const other = activeLocale === 'ja' ? valueEn : valueJa
  if (isTextPresent(active)) return active
  if (isTextPresent(other)) return other
  return undefined
}

/** Same fallback rule as resolveLocalizedField, for the richText description pair. */
export function resolveLocalizedRichText(
  valueJa: SerializedEditorState | null | undefined,
  valueEn: SerializedEditorState | null | undefined,
  activeLocale: VehicleLocale,
): SerializedEditorState | undefined {
  const active = activeLocale === 'ja' ? valueJa : valueEn
  const other = activeLocale === 'ja' ? valueEn : valueJa
  if (isRichTextPresent(active)) return active
  if (isRichTextPresent(other)) return other
  return undefined
}
