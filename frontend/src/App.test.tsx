import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  // Страница записи ходит в API: отдаём пустой список
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Главная страница', () => {
  it('рассказывает о сервисе и показывает три шага', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByText(/запишитесь без регистрации/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('ведёт на страницу записи', () => {
    renderAt('/')

    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book')
  })

  it('открывает страницу записи по клику на «Записаться»', async () => {
    renderAt('/')

    await userEvent.click(screen.getByRole('link', { name: 'Записаться' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Запись' })).toBeInTheDocument()
  })

  it('не показывает статус сервера', () => {
    renderAt('/')

    expect(screen.queryByText(/статус сервера/i)).not.toBeInTheDocument()
  })
})

describe('Страница записи', () => {
  it('открывается по адресу /book и возвращает на главную', async () => {
    renderAt('/book')

    expect(screen.getByRole('heading', { level: 1, name: 'Запись' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'На главную' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
  })
})
