export type FurnitureCondition = 'new' | 'good' | 'worn' | 'damaged'

/** An entry in a building's catalogue. Furnishes nobody until a room holds it. */
export interface FurnitureItem {
  id: number
  buildingId: number
  name: string
  kind: string
  make: string | null
  unitValue: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** What a room actually holds, today. */
export interface RoomFurniture {
  id: number
  roomId: number
  furnitureItemId: number
  quantity: number
  /** Copied from the catalogue when the room was furnished, not read from it. */
  unitValue: number
  condition: FurnitureCondition
  note: string | null
  acquiredOn: string
  name: string
  kind: string
  make: string | null
  /** The catalogue entry behind it has since been retired. */
  itemRetired: boolean
  totalValue: number
}

export interface RoomFurnitureList {
  data: RoomFurniture[]
  totalValue: number
}

/**
 * One line of what a tenant was handed, frozen on the day they signed.
 *
 * Nothing here is editable. `returnCondition` is null until somebody checks the
 * item back in, and null means NOBODY LOOKED — not "came back fine".
 */
export interface LeaseFurniture {
  id: number
  leaseId: number
  name: string
  kind: string
  make: string | null
  quantity: number
  unitValue: number
  totalValue: number
  handoverCondition: FurnitureCondition
  handoverNote: string | null
  handedOverOn: string
  returnCondition: FurnitureCondition | null
  returnNote: string | null
  returnedAt: string | null
  unchecked: boolean
  /** Came back in a worse condition than it went out in. */
  worse: boolean
}

export interface LeaseFurnitureList {
  data: LeaseFurniture[]
  /**
   * Whether a hand-over was recorded AT ALL — which an empty list cannot say.
   *
   * False means nobody ever wrote one, which is true of every tenancy signed
   * before furniture existed here. True with an empty list means the room was
   * handed over unfurnished, which somebody established. Reading the first as
   * the second says something untrue at exactly the moment it matters.
   */
  recorded: boolean
  recordedAt: string | null
  worse: LeaseFurniture[]
  uncheckedCount: number
}

export interface FurnitureItemInput {
  name: string
  kind: string
  make?: string
  unitValue: number
}

export interface AddRoomFurnitureInput {
  furnitureItemId: number
  quantity: number
  condition: FurnitureCondition
  note?: string
}

export interface CheckInEntry {
  leaseFurnitureId: number
  returnCondition: FurnitureCondition
  returnNote?: string
}
