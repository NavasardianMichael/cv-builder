import { CV_TEMPLATE_TYPES } from "../constants/templates"

export type CVTeplateType = typeof CV_TEMPLATE_TYPES[keyof typeof CV_TEMPLATE_TYPES]