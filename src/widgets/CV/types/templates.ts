import { CV_TEMPLATE_TYPES } from "../constants/templates"
import { SECTION } from "./sections"

export type CV_TYPE = {
    id: typeof CV_TYPES[keyof typeof CV_TYPES]
    name: string
    sections: Record<SECTION['id'], SECTION>
}

export type CVTeplateType = typeof CV_TEMPLATE_TYPES[keyof typeof CV_TEMPLATE_TYPES]

export type CV_TEMPLATES_TYPE = {
    byId: Record<CV_TYPE['id'], CV_TYPE>,
    allIds: CV_TYPE['id'][]
}