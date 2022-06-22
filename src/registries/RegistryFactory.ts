import GCR from './GCR'

export const loadConf = async () => {
  let conf: any
  if (process.env.CONF_FILE) {
    conf = await import(process.env.CONF_FILE)
  } else {
    conf = await import('../../config.json')
  }
  return conf
}

export async function RegistryFactory(name: string, valid_regex: string) {
  const config = await loadConf()
  switch (name) {
    case 'gcr':
      return new GCR(config, valid_regex)
    case 'ecr':
      throw new Error('not yet implemented')
    default:
      throw new Error('not supported')
  }
}
