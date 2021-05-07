import { Command, flags } from '@oclif/command'
import * as inquirer from 'inquirer'
import { Image } from './registries/Types'
import * as registryFactory from './registries/RegistryFactory'

class ContainerRegistryCleaner extends Command {
	static description = 'Container Registry Cleaner'

	static flags = {
		'version': flags.version({ char: 'v', description: 'print the version of the cli' }),
		'help': flags.help({ char: 'h', description: 'show help' }),
		'registry': flags.string({
			char: 'r',
			description: 'specify registry type',
			options: ['gcr', 'ecr'],
			required: true,
		}),
		'name': flags.string({ char: 'n', description: 'specify image name' }),
		'filter': flags.string({ char: 'f', description: 'filter by regex' }),
		'list-only': flags.boolean({
			char: 'l',
			description: 'show all images that will be deleted/updated',
		}),
		'list-obsolete': flags.boolean({ description: 'show obsolete images' }),
		'list-doubleTag': flags.boolean({ description: 'show images with double tags' }),
		'list-notag': flags.boolean({ description: 'show images with no tags' }),
		'skip-confirm': flags.boolean({ char: 'S', description: 'skip confimation' }),
		'format': flags.string({ description: 'specify the format', options: ['json'] }),
	}

	async run() {
		const { flags } = this.parse(ContainerRegistryCleaner)
		let registry = await registryFactory.RegistryFactory(flags.registry)
		let res: Image[] = []
		if (flags.name) {
			!flags.format && this.log('*** GETTING IMAGES ***')
			res = [...(await registry.getImages(flags.name))]
		} else if (flags.filter) {
			let projects = await registry.getProjects()
			const regex = new RegExp(`${flags.filter}`, 'g')
			projects = projects.filter((project) => project.match(regex))
			for (const index in projects) {
				let tags = await registry.getImages(projects[index])
				!flags.format && this.log(`${projects[index]} has ${tags.length + 1} images in total `)
				res = [...res, ...tags]
			}
		} else {
			!flags.format && this.log('*** GETTING PROJECTS ***')
			const projects = await registry.getProjects()
			for (const index in projects) {
				let tags = await registry.getImages(projects[index])
				!flags.format && this.log(`${projects[index]} has ${tags.length + 1} images in total `)
				res = [...res, ...tags]
			}
		}
		const obsolete = registry.getObsoleteImages(res)
		const doubleTag = registry.getImagesWithDoubleTag(res)
		const noTag = registry.getImagesWithNoTag(res)
		if (flags['list-only']) {
			if (flags.format?.toLowerCase() === 'json') {
				console.log(JSON.stringify({ obsolete, doubleTag, noTag }))
			} else {
				this.log('**obsolete images')
				console.table(obsolete)
				this.log('**double tag images')
				console.table(doubleTag)
				this.log('**no tag images')
				console.table(noTag)
			}
		} else if (flags['list-obsolete'] || flags['list-doubleTag'] || flags['list-notag']) {
			if (flags['list-obsolete']) {
				if (flags.format?.toLowerCase() === 'json') {
					console.log(JSON.stringify({ obsolete }))
				} else {
					this.log('**obsolete images')
					console.table(obsolete)
				}
			}
			if (flags['list-doubleTag']) {
				if (flags.format?.toLowerCase() === 'json') {
					console.log(JSON.stringify({ doubleTag }))
				} else {
					this.log('**double tag images')
					console.table(doubleTag)
				}
			}
			if (flags['list-notag']) {
				if (flags.format?.toLowerCase() === 'json') {
					console.log(JSON.stringify({ noTag }))
				} else {
					this.log('**no tag images')
					console.table(noTag)
				}
			}
		} else {
			!flags.format && this.log(
				`${flags.name ?? 'the registry'} has ${res.length + 1} images in total in which ${
					obsolete.length + doubleTag.length
				} can be deleted/updated`,
			)
			if (!flags['skip-confirm']) {
				let responses: any = await inquirer.prompt([
					{
						name: 'response',
						message: 'Are you sure ?',
						type: 'list',
						choices: [{ name: 'Yes' }, { name: 'No' }],
					},
				])
				if (responses.response === 'Yes') {
					await registry.cleanImage([...obsolete, ...noTag], doubleTag)
				} else {
					this.log('Aborted')
				}
			} else {
				await registry.cleanImage([...obsolete, ...noTag], doubleTag)
			}
		}
	}
}

export = ContainerRegistryCleaner
