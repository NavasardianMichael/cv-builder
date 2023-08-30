export const combineClassNames = (...classNames: string[]) => {
    return classNames.filter(className => !!className).join(' ')
}