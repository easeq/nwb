import { Server } from 'karma';

import { getPluginConfig, getUserConfig } from './config';
import createKarmaConfig from './createKarmaConfig';
import { KarmaExitCodeError } from './errors';

export default function karmaServer(args, buildConfig, cb) {
  // Force the environment to test
  process.env.NODE_ENV = 'test';

  const pluginConfig = getPluginConfig(args);
  const userConfig = getUserConfig(args, { pluginConfig });
  const karmaConfig = createKarmaConfig(args, buildConfig, pluginConfig, userConfig);

  new Server(karmaConfig, (exitCode) => {
    if (exitCode !== 0) return cb(new KarmaExitCodeError(exitCode));
    cb();
  }).start();
}
