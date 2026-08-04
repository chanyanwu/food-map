import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDocs, getDoc, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { getBytes, ref, uploadString } from 'firebase/storage'

const projectId = 'demo-food-map'
let testEnvironment: RulesTestEnvironment

function profile(id: string) {
  return {
    id,
    displayName: 'Food Mapper',
    email: `${id}@example.com`,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1
  }
}

function restaurant(id: string, ownerId: string, coordinates: Record<string, unknown> = {}) {
  return {
    id,
    ownerId,
    name: 'Food Map Cafe',
    address: 'Taipei',
    category: 'Cafe',
    rating: 5,
    notes: '',
    latitude: null,
    longitude: null,
    photoURLs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
    ...coordinates
  }
}

beforeAll(async () => {
  const [firestoreRules, storageRules] = await Promise.all([readFile('firestore.rules', 'utf8'), readFile('storage.rules', 'utf8')])
  testEnvironment = await initializeTestEnvironment({ projectId, firestore: { rules: firestoreRules }, storage: { rules: storageRules } })
})

afterAll(async () => {
  await testEnvironment.cleanup()
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

describe('Firestore profile rules', () => {
  it('denies anonymous reads', async () => {
    const context = testEnvironment.unauthenticatedContext()
    await assertFails(getDoc(doc(context.firestore(), 'users', 'alice')))
  })

  it('denies anonymous profile creation', async () => {
    const context = testEnvironment.unauthenticatedContext()
    await assertFails(setDoc(doc(context.firestore(), 'users', 'alice'), profile('alice')))
  })

  it('allows an owner to create their profile', async () => {
    const context = testEnvironment.authenticatedContext('alice')
    await assertSucceeds(setDoc(doc(context.firestore(), 'users', 'alice'), profile('alice')))
  })

  it('allows an owner to read their profile', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', 'alice'), profile('alice'))
    })
    const context = testEnvironment.authenticatedContext('alice')
    await assertSucceeds(getDoc(doc(context.firestore(), 'users', 'alice')))
  })

  it('denies cross-user reads', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', 'bob'), profile('bob'))
    })
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(getDoc(doc(alice, 'users', 'bob')))
  })

  it('denies cross-user profile creation', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(alice, 'users', 'bob'), profile('bob')))
  })

  it('denies cross-user profile updates', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users', 'bob'), profile('bob'))
    })
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(updateDoc(doc(alice, 'users', 'bob'), { displayName: 'Nope', updatedAt: serverTimestamp() }))
  })

  it('denies profiles whose document id does not match auth uid', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(alice, 'users', 'alice'), profile('bob')))
  })

  it('denies changes to an existing profile id', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile('alice')))
    await assertFails(updateDoc(doc(alice, 'users', 'alice'), { id: 'bob', updatedAt: serverTimestamp() }))
  })

  it('denies invalid profile field types', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile('alice')))
    await assertFails(updateDoc(doc(alice, 'users', 'alice'), { schemaVersion: 'one', updatedAt: serverTimestamp() }))
  })

  it('denies profile fields outside the schema', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile('alice')))
    await assertFails(updateDoc(doc(alice, 'users', 'alice'), { sensitiveRole: 'admin', updatedAt: serverTimestamp() }))
  })

  it('denies undefined Firestore paths', async () => {
    const alice = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(getDoc(doc(alice, 'restaurants', 'restaurant-1')))
  })
})

describe('Firestore restaurant rules', () => {
  it('denies anonymous restaurant creation', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(firestore, 'restaurants', 'restaurant-1'), restaurant('restaurant-1', 'alice')))
  })

  it('allows an owner to create and read their restaurant', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertSucceeds(getDoc(restaurantReference))
  })

  it('denies reading another owner restaurant', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'restaurants', 'restaurant-1'), restaurant('restaurant-1', 'alice'))
    })
    const firestore = testEnvironment.authenticatedContext('bob').firestore()
    await assertFails(getDoc(doc(firestore, 'restaurants', 'restaurant-1')))
  })

  it('allows an owner to update their restaurant', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertSucceeds(updateDoc(restaurantReference, { notes: 'Updated', updatedAt: serverTimestamp() }))
  })

  it('allows an owner to update restaurant coordinates', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertSucceeds(updateDoc(restaurantReference, { latitude: 25.033, longitude: 121.5654, updatedAt: serverTimestamp() }))
  })

  it('allows null, valid, and boundary restaurant coordinates', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(firestore, 'restaurants', 'restaurant-null'), restaurant('restaurant-null', 'alice')))
    await assertSucceeds(setDoc(doc(firestore, 'restaurants', 'restaurant-valid'), restaurant('restaurant-valid', 'alice', { latitude: 25.033, longitude: 121.5654 })))
    await assertSucceeds(setDoc(doc(firestore, 'restaurants', 'restaurant-minimum'), restaurant('restaurant-minimum', 'alice', { latitude: -90, longitude: -180 })))
    await assertSucceeds(setDoc(doc(firestore, 'restaurants', 'restaurant-maximum'), restaurant('restaurant-maximum', 'alice', { latitude: 90, longitude: 180 })))
  })

  it.each([
    ['latitude above 90', { latitude: 90.1, longitude: 121.5654 }],
    ['latitude below -90', { latitude: -90.1, longitude: 121.5654 }],
    ['longitude above 180', { latitude: 25.033, longitude: 180.1 }],
    ['longitude below -180', { latitude: 25.033, longitude: -180.1 }],
    ['latitude without longitude', { latitude: 25.033, longitude: null }],
    ['longitude without latitude', { latitude: null, longitude: 121.5654 }],
    ['string latitude', { latitude: '25.033', longitude: 121.5654 }],
    ['string longitude', { latitude: 25.033, longitude: '121.5654' }]
  ])('denies restaurant creation with %s', async (_description, coordinates) => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(firestore, 'restaurants', 'restaurant-invalid'), restaurant('restaurant-invalid', 'alice', coordinates)))
  })

  it('denies changing a restaurant owner', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertFails(updateDoc(restaurantReference, { ownerId: 'bob', updatedAt: serverTimestamp() }))
  })

  it('denies non-owners from updating and deleting a restaurant', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'restaurants', 'restaurant-1'), restaurant('restaurant-1', 'alice'))
    })
    const restaurantReference = doc(testEnvironment.authenticatedContext('bob').firestore(), 'restaurants', 'restaurant-1')
    await assertFails(updateDoc(restaurantReference, { latitude: 25.033, longitude: 121.5654, updatedAt: serverTimestamp() }))
    await assertFails(deleteDoc(restaurantReference))
  })

  it('denies changing immutable restaurant fields', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertFails(updateDoc(restaurantReference, { id: 'restaurant-2', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(restaurantReference, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(restaurantReference, { schemaVersion: 2, updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(restaurantReference, { ownerId: 'bob', latitude: 25.033, longitude: 121.5654, updatedAt: serverTimestamp() }))
  })

  it('allows an owner to delete their restaurant', async () => {
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantReference = doc(firestore, 'restaurants', 'restaurant-1')
    await assertSucceeds(setDoc(restaurantReference, restaurant('restaurant-1', 'alice')))
    await assertSucceeds(deleteDoc(restaurantReference))
  })

  it('allows an owner to query only their restaurants', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'restaurants', 'restaurant-1'), restaurant('restaurant-1', 'alice'))
      await setDoc(doc(context.firestore(), 'restaurants', 'restaurant-2'), restaurant('restaurant-2', 'bob'))
    })
    const firestore = testEnvironment.authenticatedContext('alice').firestore()
    const restaurantsQuery = query(collection(firestore, 'restaurants'), where('ownerId', '==', 'alice'), orderBy('createdAt', 'desc'))
    await assertSucceeds(getDocs(restaurantsQuery))
  })

  it('denies querying another owner restaurants', async () => {
    await testEnvironment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'restaurants', 'restaurant-1'), restaurant('restaurant-1', 'alice'))
    })
    const firestore = testEnvironment.authenticatedContext('bob').firestore()
    const restaurantsQuery = query(collection(firestore, 'restaurants'), where('ownerId', '==', 'alice'), orderBy('createdAt', 'desc'))
    await assertFails(getDocs(restaurantsQuery))
  })
})

describe('Storage rules', () => {
  it('denies anonymous reads', async () => {
    const storage = testEnvironment.unauthenticatedContext().storage()
    await assertFails(getBytes(ref(storage, 'users/alice/avatar.txt')))
  })

  it('denies anonymous writes', async () => {
    const storage = testEnvironment.unauthenticatedContext().storage()
    await assertFails(uploadString(ref(storage, 'users/alice/avatar.txt'), 'food map'))
  })

  it('allows an owner path', async () => {
    const alice = testEnvironment.authenticatedContext('alice').storage()
    await assertSucceeds(uploadString(ref(alice, 'users/alice/avatar.txt'), 'food map'))
  })

  it('denies cross-user paths', async () => {
    const alice = testEnvironment.authenticatedContext('alice').storage()
    await assertFails(uploadString(ref(alice, 'users/bob/avatar.txt'), 'food map'))
  })

  it('denies undefined Storage paths', async () => {
    const alice = testEnvironment.authenticatedContext('alice').storage()
    await assertFails(uploadString(ref(alice, 'public/avatar.txt'), 'food map'))
  })
})