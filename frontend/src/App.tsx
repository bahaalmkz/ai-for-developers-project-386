import { useEffect, useState } from 'react'
import { Configuration, HealthApi } from './api/generated'
import './App.css'

// Относительный путь: запросы идут на тот же origin, в dev-режиме их проксирует Vite
const healthApi = new HealthApi(new Configuration({ basePath: '' }))

type Status = 'loading' | 'ok' | 'error'

function App() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    healthApi
      .getHealth()
      .then((result) => setStatus(result.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main>
      <h1>Календарь звонков</h1>
      <p>
        Статус сервера:{' '}
        <strong data-testid="health-status">
          {status === 'loading' ? 'проверяем…' : status === 'ok' ? 'работает' : 'недоступен'}
        </strong>
      </p>
    </main>
  )
}

export default App
