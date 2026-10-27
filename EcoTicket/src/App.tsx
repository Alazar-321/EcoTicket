import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RoutesApp from './routes/Routes'
import { EcoTicketDataProvider } from './context/EcoTicketDataContext'

function App() {
  return (
    <BrowserRouter>
      <EcoTicketDataProvider>
        <RoutesApp />
      </EcoTicketDataProvider>
    </BrowserRouter>
  )
}

export default App
