import runSeries from 'run-series';

import moduleBuild from '../moduleBuild';
import { directoryExists } from '../utils';
import buildDemo from './build-demo';

/**
 * Create a React component's CommonJS and ES modules and UMD builds, and build
 * its demo app if it has one.
 */
export default function buildModule(args, cb) {
  const config = {
    babel: {
      presets: [require.resolve('babel-preset-react')],
      stage: 1,
    },
  };

  // Disable removal of propTypes in production builds with --[keep-]proptypes
  if (args.proptypes !== true && args['keep-proptypes'] !== true) {
    // Wrap propTypes with an environment check in development builds
    config.babelDev = {
      removePropTypes: {
        mode: 'wrap',
      },
    };
    // Strip propTypes and prop-type imports from UMD production build
    config.babelProd = {
      removePropTypes: {
        removeImport: true,
      },
    };
  }

  const tasks = [cb => moduleBuild(args, config, cb)];
  // Disable demo build with --no-demo or --no-demo-build
  if (args.demo !== false
      && args['demo-build'] !== false
      && directoryExists('demo')) {
    tasks.push(taskCb => buildDemo(args, taskCb));
  }
  runSeries(tasks, cb);
}
