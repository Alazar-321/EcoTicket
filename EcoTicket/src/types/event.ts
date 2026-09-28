export type Event = {
  title: string
  organizer: string
  city: string
  category: string
  description: string
  date: string
  day?: string
  month?: string
  weekday?: string
  image: string
  price: number
}
export type Event = {
    id?: number
    title: string
    organizer: string
    city: string
    category: string
    description?: string
    date: string
    day?: string
    month?: string
    weekday?: string
    image: string
    location?: string
    price?: string | number
    name?: string
    created_at?: string
}

export type CreateEvent = {
    name?: string
    title?: string
    description?: string
    date: string
    location?: string
    city?: string
    organizer?: string
    price?: number | string
    image?: string
    category?: string
}

export type UpdateEvent = {
    name?: string
    title?: string
    description?: string
    date?: string
    location?: string
    city?: string
    organizer?: string
    price?: number | string
    image?: string
    category?: string
}