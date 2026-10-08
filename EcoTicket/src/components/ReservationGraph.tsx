import { useMemo, useState } from 'react'
import type { Event } from '../types/event'
import type { Reservation, ReservationStatus } from '../services/ecoTicketService'

type Props = {
  events: Event[]
  reservations: Reservation[]
}

type NodeKind = 'customer' | 'event' | 'city'

type GraphNode = {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
}

type GraphEdge = {
  id: string
  from: string
  to: string
  status?: ReservationStatus
}

const WIDTH = 760
const ROW_HEIGHT = 40
const TOP = 56

const COLUMN_X: Record<NodeKind, number> = { customer: 200, event: 380, city: 560 }
const COLUMN_TITLE: Record<NodeKind, string> = {
  customer: 'Clientes',
  event: 'Eventos',
  city: 'Ciudades',
}
const NODE_COLOR: Record<NodeKind, string> = {
  customer: '#495057',
  event: '#6f42c1',
  city: '#fd7e14',
}

const STATUS_STYLE: Record<ReservationStatus, { label: string; color: string; dash?: string }> = {
  SOLICITADA: { label: 'Solicitada', color: '#e0a800' },
  CONFIRMADA: { label: 'Confirmada', color: '#0d6efd' },
  PAGADA: { label: 'Pagada', color: '#198754' },
  RECHAZADA: { label: 'Rechazada', color: '#dc3545', dash: '5 4' },
}

function truncate(text: string, max = 20) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function ReservationGraph({ events, reservations }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const { nodes, edges, byId, neighbors, height } = useMemo(() => {
    const customers = Array.from(new Set(reservations.map((r) => r.customer)))
    const cities = Array.from(new Set(events.map((e) => e.city)))
    const rows = Math.max(customers.length, events.length, cities.length, 1)
    const height = TOP + rows * ROW_HEIGHT + 16

    // Centra cada columna verticalmente respecto a la más larga
    const yFor = (count: number, index: number) =>
      TOP + ((rows - count) * ROW_HEIGHT) / 2 + index * ROW_HEIGHT + ROW_HEIGHT / 2

    const nodes: GraphNode[] = [
      ...customers.map((name, i) => ({
        id: `c:${name}`,
        label: name,
        kind: 'customer' as const,
        x: COLUMN_X.customer,
        y: yFor(customers.length, i),
      })),
      ...events.map((item, i) => ({
        id: `e:${item.id}`,
        label: item.title,
        kind: 'event' as const,
        x: COLUMN_X.event,
        y: yFor(events.length, i),
      })),
      ...cities.map((name, i) => ({
        id: `y:${name}`,
        label: name,
        kind: 'city' as const,
        x: COLUMN_X.city,
        y: yFor(cities.length, i),
      })),
    ]

    const byId = new Map(nodes.map((node) => [node.id, node]))

    const edges: GraphEdge[] = []
    for (const item of events) {
      edges.push({ id: `ec:${item.id}`, from: `e:${item.id}`, to: `y:${item.city}` })
    }
    for (const reservation of reservations) {
      const eventNode = `e:${reservation.eventId}`
      if (!byId.has(eventNode)) continue
      edges.push({
        id: `r:${reservation.id}`,
        from: `c:${reservation.customer}`,
        to: eventNode,
        status: reservation.status,
      })
    }

    const neighbors = new Map<string, Set<string>>()
    const link = (a: string, b: string) => {
      if (!neighbors.has(a)) neighbors.set(a, new Set())
      neighbors.get(a)?.add(b)
    }
    for (const edge of edges) {
      link(edge.from, edge.to)
      link(edge.to, edge.from)
    }

    return { nodes, edges, byId, neighbors, height }
  }, [events, reservations])

  if (events.length === 0 && reservations.length === 0) {
    return <p className="text-muted mb-0">Todavía no hay datos para construir el grafo.</p>
  }

  const nodeVisible = (id: string): boolean =>
    activeId === null || id === activeId || (neighbors.get(activeId)?.has(id) ?? false)
  const edgeVisible = (edge: GraphEdge): boolean =>
    activeId === null || edge.from === activeId || edge.to === activeId

  const columnCount = (kind: NodeKind) => nodes.filter((node) => node.kind === kind).length

  return (
    <div>
      <div className="overflow-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          width="100%"
          style={{ minWidth: 560, height: 'auto' }}
          role="img"
          aria-label={`Grafo de reservas: ${nodes.length} nodos y ${edges.length} conexiones`}
        >
          {(Object.keys(COLUMN_X) as NodeKind[]).map((kind) => (
            <text
              key={kind}
              x={COLUMN_X[kind]}
              y={28}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#6c757d"
            >
              {COLUMN_TITLE[kind]} ({columnCount(kind)})
            </text>
          ))}

          {edges.map((edge) => {
            const a = byId.get(edge.from)
            const b = byId.get(edge.to)
            if (!a || !b) return null
            const midX = (a.x + b.x) / 2
            const style = edge.status ? STATUS_STYLE[edge.status] : null
            return (
              <path
                key={edge.id}
                d={`M${a.x},${a.y} C${midX},${a.y} ${midX},${b.y} ${b.x},${b.y}`}
                fill="none"
                stroke={style?.color ?? '#ced4da'}
                strokeWidth={style ? 2.5 : 1.5}
                strokeDasharray={style?.dash}
                strokeLinecap="round"
                opacity={edgeVisible(edge) ? 0.9 : 0.08}
              />
            )
          })}

          {nodes.map((node) => (
            <g
              key={node.id}
              tabIndex={0}
              aria-label={`${COLUMN_TITLE[node.kind]}: ${node.label}`}
              style={{ cursor: 'pointer', outline: 'none' }}
              opacity={nodeVisible(node.id) ? 1 : 0.25}
              onMouseEnter={() => setActiveId(node.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(node.id)}
              onBlur={() => setActiveId(null)}
            >
              <title>{node.label}</title>
              {node.kind === 'event' ? (
                <rect
                  x={node.x - 9}
                  y={node.y - 9}
                  width={18}
                  height={18}
                  rx={4}
                  fill={NODE_COLOR.event}
                />
              ) : (
                <circle cx={node.x} cy={node.y} r={9} fill={NODE_COLOR[node.kind]} />
              )}
              <text
                x={node.kind === 'customer' ? node.x - 16 : node.x + 16}
                y={node.y}
                dy="0.35em"
                textAnchor={node.kind === 'customer' ? 'end' : 'start'}
                fontSize="12"
                fill="#212529"
                stroke="#fff"
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {truncate(node.label)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ul className="list-unstyled d-flex flex-wrap gap-3 mb-0 mt-3 small text-muted">
        {(Object.keys(STATUS_STYLE) as ReservationStatus[]).map((status) => (
          <li key={status} className="d-flex align-items-center gap-2">
            <svg width="28" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke={STATUS_STYLE[status].color}
                strokeWidth="2.5"
                strokeDasharray={STATUS_STYLE[status].dash}
                strokeLinecap="round"
              />
            </svg>
            {STATUS_STYLE[status].label}
          </li>
        ))}
        <li className="d-flex align-items-center gap-2">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" stroke="#ced4da" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Evento en ciudad
        </li>
      </ul>
      <p className="small text-muted mt-2 mb-0">
        Pasa el cursor sobre un nodo para resaltar sus conexiones.
      </p>
    </div>
  )
}

export default ReservationGraph
