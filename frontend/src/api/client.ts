import { Configuration, EventTypesApi } from './generated'

// Относительный basePath: в dev-режиме запросы идут через прокси Vite на бэкенд
const configuration = new Configuration({ basePath: '' })

export const eventTypesApi = new EventTypesApi(configuration)
