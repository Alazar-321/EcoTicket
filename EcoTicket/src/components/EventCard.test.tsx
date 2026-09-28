import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EventCard from './EventCard'

describe('EventCard', () => {
  it('muestra el título y la ciudad del evento', () => {
    render(
      <EventCard
        event={{
          title: 'Barranquilla limpia: Un mar sin plástico',
          organizer: 'Limpieza del mar',
          city: 'Barranquilla',
          category: 'bricolaje',
          description: 'Jornada de limpieza costera',
          date: '2026-09-27',
          image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
          price: 0,
        }}
      />
    )

    expect(screen.getByText('Barranquilla limpia: Un mar sin plástico')).toBeInTheDocument()
    expect(screen.getByText('Barranquilla')).toBeInTheDocument()
  })
})
