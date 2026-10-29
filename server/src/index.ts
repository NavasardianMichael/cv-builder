import { createApp } from './app.js'
import { config, isPaymentConfigured } from './config.js'

import './load-env.js'

const app = createApp()

app.listen(config.port, config.host, () => {
  console.log(`Ռեզյումե API listening on http://${config.host}:${config.port}`)
  if (!isPaymentConfigured()) {
    console.warn(`[payments] gateway "${config.payments.gateway}" is not configured — checkout answers 503`)
  }
})
