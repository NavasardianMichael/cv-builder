import { CVTeplateType } from "../types/templates"

export type TemplatesSlice = {
    selectedTemplate: CVTeplateType
}

export type Actions = {
    setTemplates: TemplatesSlice
}