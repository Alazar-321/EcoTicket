import { useState } from 'react'

export type FilterSelection = {
  price: string[]
  date: string[]
  category: string[]
}

type FilterGroup = {
  key: keyof FilterSelection
  title: string
  options: string[]
}

const groups: FilterGroup[] = [
  { key: 'price', title: 'Precios', options: ['Gratis', 'Pago'] },
  {
    key: 'date',
    title: 'Fechas Disponibles',
    options: ['Hoy', 'Mañana', 'Esta Semana', 'La próxima Semana', 'Este Mes', 'El próximo mes'],
  },
  {
    key: 'category',
    title: 'Categorías',
    options: ['Conciertos Ecológicos', 'Running', 'Bricolaje', 'Festivales', 'Simpósios'],
  },
]

const defaultSelection: FilterSelection = {
  price: [],
  date: [],
  category: [],
}

type FilterProps = {
  value?: FilterSelection
  onChange?: (next: FilterSelection) => void
}

const INITIAL_VISIBLE_OPTIONS = 4

export default function Filter({ value, onChange }: FilterProps) {
  const [internalValue, setInternalValue] = useState<FilterSelection>(value ?? defaultSelection)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const selected = value ?? internalValue

  const toggleOption = (groupKey: keyof FilterSelection, option: string) => {
    const list = selected[groupKey]
    const nextList = list.includes(option)
      ? list.filter((item) => item !== option)
      : [...list, option]

    const nextValue = {
      ...selected,
      [groupKey]: nextList,
    }

    if (value === undefined) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
  }

  const toggleExpanded = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }))
  }

  return (
    <aside className="eco-filter-panel">
      <h2 className="eco-filter-heading">Filtros</h2>

      {groups.map((group) => {
        const shouldShowMore = group.key !== 'price' && group.options.length > INITIAL_VISIBLE_OPTIONS
        const visibleOptions = shouldShowMore && !expandedGroups[group.title]
          ? group.options.slice(0, INITIAL_VISIBLE_OPTIONS)
          : group.options

        return (
          <section className="eco-filter-section" key={group.title}>
            <h3 className="eco-filter-title">{group.title}</h3>

            <ul className="eco-filter-list">
              {visibleOptions.map((option) => (
                <li key={option}>
                  <label className="eco-filter-option">
                    <input
                      type="checkbox"
                      checked={selected[group.key].includes(option)}
                      onChange={() => toggleOption(group.key, option)}
                    />
                    <span>{option}</span>
                  </label>
                </li>
              ))}
            </ul>

            {shouldShowMore && (
              <button
                type="button"
                className="eco-filter-more"
                onClick={() => toggleExpanded(group.title)}
              >
                {expandedGroups[group.title] ? 'Menos' : 'Más'}
              </button>
            )}
          </section>
        )
      })}
    </aside>
  )
}
