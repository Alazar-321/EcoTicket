import './App.css'
import RoutesApp from './routes/Routes'
import { EcoTicketDataProvider } from './context/EcoTicketDataContext'

function App() {
  return (
    <EcoTicketDataProvider>
      <RoutesApp />
    </EcoTicketDataProvider>
  )
}

export default App
