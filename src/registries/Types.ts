interface Image {
	image_name: string
	digest: string
	tags: string[]
	datetime: string
}

interface NativeImageDesc {
	digest: string
	tags: string[]
	timestamp: Timestamp
}

interface Timestamp {
	datetime: string
	day: number
	fold: number
	hour: number
	microsecond: number
	minute: number
	month: number
	second: number
	year: number
}

export { Image, Timestamp, NativeImageDesc }
