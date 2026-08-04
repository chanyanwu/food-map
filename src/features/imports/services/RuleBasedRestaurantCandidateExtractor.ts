import type { RestaurantCandidate, RestaurantCandidateExtractor } from './RestaurantCandidateExtractor'

const nameHint = /店|館|餐廳|咖啡|拉麵|燒肉|火鍋/
const addressHint = /(?:台北|新北|桃園|台中|台南|高雄|縣|市|區|路|街|巷|號)/

export class RuleBasedRestaurantCandidateExtractor implements RestaurantCandidateExtractor {
  async extract(sourceText: string): Promise<RestaurantCandidate[]> {
    const lines = sourceText.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    return lines.filter(line => nameHint.test(line)).map((name, index) => {
      const address = lines.find(line => addressHint.test(line)) ?? ''
      return { id: `suggestion-${index}`, name, address, area: '', category: '', rating: null, mentionedDishes: [], notes: '', confidence: null, evidence: name, latitude: null, longitude: null }
    })
  }
}