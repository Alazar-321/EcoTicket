import { useContext } from 'react'
import { EcoTicketDataContext } from '../context/EcoTicketDataContext'

export default function useEcoTicketData() {
  const context = useContext(EcoTicketDataContext)
  if (!context) {
    throw new Error('useEcoTicketData debe usarse dentro de <EcoTicketDataProvider>')
  }
  return context
}