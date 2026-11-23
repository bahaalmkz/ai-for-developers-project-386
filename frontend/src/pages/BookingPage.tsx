import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventTypesApi } from '../api/client'
import type { EventType } from '../api/generated'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; eventTypes: EventType[] }

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} мин`
  if (rest === 0) return `${hours} ч`
  return `${hours} ч ${rest} мин`
}

export function BookingPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    eventTypesApi
      .listEventTypes()
      .then((eventTypes) => {
        if (!cancelled) setState({ status: 'ready', eventTypes })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main>
      <h1>Запись</h1>
      {state.status === 'loading' && <p>Загрузка…</p>}
      {state.status === 'error' && (
        <p role="alert">Не удалось загрузить типы встреч. Попробуйте обновить страницу.</p>
      )}
      {state.status === 'ready' && state.eventTypes.length === 0 && <p>Типов встреч пока нет.</p>}
      {state.status === 'ready' && state.eventTypes.length > 0 && (
        <ul aria-label="Типы встреч">
          {state.eventTypes.map((eventType) => (
            <li key={eventType.id}>
              <h2>{eventType.title}</h2>
              {eventType.description && <p>{eventType.description}</p>}
              <p>{formatDuration(eventType.durationMinutes)}</p>
            </li>
          ))}
        </ul>
      )}
      <Link to="/">На главную</Link>
    </main>
  )
}
