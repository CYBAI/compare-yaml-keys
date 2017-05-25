const fs = require('mz/fs');
const { argv } = require('yargs');
const json2csv = require('json2csv');
const isObject = require('lodash.isobject');

const { safeLoad } = require('js-yaml');
const { diff } = require('deep-diff');

const configPath = argv.config || argv.c || './config.json';
const config = require(configPath);
const { yamlPath, incomplete, schema } = config;

const outputPath = argv.output || argv.o || './output.csv';

const FIELDS = ['key', 'value'];

const flatten = (list) => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

async function readYamlDirectory(path) {
  const folderList = await fs.readdir(path);
  const result = await Promise.all(
    folderList.map(async (folder) => await compare(`${path}/${folder}`))
  );
  return result.filter(v => !!v);
}

async function readYAMLToJSON(path) {
  const content = await fs.readFile(path);
  return safeLoad(content);
}

async function compare(folderPath) {
  const incompleteObj = await readYAMLToJSON(`${folderPath}/${incomplete.filename}.yml`);
  const schemaObj = await readYAMLToJSON(`${folderPath}/${schema.filename}.yml`);
  return diff(schemaObj[schema.key], incompleteObj[incomplete.key])
    .filter(v => v.kind === 'A' || v.kind === 'D');
}

async function execute() {
  const parsedYaml = await readYamlDirectory(yamlPath);

  const flattened = flatten(parsedYaml);

  const csvDataObject = flattened.reduce((result, node) => {
    const nodePath = node.path.join('.');
    if (node.kind === 'D') {
      recursiveAssign(result, node.lhs, nodePath);
    } else {
      console.warn(`${nodePath} only exist in your incomplete file but not in schema`);
    }
    return result;
  }, {});

  const csvData = Object.keys(csvDataObject).map((csvKey) => ({
    key: csvKey,
    value: csvDataObject[csvKey]
  }));

  const csv = json2csv({ data: csvData, fields: FIELDS });
  fs.writeFile(outputPath, csv, function(err) {
    if (err) throw err;
    console.log(`CSV saved to ${outputPath}`);
  });
}

function recursiveAssign(result, lhs, nodePath) {
  if (isObject(lhs)) {
    Object.keys(lhs).forEach((key) => {
      if (isObject(lhs[key])) {
        recursiveAssign(result, lhs[key], `${nodePath}.${key}`)
      } else {
        result[`${nodePath}.${key}`] = lhs[key];
      }
    });
  } else {
    result[nodePath] = lhs;
  }
}

execute();
