import license from 'rollup-plugin-license'

export function getLicenseBanner(): string {
  return license()
}
