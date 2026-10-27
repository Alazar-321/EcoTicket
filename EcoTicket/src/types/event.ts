import type { EventStatus } from '../utils/eventStatus'


export type Event = {
    id?: number;
    title: string;
    organizer: string;
    city: string;
    category: string;
    description?: string;
    date: string;
    image: string;
    location?: string;
    price?: number;
    capacity?: number;
    created_by?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    end_date?: string | null;
    notes?: string | null;
    status?: EventStatus
}

export type CreateEvent = {
    title: string
    organizer: string
    city: string
    category: string
    description?: string
    date: string
    start_time: string
    end_time: string
    capacity: number
    location: string
    image: string
    price: number
    end_date?: string | null
    notes?: string | null
    status?: EventStatus
}

export type UpdateEvent = Partial<Omit<CreateEvent, 'title'>> & { title?: string }