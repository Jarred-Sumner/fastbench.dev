const { lstatSync, readdirSync, writeFileSync } = require("fs");
const { join, cwd, dirname } = require("path");
const slugify = require("slugify");

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .filter((name) => slugify(name) === name && !name.startsWith("."))
    .map((name) => join(source, name))
    .filter(isDirectory);

function buildIndex(dir) {
  const versions = {};
  getDirectories(dir)
    .map(getDirectories)
    .flat(1)
    .sort()
    .map((name) => {
      const structure = name.split("/");

      const id = structure[structure.length - 2];
      const version = structure[structure.length - 1];
      if (!versions[id]) {
        versions[id] = [];
      }

      versions[id].push(version);
    });
  return {
    benchmarks: versions,
    timestamp: new Date().toISOString(),
  };
}

process.stdout.write(JSON.stringify(buildIndex(process.argv[2]), null, 2));
