const API_URL = 'http://localhost:3000/events'

export async function getEvents() {
    const response = await fetch(`${API_URL}/events`)

    if (!response.ok) {
        throw new Error('Error al obtener los eventos')
    }

    return response.json()
}