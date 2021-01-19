export interface SearchResult {
  meta: Meta;
  results: Result[];
}

export interface Meta {
  page: number;
  resultsPerPage: number;
  time: number;
  totalCount: number;
  totalPages: number;
}

export interface Result {
  createdAt: string;
  description: string;
  hasTypes: boolean;
  isDeprecated: boolean;
  maintainers: Maintainer[];
  name: string;
  popularityScore: number;
  updatedAt: string;
}

export interface Maintainer {
  name: string;
  email: string;
}

export interface Package {
  popularityScore: number;
  readmeHtml: string;
  updatedAt: string;
  createdAt: string;
  maintainers: Maintainer[];
  qualityScore: number;
  description: string;
  projectType: string;
  keywords: any[];
  versions: { [key: string]: string };
  exportMap: null;
  registry: string;
  license: string;
  isDeprecated: boolean;
  dependenciesCount: number;
  distTags: DistTags;
  name: string;
  links: Link[];
  packageChecks: PackageChecks;
}

export interface DistTags {
  latest: string;
}

export interface Link {
  url: string;
  title: string;
}

export interface Maintainer {
  email: string;
  name: string;
}

export interface PackageChecks {
  esm: Esm;
  exportMap: Esm;
  repo: Esm;
  files: Esm;
  keywords: Esm;
  license: Esm;
  types: Esm;
  readme: Esm;
}

export interface Esm {
  url: string;
  pass: boolean;
  title: string;
}

let moduleURLCache = new Map();

export async function resolveSkypackModule(name: string): Promise<string> {
  if (!moduleURLCache.has(name)) {
    const pkg: Package = await (
      await fetch(`https://api.skypack.dev/v1/package/${name}`, {
        credentials: "omit",
        mode: "cors",
      })
    ).json();

    moduleURLCache.set(
      name,
      `https://cdn.skypack.dev/${pkg.name}@${pkg.distTags.latest}`
    );
  }

  return moduleURLCache.get(name);
}

export async function skypackURL(query: string): Promise<SearchResult> {
  return await (
    await fetch(
      `https://api.skypack.dev/v1/search?q=${encodeURIComponent(query)}&p=1`,
      {
        credentials: "omit",
        mode: "cors",
      }
    )
  ).json();
}
