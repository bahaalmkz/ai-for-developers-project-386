import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookingsApi, eventTypesApi, slotsApi } from '../api/client'
import { ResponseError, type ApiError, type EventType, type Slot } from '../api/generated'
import { OWNER_TIMEZONE, dayFormat, timeFormat } from './time'

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

type Day = { label: string; slots: Slot[] }

type SlotsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; days: Day[] }

function groupByDay(slots: Slot[]): Day[] {
  const days: Day[] = []
  for (const slot of slots) {
    const label = dayFormat.format(slot.start)
    let day = days[days.length - 1]
    if (!day || day.label !== label) {
      day = { label, slots: [] }
      days.push(day)
    }
    day.slots.push(slot)
  }
  return days
}

const emptyGuest = { guestName: '', guestEmail: '' }

export function BookingPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [slots, setSlots] = useState<SlotsState>({ status: 'idle' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [guest, setGuest] = useState(emptyGuest)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Сообщение о конфликте живёт рядом со слотами: форма после конфликта скрывается
  const [conflict, setConflict] = useState<string | null>(null)

  function selectEventType(id: string) {
    setSelectedId(id)
    setSelectedSlot(null)
    setFieldErrors({})
    setFormError(null)
    setConflict(null)
    setSlots({ status: 'loading' })
    loadSlots(id)
  }

  function loadSlots(id: string) {
    return slotsApi
      .listSlots({ id })
      .then((list) => setSlots({ status: 'ready', days: groupByDay(list) }))
      .catch(() => setSlots({ status: 'error' }))
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setFieldErrors({})
    setFormError(null)
    setConflict(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !selectedSlot) return
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)
    try {
      const booking = await bookingsApi.createBooking({
        createBookingRequest: {
          eventTypeId: selectedId,
          start: selectedSlot.start,
          guestName: guest.guestName,
          guestEmail: guest.guestEmail,
        },
      })
      navigate('/book/confirmation', { state: { booking } })
    } catch (error) {
      if (error instanceof ResponseError) {
        const body = (await error.response.json().catch(() => null)) as ApiError | null
        if (error.response.status === 400 && body?.fieldErrors) {
          setFieldErrors(body.fieldErrors)
          return
        }
        if (error.response.status === 409) {
          // Слот уже занят: сообщаем и обновляем список, выбранный слот сбрасываем
          setConflict(body?.message ?? 'Это время уже занято, выберите другой слот')
          setSelectedSlot(null)
          await loadSlots(selectedId)
          return
        }
        setFormError(body?.message ?? 'Не удалось записаться')
      } else {
        setFormError('Не удалось записаться')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function guestField(name: keyof typeof emptyGuest, label: string, type: string) {
    const error = fieldErrors[name]
    const errorId = `${name}-error`
    return (
      <p>
        <label>
          {label}
          <input
            type={type}
            value={guest[name]}
            onChange={(e) => setGuest((current) => ({ ...current, [name]: e.target.value }))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
        {error && <span id={errorId}>{error}</span>}
      </p>
    )
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

  const selectedEventType =
    state.status === 'ready' ? state.eventTypes.find((e) => e.id === selectedId) : undefined
  // Ошибка старта не относится к полям ввода: показываем её у формы
  const startError = fieldErrors.start

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
          {conflict && <p role="alert">{conflict}</p>}
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
                  {day.slots.map((slot) => (
                    <li key={slot.start.toISOString()}>
                      <button
                        type="button"
                        aria-pressed={selectedSlot?.start.getTime() === slot.start.getTime()}
                        onClick={() => selectSlot(slot)}
                      >
                        {timeFormat.format(slot.start)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
      {selectedSlot && selectedEventType && (
        <form aria-label="Данные гостя" onSubmit={submit} noValidate>
          <h2>Ваши данные</h2>
          <p>
            {selectedEventType.title}: {dayFormat.format(selectedSlot.start)},{' '}
            {timeFormat.format(selectedSlot.start)}
          </p>
          {guestField('guestName', 'Имя', 'text')}
          {guestField('guestEmail', 'Email', 'email')}
          {(startError || formError) && <p role="alert">{startError ?? formError}</p>}
          <button type="submit" disabled={submitting}>
            Записаться
          </button>
        </form>
      )}
      <Link to="/">На главную</Link>
    </main>
  )
}
