import React from 'react'
import { createRoot } from 'react-dom/client'
import CalendarApp from './js/components/react/CalendarApp'
import './js/components/react/styles/index.css'

const container = document.getElementById('react-calendar')
if (container) {
  const root = createRoot(container)
  root.render(<CalendarApp />)
}
