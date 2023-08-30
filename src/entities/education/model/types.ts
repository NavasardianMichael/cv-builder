export type Education = {
    id: string
    institution: {
        name: string,
        link?: string
    },
    dates: {
        start: string
        end: string
    },
    degree: string
    description?: string
}