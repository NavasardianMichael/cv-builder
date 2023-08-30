import { Contact } from "entities/contact-item/model/types"
import { NormalizedShape } from "shared/types/commons"

export type HeadlinesSlice = {
    fullName: string
    bio: string
    contacts: NormalizedShape<Contact>
}

export type Actions = {
    setHeadlines: Partial<HeadlinesSlice>
}