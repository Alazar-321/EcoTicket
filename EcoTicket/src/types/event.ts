export type Event = {
    id?: number
    title: string
    organizer: string
    city: string
    category: string
    description?: string
    date: string
    start_time?: string
    end_time?: string
    capacity?: number
    day?: string
    month?: string
    weekday?: string
    image: string
    location?: string
    price?: number
    name?: string
    created_at?: string
}

export type CreateEvent = {
    name?: string
    title?: string
    description?: string
    date: string
    start_time?: string
    end_time?: string
    capacity?: number
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
    start_time?: string
    end_time?: string
    capacity?: number
    location?: string
    city?: string
    organizer?: string
    price?: number | string
    image?: string
    category?: string
}