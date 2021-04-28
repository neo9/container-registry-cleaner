import GCR from './GCR'

export function RegistryFactory(name: string) {
    return new GCR()	
}