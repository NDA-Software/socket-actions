/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import indexer from 'rollup-plugin-indexer';
import { dts } from 'rollup-plugin-dts';

const packageJson = JSON.parse(readFileSync('./package.json'));
const tsConfig = JSON.parse(readFileSync('./tsconfig.json'));

const applyCustomization = (defaultConfig, customConfig) => {
    let output = defaultConfig.output;

    if (customConfig.output?.[0] !== undefined) {
        output[0] = {
            ...output[0],
            ...customConfig.output[0]
        };

        if (customConfig.output[1] !== undefined) {
            customConfig.output.shift();

            output = [
                ...output,
                ...customConfig.output
            ];
        }
    }

    const plugins = [
        ...sharedConfigs.plugins,
        ...customConfig.plugins,
        ...defaultConfig.plugins
    ];

    return {
        ...sharedConfigs,
        ...customConfig,
        output,
        plugins
    };
};

// #region Mock Data:
const tempFolder = '.temp';
if (!existsSync(tempFolder))
    mkdirSync(tempFolder);

const mockFile = `${tempFolder}/mock.js`;
if (!existsSync(mockFile))
    writeFileSync(mockFile, 'export default () => 42;');

const mockConfig = {
    input: '.temp/mock.js',
    output: [{ dir: '.temp/' }]
};
// #endregion

// #region Base Configs:
const { exports } = packageJson;

const config = [];

const external = [];

for (const key in packageJson.peerDependencies)
    external.push(key);

const sharedConfigs = {
    input: 'src/index.ts',
    plugins: [
        nodeResolve(),
        json()
    ],
    external
};

const hasCjs = exports['.'].require !== undefined;
const hasEsm = exports['.'].import !== undefined;
const hasTypes = tsConfig.compilerOptions.declaration === true;

let declaration = hasTypes;
let declarationDir = declaration ? './dist/types/' : undefined;
const preserveModules = (Object.keys(exports)).length > 1;
// #endregion

// #region Customizations:
const configCjs = {
    output: [{}],
    plugins: [
        indexer('src', { nameCasing: 'PascalCase', exportMode: 'default' }),
        indexer(['src/server', 'src/helpers'], { nameCasing: 'PascalCase' })
    ]
};

const configEsm = {
    output: [{}],
    plugins: []
};
// #endregion

// #region Preparing Export Data:
if (hasCjs) {
    const finalConfigCjs = applyCustomization({
        output: [{
            exports: 'named',
            dir: 'dist/',
            format: 'cjs',
            preserveModules,
            entryFileNames: '[name].cjs'
        }],
        plugins: [
            typescript({ tsconfig: 'tsconfig.json', declaration, declarationDir })
        ]
    }, configCjs);

    config.push(finalConfigCjs);
}

if (hasEsm) {
    let folder = 'dist/';

    if (hasCjs) {
        folder = 'dist/esm/';
        declaration = false;
        declarationDir = undefined;

        config.push({
            ...mockConfig,
            plugins: [
                copy({
                    targets: [
                        { src: ['dist/*', '!dist/cjs', '!dist/types', '!dist/esm'], dest: 'dist/cjs/' }
                    ]
                })
            ]
        });

        config.push({
            ...mockConfig,
            plugins: [
                del({
                    targets: ['dist/*', '!dist/cjs', '!dist/types'],
                    recursive: true
                })
            ]
        });
    }

    const finalConfigEsm = applyCustomization({
        output: [{
            exports: 'named',
            dir: folder,
            format: 'esm',
            preserveModules,
            entryFileNames: '[name].mjs'
        }],
        plugins: [
            typescript({ tsconfig: 'tsconfig.json', declaration, declarationDir })
        ]
    }, configEsm);

    config.push(finalConfigEsm);
}
// #endregion

// #region Organizing Types:
if (hasTypes) {
    config.push({
        ...mockConfig,
        plugins: [
            copy({
                targets: [
                    { src: 'dist/types/src/*', dest: 'dist/types' }
                ]
            })
        ]
    });

    config.push({
        input: 'dist/types/index.d.ts',
        output: [{
            file: 'dist/types/index.d.ts',
            format: 'es'
        }],
        plugins: [dts()],
        external: ['http']
    });

    config.push({
        input: 'dist/types/server/index.d.ts',
        output: [{
            file: 'dist/types/server.d.ts',
            format: 'es'
        }],
        plugins: [dts()],
        external: ['http']
    });

    config.push({
        input: 'dist/types/helpers/index.d.ts',
        output: [{
            file: 'dist/types/helpers.d.ts',
            format: 'es'
        }],
        plugins: [dts()],
        external: ['http']
    });

    config.push({
        ...mockConfig,
        plugins: [
            del({
                targets: ['dist/types/src', 'dist/types/tests', 'dist/types/helpers/', 'dist/types/server', 'dist/types/mockActions'],
                recursive: true
            })
        ]
    });
}
// #endregion

export default config;
