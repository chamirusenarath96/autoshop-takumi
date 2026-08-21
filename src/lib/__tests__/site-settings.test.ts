import { describe, it, expect, vi } from 'vitest'

const findGlobal = vi.fn()
vi.mock('@/lib/payload', () => ({
  getPayload: async () => ({ findGlobal }),
}))

const { getSiteSettings } = await import('../site-settings')

describe('getSiteSettings — shopName/address locale fallback', () => {
  it('resolves shopName/address for the active locale when both languages are present', async () => {
    findGlobal.mockResolvedValueOnce({
      shopNameJa: 'オートショップ匠',
      shopNameEn: 'Autoshop Takumi',
      addressJa: '仙台市',
      addressEn: 'Sendai',
      socialLinks: [],
    })
    const settings = await getSiteSettings('en')
    expect(settings.shopName).toBe('Autoshop Takumi')
    expect(settings.address).toBe('Sendai')
  })

  it('falls back to the other language when the active one is blank', async () => {
    findGlobal.mockResolvedValueOnce({
      shopNameJa: 'オートショップ匠',
      shopNameEn: '',
      addressJa: '仙台市',
      addressEn: undefined,
      socialLinks: [],
    })
    const settings = await getSiteSettings('en')
    expect(settings.shopName).toBe('オートショップ匠')
    expect(settings.address).toBe('仙台市')
  })

  it('returns an empty shopName and null address when both languages are blank', async () => {
    findGlobal.mockResolvedValueOnce({ shopNameJa: '', shopNameEn: '', addressJa: '', addressEn: '', socialLinks: [] })
    const settings = await getSiteSettings('ja')
    expect(settings.shopName).toBe('')
    expect(settings.address).toBeNull()
  })
})
