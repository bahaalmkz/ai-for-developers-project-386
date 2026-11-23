import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookingPage } from './BookingPage'

// Подменяем сеть, а не клиент: проверяем, что страница ходит в API через сгенерированный клиент
function stubFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Страница записи: типы встреч', () => {
  it('показывает название, описание и длительность каждого типа встречи', async () => {
    const fetchMock = stubFetch(
      json([
        { id: 'intro-call', title: 'Знакомство', description: 'Короткий звонок', durationMinutes: 30 },
        { id: 'consultation', title: 'Консультация', description: '', durationMinutes: 90 },
      ]),
    )

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Знакомство' })).toBeInTheDocument()
    expect(screen.getByText('Короткий звонок')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Консультация' })).toBeInTheDocument()
    expect(screen.getByText('1 ч 30 мин')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/event-types', expect.anything())
  })

  it('показывает состояние пустого списка', async () => {
    stubFetch(json([]))

    renderPage()

    expect(await screen.findByText('Типов встреч пока нет.')).toBeInTheDocument()
  })

  it('показывает ошибку, если сервер не ответил', async () => {
    stubFetch(json({ code: 'internal_error', message: 'Внутренняя ошибка сервера' }, 500))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить типы встреч')
  })
})

describe('Страница записи: свободные слоты', () => {
  const eventTypes = [
    { id: 'intro-call', title: 'Знакомство', description: '', durationMinutes: 30 },
    { id: 'consultation', title: 'Консультация', description: '', durationMinutes: 90 },
  ]

  function stubRoutes(slotsByType: Record<string, unknown[]>) {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/event-types') return Promise.resolve(json(eventTypes))
      const match = /^\/api\/event-types\/([^/]+)\/slots$/.exec(url)
      if (match && slotsByType[match[1]]) return Promise.resolve(json(slotsByType[match[1]]))
      return Promise.resolve(json({ code: 'not_found', message: 'Not Found' }, 404))
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('после выбора типа встречи показывает слоты по дням и подписывает пояс', async () => {
    const fetchMock = stubRoutes({
      'intro-call': [
        { start: '2026-11-23T09:00:00+05:00', end: '2026-11-23T09:30:00+05:00' },
        { start: '2026-11-23T09:30:00+05:00', end: '2026-11-23T10:00:00+05:00' },
        { start: '2026-11-24T09:00:00+05:00', end: '2026-11-24T09:30:00+05:00' },
      ],
    })
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать Знакомство' }))

    const days = await screen.findAllByRole('group')
    expect(days).toHaveLength(2)
    expect(within(days[0]).getByText('09:00')).toBeInTheDocument()
    expect(within(days[0]).getByText('09:30')).toBeInTheDocument()
    expect(within(days[1]).getByText('09:00')).toBeInTheDocument()
    expect(days[0]).toHaveAccessibleName(/23 ноября/)
    expect(days[1]).toHaveAccessibleName(/24 ноября/)
    expect(screen.getByText(/Asia\/Almaty/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/event-types/intro-call/slots', expect.anything())
  })

  it('показывает пустое состояние, если свободных слотов нет', async () => {
    stubRoutes({ consultation: [] })
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать Консультация' }))

    expect(await screen.findByText('Свободных слотов нет.')).toBeInTheDocument()
  })

  it('показывает ошибку, если слоты не загрузились', async () => {
    stubRoutes({})
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать Знакомство' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить слоты')
  })
})
