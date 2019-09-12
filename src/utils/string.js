const toString = (value) => {
    if (value === null || typeof value === 'undefined') {
        return ''
    } else if (value instanceof Object) {
        return Object.keys(value)
        .sort()
        .map(key => toString(value[key]))
        .join(' ')
    } else {
        return String(value)
    }
}

export { toString }
