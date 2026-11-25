import { generateApi } from 'swagger-typescript-api';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

const apisPaths = ['App', 'Auth', 'Starfall'];

const generateApiByPath = async (apiName: string) => {
  await generateApi({
    apiClassName: apiName,
    moduleNameIndex: 1,
    moduleNameFirstTag: apiName === 'App',
    output: resolve(cwd(), `./src/api/swagger/${apiName}`),
    templates: resolve(cwd(), './bin/api-generator/templates'),
    url: `http://localhost:5000/api/docs/${apiName}-yaml`,
    httpClientType: 'axios',
    extractEnums: true,
    extractRequestParams: true,
    unwrapResponseData: true,
    cleanOutput: true,
    modular: true
  });
};

apisPaths.forEach((path) => generateApiByPath(path));
