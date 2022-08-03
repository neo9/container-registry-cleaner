import { Command, flags } from '@oclif/command'
import * as inquirer from 'inquirer'
import { Image } from './registries/Types'
import * as registryFactory from './registries/RegistryFactory'

class ContainerRegistryCleaner extends Command {
  static description = `Container Registry Cleaner
		Deletes obselets, untagged, auto-generated images in a Container Registry. This can help to keep your container images clean and in order`

  static examples = [
    '$ container-registry-cleaner --registry=gcr --name=frontoffice --format=json --skip-confirm ',
    `$ container-registry-cleaner --registry=gcr --name=frontoffice --list-obsolete  --valid-version-regex='^v(\\d+\\.)?(\\d+\.)?(\\*|\\d+)[-,a-z,A-Z,0-9]*|latest'`,
  ]

  static usage = `--registry={gcr|ecr} [--name=<value>] [--filter=<value>] [--valid-version-regex=<value>] [--format=json] ([--skip-confirm] | ([--list-only] | [--list-doubleTag] [--list-notag] [--list-obsolete]))`

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
    'valid-version-regex': flags.string({
      description: 'valid version regex',
      default: '^v(\\d+\\.)?(\\d+.)?(\\*|\\d+)[-,a-z,A-Z,0-9]*$',
    }),
  }

  async run() {
    const { flags } = this.parse(ContainerRegistryCleaner)
    let registry = await registryFactory.RegistryFactory(flags.registry, flags['valid-version-regex'])
    let res: Image[] = []
    let obsolete: Image[] = []
    let doubleTag: Image[] = []
    let noTag: Image[] = []
    if (flags.name) {
      !flags.format && this.log('*** GETTING IMAGES ***')
      res = [...(await registry.getImages(flags.name))]
      obsolete = registry.getObsoleteImages(res)
      doubleTag = registry.getImagesWithDoubleTag(res)
      noTag = registry.getImagesWithNoTag(res)
    } else if (flags.filter) {
      let projects = await registry.getProjects()
      const regex = new RegExp(`${flags.filter}`, 'g')
      projects = projects.filter((project) => project.match(regex))
      for (const index in projects) {
        let tags = await registry.getImages(projects[index])
        !flags.format && this.log(`${projects[index]} has ${tags.length + 1} images in total `)
        const _obsolete = registry.getObsoleteImages(tags)
        const _doubleTag = registry.getImagesWithDoubleTag(tags)
        const _noTag = registry.getImagesWithNoTag(tags)
        obsolete = [...obsolete, ..._obsolete]
        doubleTag = [...doubleTag, ..._doubleTag]
        noTag = [...noTag, ..._noTag]
        res = [...res, ..._obsolete, ..._doubleTag, ..._noTag]
      }
    } else {
      !flags.format && this.log('*** GETTING PROJECTS ***')
      const projects = await registry.getProjects()
      for (const index in projects) {
        let tags = await registry.getImages(projects[index])
        !flags.format && this.log(`${projects[index]} has ${tags.length + 1} images in total `)
        const _obsolete = registry.getObsoleteImages(tags)
        const _doubleTag = registry.getImagesWithDoubleTag(tags)
        const _noTag = registry.getImagesWithNoTag(tags)
        obsolete = [...obsolete, ..._obsolete]
        doubleTag = [...doubleTag, ..._doubleTag]
        noTag = [...noTag, ..._noTag]
        res = [...res, ..._obsolete, ..._doubleTag, ..._noTag]
      }
    }

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
      !flags.format &&
        this.log(
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
