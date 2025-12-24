export async function resolve(specifier, context, defaultResolve) {
  return defaultResolve(specifier, context, defaultResolve)
}

export async function load(url, context, defaultLoad) {
  return defaultLoad(url, context, defaultLoad)
}
