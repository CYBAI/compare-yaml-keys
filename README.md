# Compare YAML Keys

> Compare YAML keys between yaml files and export them as csv file.

## Requirements:
- Node 7.6 ↑

## Usage

```sh
node -c ./config.json -o ~/Desktop/output.csv index.js
```

## Configuration

```json
{
  "yamlPath": "The parent folder of your yaml files",
  "incomplete": {
    "filename": "The filename of incomplete file",
    "key": "The top level key of the yaml file"
  },
  "schema": {
    "filename": "The filename of schema file",
    "key": "The top level key of the yaml file"
  }
}
```

