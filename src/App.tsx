import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ListPage } from './pages/ListPage'
import { FormPage } from './pages/FormPage'

function App() {
  return (
    <DataProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:table/list" element={<ListPage />} />
          <Route path="/:table/new" element={<FormPage />} />
          <Route path="/:table/:sysId" element={<FormPage />} />
        </Routes>
      </AppShell>
    </DataProvider>
  )
}

export default App
