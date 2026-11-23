import { Link } from 'react-router-dom'

// Заглушка: выбор типа встречи и слота появится вместе с реализацией бронирования
export function BookingPage() {
  return (
    <main>
      <h1>Запись</h1>
      <p>Запись на встречу скоро заработает.</p>
      <Link to="/">На главную</Link>
    </main>
  )
}
