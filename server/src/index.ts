import { createApp } from './app.js'
import { config, isPaymentConfigured } from './config.js'

import './load-env.js'

// The API process: one Express app, listening on the configured host and port.
const app = createApp()

app.listen(config.port, config.host, () => {
  console.log(`CV builder API listening on http://${config.host}:${config.port}`)
  if (!isPaymentConfigured()) {
    console.warn(`[payments] gateway "${config.payments.gateway}" is not configured — checkout answers 503`)
  }
})
