export type Experience = {
    id: string
    company: {
        name: string,
        link?: string
    },
    dates: {
        start: string
        end: string
    },
    position: string
    description?: string
}