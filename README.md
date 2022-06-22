# Container registry cleaner

CRC deletes obselets, untagged, auto-generated images in a Container Registry. This can help to keep your container images clean and in order.

### Configuration

CRC needs two json file to be configured :

- config.json

```json
{
  "hostname": "{{hostname}}",
  "project": "{{project}}"
}
```

- credentials.json

A user-managed key-pair used as a credential for a service account.

### Options

```
Container Registry Cleaner

USAGE
  $ container-registry-cleaner

OPTIONS
  -v, --version                              print the version of the cli
  -h, --help                                 show help
  -r, --registry=gcr|ecr                     (required) specify registry type
  -n, --name=name                            specify image name
  -f, --filter=filter                        filter by images by regex
  -S, --skip-confirm                         skip confimation
  --valid-version-regex=valid-version-regex  [default: v\d.\d.\d] valid version regex
  -l, --list-only                            show all images that will be deleted/updated (dry-run)
  --list-doubleTag                           show images with double tags (dry-run)
  --list-notag                               show images with no tags (dry-run)
  --list-obsolete                            show obsolete images (dry-run)
```

### Example to run local
```bash 
$ npm link
$ container-registry-cleaner --registry=gcr --name=frontoffice --format=json --skip-confirm 
$ container-registry-cleaner --registry=gcr --name=frontoffice --list-obsolete  --valid-version-regex="v\d.\d.\d|v\d.\d.\d[-,a-z,A-Z,0-9]*|latest"
```

### Example with Docker

```bash
$ docker build -t crc .
$ docker run -ti 
	--rm 
	--volume=/tmp/gcr/:/conf 
	--env CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE=/conf/credentials.json 
	--volume=/container-registry-cleaner/config/:/config 
	--env CONF_FILE=/config/config.json 
	crc 
		container-registry-cleaner --registry=gcr --name=frontoffice --format=json  --skip-confirm 
```
