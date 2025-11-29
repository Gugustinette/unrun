const main = async () => {
  // @ts-ignore: Intentionally import an optional dependency
  // Which won't be present, thus not resolvable
  const { formatMessage } = await import("publint/utils")
  return formatMessage
}

export default { main }