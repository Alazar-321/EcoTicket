import { useEffect, useMemo, useState } from 'react'

export default function usePagination<T>(
  items: T[],
  pageSize = 8,
  resetKey?: string | number
) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Vuelve a la página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1)
  }, [resetKey])

  // Si la lista se acorta, no te quedas en una página que ya no existe
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  return { pageItems, page: currentPage, totalPages, setPage }
}