import GCR from './GCR'

export const loadConf = async () => {
    let conf:any
    if (process.env.CONF_FILE) {
        conf = await import(process.env.CONF_FILE)
    } else {
        conf = await import('../../config.json')
    }
    return conf
}

export async function RegistryFactory(name: string) {
    const config = await loadConf()
    return new GCR(config)	
}