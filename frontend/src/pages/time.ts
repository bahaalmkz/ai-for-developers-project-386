// Часовой пояс владельца (ADR 0003): время всегда показываем в нём
export const OWNER_TIMEZONE = 'Asia/Almaty'

export const dayFormat = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})
