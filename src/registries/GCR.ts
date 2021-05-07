import * as execa from 'execa'
import moment from 'moment'
import IRegistry from './IRegistry'
import { Image, NativeImageDesc } from './Types'

export default class GCR implements IRegistry {
	private conf: any
	constructor(config: any) {
		this.conf = config
	}

	execGcloud = async (options: string): Promise<string> => {
		try {
			const gcloud = ['gcloud', options].join(' ')
			const { stdout } = await execa.command(gcloud)
			return stdout
		} catch (error) {
			console.error(error)
			return ''
		}
	}

	convertNativeImageDescToImage = (image: string, tag: NativeImageDesc): Image => {
		return {
			image_name: image,
			digest: tag.digest,
			tags: tag.tags,
			datetime: moment(tag.timestamp.datetime).format('YYYY-MM-DD'),
		}
	}

	getProjects = async (): Promise<string[]> => {
		const images = (
			await this.execGcloud(
				`container images list --repository=${this.conf.hostname}/${this.conf.project}`,
			)
		)
			.split('\n')
			.slice(1)
			.map((element) => element.split('/').slice(2).join())
		return images
	}

	getImages = async (imageName: string): Promise<Image[]> => {
		const tags: NativeImageDesc[] = JSON.parse(
			await this.execGcloud(
				`container images list-tags ${this.conf.hostname}/${this.conf.project}/${imageName} --sort-by ~timestamp --format=json`,
			),
		)
		return tags.map((tag) => this.convertNativeImageDescToImage(imageName, tag))
	}

	cleanImage = async (toBeDeleted: Image[], toBeUpdated: Image[]) => {
		toBeUpdated.forEach(async (image) => {
			console.log(
				`untag: gcloud container images untag ${this.conf.hostname}/${this.conf.project}/${
					image.image_name
				}:${image.tags.filter((tag) => !tag.match(/v\d.\d.\d/))[0]} --quiet`,
			)
			await this.execGcloud(
				`container images untag ${this.conf.hostname}/${this.conf.project}/${image.image_name}:${
					image.tags.filter((tag) => !tag.match(/v\d.\d.\d/))[0]
				} --quiet`,
			)
		})
		toBeDeleted.forEach(async (image) => {
			console.log(
				`remove: gcloud container images delete ${this.conf.hostname}/${this.conf.project}/${image.image_name}@${image.digest} --force-delete-tags --quiet`,
			)
			await this.execGcloud(
				`container images delete ${this.conf.hostname}/${this.conf.project}/${image.image_name}@${image.digest} --force-delete-tags --quiet`,
			)
		})
	}

	getObsoleteImages = (res: Image[]): Image[] => {
		const release_regex = /v\d.\d.\d/
		const current_date = moment()
		const obs = res.filter(
			(element) =>
				element.tags.length === 1 &&
				element.tags.some((e) => !e.match(release_regex)) &&
				moment.duration(current_date.diff(moment(element.datetime)), 'milliseconds').asDays() > 30,
		)
		if (obs.length == res.length) {
			obs.shift()
		}
		return obs
	}

	getImagesWithDoubleTag = (res: Image[]): Image[] => {
		return res.filter(
			(element) =>
				element.tags.length > 1 && element.tags.filter((tag) => !tag.match(/v\d.\d.\d/)).length > 0,
		)
	}

	getImagesWithNoTag = (res: Image[]): Image[] => {
		const current_date = moment()
		const no = res.filter(
			(element) =>
				element.tags.length === 0 &&
				moment.duration(current_date.diff(moment(element.datetime)), 'milliseconds').asDays() > 30,
		)
		if (no.length == res.length) {
			no.shift()
		}
		return no
	}
}
