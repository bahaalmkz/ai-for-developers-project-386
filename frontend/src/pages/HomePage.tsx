import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main>
      <h1>Календарь звонков</h1>
      <p>Выберите тип встречи, найдите свободное время и запишитесь без регистрации.</p>
      <ol aria-label="Как это работает">
        <li>Выберите тип встречи</li>
        <li>Выберите свободный слот</li>
        <li>Подтвердите запись</li>
      </ol>
      <Link to="/book">Записаться</Link>
    </main>
  )
}
