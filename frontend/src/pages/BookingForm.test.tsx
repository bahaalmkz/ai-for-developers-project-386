import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const eventTypes = [{ id: 'intro-call', title: 'Знакомство', description: '', durationMinutes: 30 }]
const slots = [
  { start: '2026-11-23T09:00:00+05:00', end: '2026-11-23T09:30:00+05:00' },
  { start: '2026-11-23T09:30:00+05:00', end: '2026-11-23T10:00:00+05:00' },
]

type Handler = (init: RequestInit) => Response

// Подменяем сеть: список типов, слоты и POST /api/bookings
function stubApi(onBooking: Handler) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/bookings' && init?.method === 'POST') return onBooking(init)
    if (url === '/api/event-types') return json(eventTypes)
    if (url === '/api/event-types/intro-call/slots') return json(slots)
    throw new Error(`Неожиданный запрос ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function bookingCalls(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls.filter(([url]) => url === '/api/bookings')
}

async function openFormForSecondSlot() {
  render(
    <MemoryRouter initialEntries={['/book']}>
      <App />
    </MemoryRouter>,
  )
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Выбрать Знакомство' }))
  const day = await screen.findByRole('group', { name: /23 ноября/ })
  await user.click(within(day).getByRole('button', { name: '09:30' }))
  return user
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Форма гостя', () => {
  it('не показывается, пока слот не выбран', async () => {
    stubApi(() => json({}, 500))
    render(
      <MemoryRouter initialEntries={['/book']}>
        <App />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать Знакомство' }))
    await screen.findByRole('group', { name: /23 ноября/ })

    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()
  })

  it('после выбора слота показывает форму и отправляет запись с выбранным слотом', async () => {
    const booking = {
      id: 'b1',
      eventType: { id: 'intro-call', title: 'Знакомство' },
      start: '2026-11-23T09:30:00+05:00',
      end: '2026-11-23T10:00:00+05:00',
      guestName: 'Анна',
      guestEmail: 'anna@example.com',
    }
    const fetchMock = stubApi(() => json(booking, 201))
    const user = await openFormForSecondSlot()

    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.type(screen.getByLabelText('Email'), 'anna@example.com')
    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    // Переход на подтверждение с данными встречи
    expect(await screen.findByRole('heading', { name: 'Запись подтверждена' })).toBeInTheDocument()
    expect(screen.getByText(/Знакомство/)).toBeInTheDocument()
    expect(screen.getByText(/09:30/)).toBeInTheDocument()
    const [, init] = bookingCalls(fetchMock)[0]
    expect(JSON.parse(init?.body as string)).toEqual({
      eventTypeId: 'intro-call',
      start: '2026-11-23T04:30:00.000Z',
      guestName: 'Анна',
      guestEmail: 'anna@example.com',
    })
  })

  it('показывает ошибки по полям из ответа сервера и остаётся на странице', async () => {
    stubApi(() =>
      json(
        {
          code: 'validation_error',
          message: 'Ошибка данных',
          fieldErrors: { guestName: 'Введите имя', guestEmail: 'Введите email в формате' },
        },
        400,
      ),
    )
    const user = await openFormForSecondSlot()

    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    const name = await screen.findByLabelText('Имя')
    expect(name).toHaveAccessibleDescription('Введите имя')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(/Введите email/)
    expect(screen.queryByRole('heading', { name: 'Запись подтверждена' })).not.toBeInTheDocument()
  })

  it('показывает ошибку старта у формы, а не у поля ввода', async () => {
    stubApi(() =>
      json(
        { code: 'validation_error', message: 'Ошибка данных', fieldErrors: { start: 'Это время уже прошло' } },
        400,
      ),
    )
    const user = await openFormForSecondSlot()

    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Это время уже прошло')
  })

  it('показывает сообщение сервера, если запись не удалась', async () => {
    stubApi(() => json({ code: 'not_found', message: 'Not Found' }, 404))
    const user = await openFormForSecondSlot()

    await user.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Not Found')
  })
})
