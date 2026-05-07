const directImportMetaUrl = import.meta.url

const importMeta = import.meta
const undirectImportMetaUrl = importMeta.url

console.log(`child > import.meta.url: ${directImportMetaUrl}`)
console.log(`child > (import.meta).url: ${undirectImportMetaUrl}`)
