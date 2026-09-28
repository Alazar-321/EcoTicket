import eventImage from '../assets/Slider2.jpg'
import eventImageTwo from '../assets/slide1.png'
import eventImageThree from '../assets/slider3.jpg'
import type { Event } from '../types/event'

import EventCard from './EventCard'

export const events: Event[] = [
{
title: 'Concierto Rock Ecológico',
organizer: 'Eco Ticket',
city: 'Cali',
category: 'music',
description: 'Un concierto de rock con enfoque ecológico, promoviendo la sostenibilidad y la conciencia ambiental.',
date: '2026-11-14',
day: '14',
month: 'Nov',
weekday: 'Sáb',
image: eventImage,
price: 150000,
},
{
title: 'Festival Música y Naturaleza',
organizer: 'Eco Eventos',
city: 'Medellín',
category: 'music',
description: 'Un festival que combina música en vivo con actividades al aire libre y conciencia ambiental.',
date: '2026-10-22',
day: '22',
month: 'Oct',
weekday: 'Dom',
image: eventImageTwo,
price: 0,
},
{
title: 'Carrera Por el Rio Tuluá',
organizer: 'Eco-ticket',
city: 'Tuluá',
category: 'sports',
description: 'Una carrera deportiva para promover la conservación del río Tuluá y la vida saludable.',
date: '2026-12-05',
day: '05',
month: 'Dic',
weekday: 'Sáb',
image: eventImageThree,
price: 75000,
},
{
title: 'Festival de Cine Ambiental',
organizer: 'Eco-ticket',
city: 'Tuluá',
category: 'sports',
description: 'Un festival de cine que presenta películas y documentales sobre temas ambientales y sostenibilidad.',
date: '2026-12-10',
day: '10',
month: 'Dic',
weekday: 'Sáb',
image: 'https://i.postimg.cc/L4VVF5vj/festival-de-cine-ambiental.jpg',
price: 45000,
},
]

export default function EventCards({ filteredEvents = events }: { filteredEvents?: Event[] }) {
return (
<section className="container-fluid px-3 px-md-5 py-4" aria-labelledby="events-title">
<h2 id="events-title" className="mb-3 fs-4 fw-bold text-dark">Eventos destacados</h2>
<div className="row g-4">
{filteredEvents.map((event) => (
<div className="col-12 col-md-6 col-lg-3" key={`${event.date}-${event.title}`}>
<EventCard event={event} />
</div>
))}
{filteredEvents.length === 0 && (
<div className="col-12">
<p className="mb-0 text-center text-secondary">No encontramos eventos con esos filtros.</p>
</div>
)}
</div>
</section>
)
}
