import { Image } from './Types'

interface IRegistry {
	getProjects(): Promise<string[]>
	getImages(imageName: string): Promise<Image[]>
	cleanImage(toBeDeleted: Image[], toBeUpdated: Image[]): void
	getObsoleteImages(images: Image[]): Image[]
	getImagesWithDoubleTag(images: Image[]): Image[]
	getImagesWithNoTag(images: Image[]): Image[]
}

export default IRegistry
