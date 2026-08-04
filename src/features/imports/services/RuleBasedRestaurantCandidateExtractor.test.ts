import { describe, expect, it } from 'vitest'
import { RuleBasedRestaurantCandidateExtractor } from './RuleBasedRestaurantCandidateExtractor'

describe('RuleBasedRestaurantCandidateExtractor', () => {
  it('suggests multiple drafts with evidence without creating restaurants', async () => {
    const candidates = await new RuleBasedRestaurantCandidateExtractor().extract('山海咖啡\n台北市大安區和平東路 1 號\n深夜拉麵店')
    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatchObject({ name: '山海咖啡', address: '台北市大安區和平東路 1 號', evidence: '山海咖啡', latitude: null })
  })

  it('handles blank and unrecognised text safely', async () => {
    await expect(new RuleBasedRestaurantCandidateExtractor().extract('   \n推薦好吃')).resolves.toEqual([])
  })
})