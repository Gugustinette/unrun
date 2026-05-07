import './child'

const directImportMetaUrl = import.meta.url

const importMeta = import.meta
const undirectImportMetaUrl = importMeta.url

console.log(`import.meta.url: ${directImportMetaUrl}`)
console.log(`(import.meta).url: ${undirectImportMetaUrl}`)
