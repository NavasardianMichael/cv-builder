import type { Endpoint } from '@interfaces/api'

/** What the API can do right now: whether to show the Google button, whether checkout works. */
export type AppCapabilities = { google: boolean; payments: boolean; priceAmd: number }

export type HealthResponse = AppCapabilities & { status: string }

export type GetCapabilitiesAPI = Endpoint<{ payload: void; response: HealthResponse; processed: AppCapabilities }>
