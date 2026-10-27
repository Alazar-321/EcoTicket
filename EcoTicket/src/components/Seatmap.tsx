import { useMemo, useState } from 'react'
import {
  computeLayout,
  rowLetter,
  seatKey,
  type EventZone,
  type SeatSelection,
} from '../utils/seating'

type SeatMapProps = {
  zones: EventZone[]
  // Asientos ocupados ("idCategoría:etiqueta")
  taken?: Set<string>
  // Asientos que el cliente ha marcado
  selectedKeys?: Set<string>
  onToggleSeat?: (seat: SeatSelection) => void
  // Categoría resaltada (las demás se atenúan)
  activeZoneIndex?: number | null
  // false = solo vista previa, sin poder elegir asientos
  interactive?: boolean
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

function formatPrice(price: number) {
  return price === 0
    ? 'Gratis'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price)
}

export default function SeatMap({
  zones,
  taken = new Set<string>(),
  selectedKeys = new Set<string>(),
  onToggleSeat,
  activeZoneIndex = null,
  interactive = true,
}: SeatMapProps) {
  const [zoom, setZoom] = useState(1)

  // Solo depende de filas y asientos por fila
  const layoutKey = zones.map((zone) => `${zone.rows}x${zone.seatsPerRow}`).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => computeLayout(zones), [layoutKey])

  if (zones.length === 0) return null

  return (
    <div>
      <div className="d-flex justify-content-end align-items-center gap-1 mb-1">
        <span className="small text-body-secondary me-1">Zoom</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          aria-label="Alejar el plano"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - 0.5) * 10) / 10))}
        >
          <i className="bi bi-dash-lg" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          aria-label="Acercar el plano"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + 0.5) * 10) / 10))}
        >
          <i className="bi bi-plus-lg" aria-hidden="true"></i>
        </button>
      </div>

      <div
        className="border rounded"
        style={{ background: '#f8f9fa', overflow: 'auto', maxHeight: '60vh' }}
      >
        <svg
          viewBox={layout.viewBox}
          role="group"
          aria-label="Plano de asientos del evento"
          style={{ width: `${zoom * 100}%`, display: 'block', minWidth: 280 }}
        >
          <style>{`.seat:focus-visible{outline:3px solid #0d6efd;outline-offset:2px}`}</style>

          <rect
            x={layout.stage.x}
            y={layout.stage.y}
            width={layout.stage.width}
            height={layout.stage.height}
            rx={4}
            fill="#ced4da"
            stroke="#fff"
            strokeWidth={2}
          />
          <text
            x={layout.stage.x + layout.stage.width / 2}
            y={layout.stage.y + layout.stage.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill="#495057"
          >
            ESCENARIO
          </text>

          {layout.seats.map((point) => {
            const zone = zones[point.zoneIndex]
            const zoneId = zone.id ?? -1
            const key = seatKey(zoneId, point.label)
            const isTaken = taken.has(key)
            const isSelected = selectedKeys.has(key)
            const dimmed = activeZoneIndex != null && activeZoneIndex !== point.zoneIndex
            const canPick = interactive && !isTaken && zone.id != null

            const status = isTaken ? 'ocupado' : isSelected ? 'seleccionado' : 'disponible'
            const description =
              `${zone.name}, fila ${rowLetter(point.row)}, asiento ${point.seat}` +
              ` (${point.label}), ${formatPrice(zone.price)}, ${status}`

            const toggle = () => {
              if (!canPick || !onToggleSeat) return
              onToggleSeat({
                zoneId: zone.id as number,
                zoneName: zone.name,
                label: point.label,
                price: zone.price,
              })
            }

            return (
              <g
                key={`${point.zoneIndex}-${point.label}`}
                className={canPick ? 'seat' : undefined}
                transform={`translate(${point.x} ${point.y})`}
                opacity={dimmed && !isSelected ? 0.3 : 1}
                style={{ cursor: canPick ? 'pointer' : 'default' }}
                role={canPick ? 'button' : undefined}
                tabIndex={canPick ? 0 : undefined}
                aria-label={canPick ? description : undefined}
                aria-pressed={canPick ? isSelected : undefined}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle()
                  }
                }}
              >
                <title>{description}</title>
                {isTaken ? (
                  <>
                    <circle r={layout.seatRadius} fill="#e9ecef" stroke="#adb5bd" strokeWidth={1} />
                    <path d="M-2.6 -2.6 L2.6 2.6 M2.6 -2.6 L-2.6 2.6" stroke="#868e96" strokeWidth={1.2} />
                  </>
                ) : isSelected ? (
                  <>
                    <circle r={layout.seatRadius + 1.4} fill={zone.color} stroke="#111" strokeWidth={2.4} />
                    <circle r={2.2} fill="#fff" />
                  </>
                ) : (
                  <circle r={layout.seatRadius} fill={zone.color} stroke="rgba(0,0,0,.28)" strokeWidth={0.8} />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <ul className="list-inline small text-body-secondary mt-2 mb-0">
        <li className="list-inline-item me-3">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true" className="me-1">
            <circle r="5.4" fill="#6c757d" />
          </svg>
          Disponible
        </li>
        <li className="list-inline-item me-3">
          <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true" className="me-1">
            <circle r="6.6" fill="#6c757d" stroke="#111" strokeWidth="2.4" />
            <circle r="2.2" fill="#fff" />
          </svg>
          Tu selección
        </li>
        <li className="list-inline-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true" className="me-1">
            <circle r="5.4" fill="#e9ecef" stroke="#adb5bd" />
            <path d="M-2.6 -2.6 L2.6 2.6 M2.6 -2.6 L-2.6 2.6" stroke="#868e96" strokeWidth="1.2" />
          </svg>
          Ocupado
        </li>
      </ul>
    </div>
  )
}