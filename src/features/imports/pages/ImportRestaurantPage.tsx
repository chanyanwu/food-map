import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { Brand } from '../../../shared/components/Brand'
import { useAuth } from '../../authentication/hooks/useAuth'
import { validateCoordinates } from '../../restaurants/models/coordinates'
import type { CreateRestaurantInput } from '../../restaurants/models/restaurant'
import { FirebaseRestaurantRepository } from '../../restaurants/repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../../restaurants/repositories/RestaurantRepository'
import { maximumMentionedDishes, sourcePlatforms, validateMentionedDishes, type CreateRestaurantSourceInput, type SourcePlatform } from '../models/restaurantSource'
import { FirebaseRestaurantSourceRepository } from '../repositories/FirebaseRestaurantSourceRepository'
import type { RestaurantSourceRepository } from '../repositories/RestaurantSourceRepository'
import { BrowserOcrService } from '../services/BrowserOcrService'
import type { OcrProgress, OcrService } from '../services/OcrService'
import type { RestaurantCandidate, RestaurantCandidateExtractor } from '../services/RestaurantCandidateExtractor'
import { RestaurantImportService, RestaurantSourceSaveError } from '../services/RestaurantImportService'
import { RuleBasedRestaurantCandidateExtractor } from '../services/RuleBasedRestaurantCandidateExtractor'
import { type SelectedImage, validateImages } from '../services/imageValidation'

interface ImportRestaurantPageProps {
  restaurantRepository?: RestaurantRepository
  sourceRepository?: RestaurantSourceRepository
  ocrService?: OcrService
  candidateExtractor?: RestaurantCandidateExtractor
}

const emptyCandidate = (): RestaurantCandidate => ({ id: crypto.randomUUID(), name: '', address: '', area: '', category: '', rating: null, mentionedDishes: [], notes: '', confidence: null, evidence: '', latitude: null, longitude: null })

export function ImportRestaurantPage({ restaurantRepository, sourceRepository, ocrService, candidateExtractor }: ImportRestaurantPageProps) {
  const { state } = useAuth()
  const navigate = useNavigate()
  const services = useRef(createFirebaseServices(firebaseWebConfig)).current
  const [restaurants] = useState(() => restaurantRepository ?? new FirebaseRestaurantRepository(services.firestore))
  const [sources] = useState(() => sourceRepository ?? new FirebaseRestaurantSourceRepository(services.firestore))
  const [ocr] = useState(() => ocrService ?? new BrowserOcrService())
  const [extractor] = useState(() => candidateExtractor ?? new RuleBasedRestaurantCandidateExtractor())
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>('Instagram')
  const [sourceNote, setSourceNote] = useState('')
  const [manualSourceText, setManualSourceText] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [combinedSourceText, setCombinedSourceText] = useState('')
  const [images, setImages] = useState<SelectedImage[]>([])
  const imagesRef = useRef<SelectedImage[]>([])
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [candidates, setCandidates] = useState<RestaurantCandidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null)
  const ownerId = state.kind === 'authenticated' ? state.user.id : null

  useEffect(() => {
    imagesRef.current = images
  }, [images])
  useEffect(() => () => imagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl)), [])

  function regenerateCombinedText() {
    setCombinedSourceText(combineSourceText(manualSourceText, ocrText))
  }

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const validationError = validateImages(files, images.length)
    event.target.value = ''
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setImages(current => [...current, ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))])
  }

  function removeImage(previewUrl: string) {
    setImages(current => {
      const image = current.find(item => item.previewUrl === previewUrl)
      if (image) URL.revokeObjectURL(image.previewUrl)
      return current.filter(item => item.previewUrl !== previewUrl)
    })
  }

  async function recognizeText() {
    if (images.length === 0) {
      setError('請先選擇至少一張截圖。')
      return
    }
    setError(null)
    setIsRecognizing(true)
    try {
      const result = await ocr.recognize(images.map(image => image.file), setOcrProgress)
      setOcrText(result.text)
      if (result.warnings.length > 0) setError(result.warnings.join(' '))
    } catch (recognitionError) {
      setError(recognitionError instanceof Error ? recognitionError.message : '文字辨識暫時無法完成，請稍後再試。')
    } finally {
      setIsRecognizing(false)
      setOcrProgress(null)
    }
  }

  function cancelRecognition() {
    if (ocr.cancel) void ocr.cancel()
  }

  async function suggestCandidates() {
    const urlError = validateSourceUrl(sourceUrl)
    if (urlError) {
      setError(urlError)
      return
    }
    if (!combinedSourceText.trim()) {
      setError('請先加入來源文字，或手動新增候選資料。')
      return
    }
    setError(null)
    const suggestions = await extractor.extract(combinedSourceText)
    setCandidates(suggestions)
    setSelectedCandidateId(suggestions[0]?.id ?? null)
  }

  function addCandidate() {
    const candidate = emptyCandidate()
    setCandidates(current => [...current, candidate])
    setSelectedCandidateId(candidate.id)
  }

  function updateCandidate(id: string, field: keyof RestaurantCandidate, value: string) {
    setCandidates(current => current.map(candidate => {
      if (candidate.id !== id) return candidate
      if (field === 'mentionedDishes') return { ...candidate, mentionedDishes: value.split('\n').map(dish => dish.trim()).filter(Boolean) }
      if (field === 'rating') return { ...candidate, rating: value === '' ? null : Number(value) }
      if (field === 'latitude' || field === 'longitude') return { ...candidate, [field]: value === '' ? null : Number(value) }
      return { ...candidate, [field]: value }
    }))
  }

  function removeCandidate(id: string) {
    setCandidates(current => current.filter(candidate => candidate.id !== id))
    if (selectedCandidateId === id) setSelectedCandidateId(null)
  }

  async function saveImport() {
    const selected = candidates.find(candidate => candidate.id === selectedCandidateId)
    const urlError = validateSourceUrl(sourceUrl)
    if (!ownerId || !selected) {
      setError('請先選擇或新增一個餐廳候選資料。')
      return
    }
    if (urlError) {
      setError(urlError)
      return
    }
    if (!selected.name.trim()) {
      setError('請填寫店家名稱。')
      return
    }
    if (combinedSourceText.length > 20000 || sourceNote.length > 5000) {
      setError('來源文字或個人備註超過可保存的長度限制。')
      return
    }
    const mentionedDishesError = validateMentionedDishes(selected.mentionedDishes)
    if (mentionedDishesError) {
      setError(mentionedDishesError)
      return
    }
    const coordinates = validateCoordinates(selected.latitude?.toString() ?? '', selected.longitude?.toString() ?? '')
    if (!coordinates.valid) {
      setError(coordinates.message)
      return
    }
    const restaurantInput: CreateRestaurantInput = { ownerId, name: selected.name.trim(), address: selected.address.trim(), category: selected.category.trim(), rating: selected.rating, notes: selected.notes.trim(), ...coordinates.coordinates }
    const sourceInput = toSourceInput(ownerId, sourcePlatform, sourceUrl, combinedSourceText, sourceNote, selected.mentionedDishes)
    setError(null)
    setIsSaving(true)
    try {
      const restaurantId = await new RestaurantImportService(restaurants, sources).create(restaurantInput, sourceInput)
      navigate(`/restaurants/${restaurantId}/edit`, { state: { notice: '店家與來源資料已儲存。' } })
    } catch (saveError) {
      if (saveError instanceof RestaurantSourceSaveError) {
        setPendingRestaurantId(saveError.restaurantId)
        setError('店家已建立，但來源資料尚未儲存。請重新儲存來源。')
      } else setError('匯入暫時無法儲存，請稍後再試。')
    } finally {
      setIsSaving(false)
    }
  }

  async function retrySource() {
    if (!ownerId || !pendingRestaurantId) return
    setIsSaving(true)
    setError(null)
    try {
      await sources.createRestaurantSource({ ...toSourceInput(ownerId, sourcePlatform, sourceUrl, combinedSourceText, sourceNote, candidates.find(candidate => candidate.id === selectedCandidateId)?.mentionedDishes ?? []), restaurantId: pendingRestaurantId })
      navigate(`/restaurants/${pendingRestaurantId}/edit`, { state: { notice: '店家與來源資料已儲存。' } })
    } catch {
      setError('來源資料暫時無法儲存，請稍後再試。')
    } finally {
      setIsSaving(false)
    }
  }

  return <main className="app-shell"><section className="page import-page" aria-labelledby="import-title"><Brand /><div className="hero-copy"><p className="eyebrow">社群內容匯入</p><h1 id="import-title" className="display">整理看到的下一間店。</h1><p className="lede">OCR 與候選解析可能有誤，建立前請逐欄確認。</p><Link className="button button--secondary" to="/">返回我的店家</Link></div><div className="import-workflow"><ol className="import-steps"><li>步驟 1：加入來源</li><li>步驟 2：辨識與整理文字</li><li>步驟 3：確認餐廳資料</li><li>步驟 4：儲存</li></ol><section className="import-section card" aria-labelledby="source-title"><h2 id="source-title">來源資料</h2><p>目前僅保存來源連結，不會自動下載或解析社群平台影片。</p><label>來源連結（選填）<input name="sourceUrl" inputMode="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} /></label><label>來源平台<select value={sourcePlatform} onChange={event => setSourcePlatform(event.target.value as SourcePlatform)}>{sourcePlatforms.map(platform => <option key={platform}>{platform}</option>)}</select></label><label>手動貼上的來源文字<textarea name="manualSourceText" value={manualSourceText} onChange={event => setManualSourceText(event.target.value)} /></label><label>個人備註<textarea name="sourceNote" value={sourceNote} onChange={event => setSourceNote(event.target.value)} /></label><p>請確認截圖與來源內容不包含不希望保存的個人資訊。</p><label>截圖（JPEG、PNG、WebP；每張最多 10 MB）<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} /></label><div className="image-previews">{images.map(image => <figure key={image.previewUrl}><img src={image.previewUrl} alt={`截圖預覽：${image.file.name}`} /><figcaption>{image.file.name}<button type="button" onClick={() => removeImage(image.previewUrl)}>移除圖片</button></figcaption></figure>)}</div></section><section className="import-section card" aria-labelledby="ocr-title"><h2 id="ocr-title">文字辨識與整理</h2><button className="button" type="button" onClick={() => void recognizeText()} disabled={isRecognizing}>{isRecognizing ? '辨識中...' : '開始辨識文字'}</button>{isRecognizing && ocr.cancel && <button className="button button--secondary" type="button" onClick={cancelRecognition}>取消辨識</button>}{ocrProgress && <p role="status">{ocrProgress.status}，第 {ocrProgress.imageIndex + 1}/{ocrProgress.imageCount} 張，{ocrProgress.progress}%</p>}<label>截圖 OCR 文字<textarea name="ocrText" value={ocrText} onChange={event => setOcrText(event.target.value)} /></label><button className="button button--secondary" type="button" onClick={regenerateCombinedText}>重新依來源產生合併文字</button><label>來源文字（供候選解析，可直接編輯）<textarea name="combinedSourceText" value={combinedSourceText} onChange={event => setCombinedSourceText(event.target.value)} /></label><button className="button button--secondary" type="button" onClick={() => void suggestCandidates()}>從來源文字提供草稿建議</button></section><section className="import-section card" aria-labelledby="candidate-title"><h2 id="candidate-title">餐廳候選確認</h2><p>規則式建議不是 AI，也不保證內容正確。</p><button className="button button--secondary" type="button" onClick={addCandidate}>新增候選餐廳</button>{candidates.length === 0 && <p>尚未辨識出餐廳，請手動新增候選資料。</p>}{candidates.map(candidate => <fieldset className="candidate-card" key={candidate.id}><legend><label><input type="radio" name="selectedCandidate" checked={selectedCandidateId === candidate.id} onChange={() => setSelectedCandidateId(candidate.id)} />選擇這間餐廳</label></legend><label>餐廳名稱<input value={candidate.name} onChange={event => updateCandidate(candidate.id, 'name', event.target.value)} /></label><label>地址<input value={candidate.address} onChange={event => updateCandidate(candidate.id, 'address', event.target.value)} /></label><label>區域<input value={candidate.area} onChange={event => updateCandidate(candidate.id, 'area', event.target.value)} /></label><label>類別<input value={candidate.category} onChange={event => updateCandidate(candidate.id, 'category', event.target.value)} /></label><label>評分<select value={candidate.rating ?? ''} onChange={event => updateCandidate(candidate.id, 'rating', event.target.value)}><option value="">未評分</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><label>必點餐點（每行一項）<textarea value={candidate.mentionedDishes.join('\n')} onChange={event => updateCandidate(candidate.id, 'mentionedDishes', event.target.value)} /></label><div className="coordinate-fields"><label>緯度<input inputMode="decimal" value={candidate.latitude ?? ''} onChange={event => updateCandidate(candidate.id, 'latitude', event.target.value)} /></label><label>經度<input inputMode="decimal" value={candidate.longitude ?? ''} onChange={event => updateCandidate(candidate.id, 'longitude', event.target.value)} /></label></div><label>餐廳備註<textarea value={candidate.notes} onChange={event => updateCandidate(candidate.id, 'notes', event.target.value)} /></label><label>辨識依據<textarea value={candidate.evidence} onChange={event => updateCandidate(candidate.id, 'evidence', event.target.value)} /></label><button className="button button--danger" type="button" onClick={() => removeCandidate(candidate.id)}>刪除候選</button></fieldset>)}</section>{error && <p className="form-error" role="alert" aria-live="polite">{error}</p>}{pendingRestaurantId ? <button className="button" type="button" disabled={isSaving} onClick={() => void retrySource()}>{isSaving ? '儲存中...' : '重新儲存來源'}</button> : <button className="button" type="button" disabled={isSaving || !selectedCandidateId} onClick={() => void saveImport()}>{isSaving ? '儲存中...' : '確認並儲存餐廳'}</button>}</div></section></main>
}

function combineSourceText(manualSourceText: string, ocrText: string): string {
  return `【手動貼上文字】\n${manualSourceText.trim()}\n\n【截圖 OCR】\n${ocrText.trim()}`
}

function validateSourceUrl(sourceUrl: string): string | null {
  if (!sourceUrl.trim()) return null
  try {
    const url = new URL(sourceUrl)
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : '來源連結必須是合法的 http 或 https URL。'
  } catch {
    return '來源連結必須是合法的 http 或 https URL。'
  }
}

function toSourceInput(ownerId: string, sourcePlatform: SourcePlatform, sourceUrl: string, sourceText: string, sourceNote: string, mentionedDishes: string[]): Omit<CreateRestaurantSourceInput, 'restaurantId'> {
  return { ownerId, sourceType: 'social-content', sourcePlatform, sourceUrl: sourceUrl.trim() || null, sourceText: sourceText.trim(), sourceNote: sourceNote.trim(), mentionedDishes: mentionedDishes.map(dish => dish.trim()).filter(Boolean).slice(0, maximumMentionedDishes) }
}