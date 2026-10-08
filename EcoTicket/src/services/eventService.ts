import type { Event } from '../types/event'

const API_URL = 'http://localhost:3000'

export async function getEvents(): Promise<Event[]> {
  const response = await fetch(`${API_URL}/events`)

  if (!response.ok) {
    throw new Error('No se pudieron obtener los eventos')
  }

  return response.json()
}