export const getAnchorRef = (link: string) => {
    let prefix = ''
    if (link === 'email') return prefix = 'mailto:'
    return prefix + link
}