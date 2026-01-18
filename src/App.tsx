import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { NavProvider } from './context/NavContext'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ListPage } from './pages/ListPage'
import { FormPage } from './pages/FormPage'

function App() {
  return (
    <DataProvider>
      <NavProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:table/list" element={<ListPage />} />
            <Route path="/:table/new" element={<FormPage />} />
            <Route path="/:table/:sysId" element={<FormPage />} />
          </Routes>
        </AppShell>
      </NavProvider>
    </DataProvider>
  )
}

export default App
