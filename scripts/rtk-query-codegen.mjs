import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const config = {
  // The bundled JSON is the current generation source of truth. The split YAML
  // references domain files that are not yet included in this repository.
  schemaFile: resolve(projectRoot, process.env.OPENAPI_SPEC ?? './openapi/openapi-full.json'),
  apiFile: '@/shared/lib/api.ts',
  apiImport: 'baseApi',
  outputFile: resolve(projectRoot, './src/shared/api/generated/api.ts'),
  exportName: 'generatedApi',
  operationNameSuffix: '',
  hooks: true,
  tag: false,
};

export default config;