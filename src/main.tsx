import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './styles.css'

function ensureLink(href: string, id = 'adobe-fonts') {
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

ensureLink('https://use.typekit.net/eks8xpc.css')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
