import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventTypesApi, slotsApi } from '../api/client'
import type { EventType, Slot } from '../api/generated'

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

// Часовой пояс владельца (ADR 0003): время всегда показываем в нём
const OWNER_TIMEZONE = 'Asia/Almaty'

const dayFormat = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})

type SlotsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; days: { label: string; times: string[] }[] }

function groupByDay(slots: Slot[]): { label: string; times: string[] }[] {
  const days: { label: string; times: string[] }[] = []
  for (const slot of slots) {
    const label = dayFormat.format(slot.start)
    let day = days[days.length - 1]
    if (!day || day.label !== label) {
      day = { label, times: [] }
      days.push(day)
    }
    day.times.push(timeFormat.format(slot.start))
  }
  return days
}

export function BookingPage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [slots, setSlots] = useState<SlotsState>({ status: 'idle' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function selectEventType(id: string) {
    setSelectedId(id)
    setSlots({ status: 'loading' })
    slotsApi
      .listSlots({ id })
      .then((list) => setSlots({ status: 'ready', days: groupByDay(list) }))
      .catch(() => setSlots({ status: 'error' }))
  }

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
              <button
                type="button"
                aria-pressed={selectedId === eventType.id}
                aria-label={`Выбрать ${eventType.title}`}
                onClick={() => selectEventType(eventType.id)}
              >
                Выбрать
              </button>
            </li>
          ))}
        </ul>
      )}
      {slots.status !== 'idle' && (
        <section aria-label="Свободные слоты">
          <h2>Свободное время</h2>
          <p>Время указано в часовом поясе владельца: {OWNER_TIMEZONE} (UTC+5).</p>
          {slots.status === 'loading' && <p>Загрузка слотов…</p>}
          {slots.status === 'error' && (
            <p role="alert">Не удалось загрузить слоты. Попробуйте ещё раз.</p>
          )}
          {slots.status === 'ready' && slots.days.length === 0 && <p>Свободных слотов нет.</p>}
          {slots.status === 'ready' &&
            slots.days.map((day) => (
              <div key={day.label} role="group" aria-label={day.label}>
                <h3>{day.label}</h3>
                <ul>
                  {day.times.map((time) => (
                    <li key={time}>{time}</li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
      <Link to="/">На главную</Link>
    </main>
  )
}
