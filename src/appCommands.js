// @flow
import fs from 'fs';
import path from 'path';

import runSeries from 'run-series';
import merge from 'webpack-merge';

import cleanApp from './commands/clean-app';
import { directoryExists, install } from './utils';
import webpackBuild from './webpackBuild';
import webpackServer from './webpackServer';

import type { ErrBack } from './types';

type AppConfig = {
  getName: () => string,
  getBuildDependencies: () => string[],
  getBuildConfig: () => Object,
  getServeConfig: () => Object,
};

const DEFAULT_HTML_PATH = 'src/index.html';

/**
 * Create default config for html-webpack-plugin.
 */
export function getDefaultHTMLConfig(cwd: string = process.cwd()) {
  // Use the default HTML template path if it exists
  if (fs.existsSync(path.join(cwd, DEFAULT_HTML_PATH))) {
    return {
      template: DEFAULT_HTML_PATH,
    };
  }
  // Otherwise provide default variables for the internal template, in case we
  // fall back to it.
  return {
    mountId: 'app',
    title: require(path.join(cwd, 'package.json')).name,
  };
}

/**
 * Create default command config for building an app and merge any extra config
 * provided into it.
 */
export function createBuildConfig(args: Object, extra: Object = {}) {
  const entry = path.resolve(args._[1] || 'src/index.js');
  const dist = path.resolve(args._[2] || 'dist');

  const production = process.env.NODE_ENV === 'production';
  const filenamePattern = production ? '[name].[chunkhash:8].js' : '[name].js';

  const config: Object = {
    devtool: 'source-map',
    entry: {
      app: [entry],
    },
    output: {
      filename: filenamePattern,
      chunkFilename: filenamePattern,
      path: dist,
      publicPath: '/',
    },
    plugins: {
      html: args.html !== false && getDefaultHTMLConfig(),
      vendor: args.vendor !== false,
    },
  };

  if (directoryExists('public')) {
    config.plugins.copy = [{ from: path.resolve('public'), to: dist, ignore: '.gitkeep' }];
  }

  if (args.polyfill === false || args.polyfills === false) {
    config.polyfill = false;
  }

  return merge(config, extra);
}

/**
 * Create a build, installing any required dependencies first if they're not
 * resolvable.
 */
export function build(args: Object, appConfig: AppConfig, cb: ErrBack) {
  const dist = args._[2] || 'dist';

  const tasks = [
    taskCb => cleanApp({ _: ['clean-app', dist] }, taskCb),
    taskCb => webpackBuild(
      `${appConfig.getName()} app`,
      args,
      () => createBuildConfig(args, appConfig.getBuildConfig()),
      taskCb,
    ),
  ];

  const buildDependencies = appConfig.getBuildDependencies();
  if (buildDependencies.length > 0) {
    tasks.unshift(taskCb => install(buildDependencies, { check: true }, taskCb));
  }

  runSeries(tasks, cb);
}

/**
 * Create default command config for serving an app and merge any extra config
 * objects provided into it.
 */
export function createServeConfig(args: Object, ...extra: Object[]) {
  const entry = path.resolve(args._[1] || 'src/index.js');
  const dist = path.resolve(args._[2] || 'dist');

  const config: Object = {
    entry: [entry],
    output: {
      path: dist,
      filename: 'app.js',
      publicPath: '/',
    },
    plugins: {
      html: getDefaultHTMLConfig(),
    },
  };

  if (directoryExists('public')) {
    config.plugins.copy = [{ from: path.resolve('public'), to: dist, ignore: '.gitkeep' }];
  }

  return merge(config, ...extra);
}

/**
 * Run a development server.
 */
export function serve(args: Object, appConfig: AppConfig, cb: ErrBack) {
  webpackServer(
    args,
    () => createServeConfig(args, appConfig.getServeConfig()),
    cb,
  );
}
