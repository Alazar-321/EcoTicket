import {
  MAX_ROWS,
  MAX_SEATS_PER_ROW,
  MAX_ZONES,
  ZONE_COLORS,
  totalSeats,
  validateZones,
  type EventZone,
} from '../utils/seating'
import SeatMap from './SeatMap'

type ZonesEditorProps = {
  value: EventZone[]
  onChange: (zones: EventZone[]) => void
  // Precio base del evento: sirve para proponer precios al usar las categorías sugeridas
  basePrice?: number
}

function suggestedZones(basePrice: number): EventZone[] {
  const base = Math.max(0, Math.round(basePrice / 1000) * 1000)
  return [
    { name: 'VIP', price: base * 3, rows: 3, seatsPerRow: 10, color: ZONE_COLORS[0] },
    { name: 'Platino', price: base * 2, rows: 5, seatsPerRow: 14, color: ZONE_COLORS[1] },
    { name: 'Gradería', price: base, rows: 8, seatsPerRow: 18, color: ZONE_COLORS[2] },
  ]
}

export default function ZonesEditor({ value, onChange, basePrice = 0 }: ZonesEditorProps) {
  const error = validateZones(value)

  const update = (index: number, patch: Partial<EventZone>) => {
    onChange(value.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)))
  }

  const addZone = () => {
    if (value.length >= MAX_ZONES) return
    onChange([
      ...value,
      {
        name: '',
        price: Math.max(0, basePrice),
        rows: 4,
        seatsPerRow: 12,
        color: ZONE_COLORS[value.length % ZONE_COLORS.length],
      },
    ])
  }

  const toInt = (raw: string) => {
    const n = parseInt(raw, 10)
    return Number.isNaN(n) ? 0 : n
  }

  return (
    <div className="border rounded p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <div>
          <h3 className="h6 fw-bold mb-0">Categorías de boletería y asientos</h3>
          <p className="small text-body-secondary mb-0">
            Opcional. Sin categorías, el evento se reserva por cantidad y con el precio base.
          </p>
        </div>
        {value.length === 0 && (
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={() => onChange(suggestedZones(basePrice))}
          >
            Usar VIP, Platino y Gradería
          </button>
        )}
      </div>

      {value.map((zone, index) => (
        <div className="row g-2 align-items-end mb-2" key={zone.id ?? `new-${index}`}>
          <div className="col-auto">
            <label className="form-label small mb-1" htmlFor={`zone-color-${index}`}>Color</label>
            <input
              id={`zone-color-${index}`}
              type="color"
              className="form-control form-control-color"
              value={zone.color}
              onChange={(e) => update(index, { color: e.target.value })}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small mb-1" htmlFor={`zone-name-${index}`}>Nombre</label>
            <input
              id={`zone-name-${index}`}
              className="form-control form-control-sm"
              maxLength={40}
              placeholder="Ej. VIP"
              value={zone.name}
              onChange={(e) => update(index, { name: e.target.value })}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small mb-1" htmlFor={`zone-price-${index}`}>Precio (COP)</label>
            <input
              id={`zone-price-${index}`}
              type="number"
              min="0"
              step="1000"
              className="form-control form-control-sm"
              value={zone.price}
              onChange={(e) => update(index, { price: Number(e.target.value) })}
            />
          </div>
          <div className="col-4 col-md-1">
            <label className="form-label small mb-1" htmlFor={`zone-rows-${index}`}>Filas</label>
            <input
              id={`zone-rows-${index}`}
              type="number"
              min="1"
              max={MAX_ROWS}
              className="form-control form-control-sm"
              value={zone.rows || ''}
              onChange={(e) => update(index, { rows: toInt(e.target.value) })}
            />
          </div>
          <div className="col-5 col-md-2">
            <label className="form-label small mb-1" htmlFor={`zone-seats-${index}`}>Asientos/fila</label>
            <input
              id={`zone-seats-${index}`}
              type="number"
              min="1"
              max={MAX_SEATS_PER_ROW}
              className="form-control form-control-sm"
              value={zone.seatsPerRow || ''}
              onChange={(e) => update(index, { seatsPerRow: toInt(e.target.value) })}
            />
          </div>
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              aria-label={`Quitar la categoría ${zone.name || index + 1}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <i className="bi bi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      ))}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={value.length >= MAX_ZONES}
          onClick={addZone}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Agregar categoría
        </button>
        {value.length > 0 && (
          <span className="small text-body-secondary">
            {totalSeats(value)} asientos en total · la primera categoría queda más cerca del escenario
          </span>
        )}
      </div>

      {error && value.length > 0 && (
        <div className="text-danger small mt-2" role="alert">{error}</div>
      )}

      {value.length > 0 && !error && (
        <details className="mt-3">
          <summary className="small fw-semibold">Vista previa del plano</summary>
          <div className="mt-2">
            <SeatMap zones={value} interactive={false} />
          </div>
        </details>
      )}
    </div>
  )
}