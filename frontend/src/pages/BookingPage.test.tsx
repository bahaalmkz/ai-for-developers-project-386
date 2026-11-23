import { render, screen } from '@testing-library/react'
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
