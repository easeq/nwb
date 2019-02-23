// @flow
import path from 'path';

import { modulePath } from '../utils';

function getBaseConfig(): Object {
  return {
    babel: {
      presets: [require.resolve('babel-preset-react')],
    },
  };
}

function getBaseDependencies() {
  return ['react', 'react-dom'];
}

function getBuildConfig(args, options: {useModulePath?: boolean} = {}) {
  const config = getBaseConfig();

  if (process.env.NODE_ENV === 'production') {
    // User-configurable, so handled by createBabelConfig
    config.babel.presets.push('react-prod');
  }

  const aliasPath = options.useModulePath ? modulePath : alias => alias;

  if (args.inferno || args['inferno-compat']) {
    config.resolve = {
      alias: {
        react: aliasPath('inferno-compat'),
        'react-dom': aliasPath('inferno-compat'),
      },
    };
  } else if (args.preact || args['preact-compat']) {
    // Use the path to preact-compat.js, as using the path to the preact-compat
    // module picks up the "module" build, which prevents hijacking the render()
    // function in the render shim.
    const preactCompathPath = path.join(aliasPath('preact-compat'), 'dist/preact-compat');
    config.resolve = {
      alias: {
        react: preactCompathPath,
        'react-dom': preactCompathPath,
        'create-react-class': 'preact-compat/lib/create-react-class',
      },
    };
  }

  return config;
}

class ReactConfig {
  args: Object;

  constructor(args: Object) {
    this.args = args;
  }

  getCompatDependencies() {
    if (this.args.inferno || this.args['inferno-compat']) {
      return ['inferno', 'inferno-compat', 'inferno-clone-vnode', 'inferno-create-class', 'inferno-create-element'];
    }
    if (this.args.preact || this.args['preact-compat']) {
      return ['preact', 'preact-compat'];
    }
    return [];
  }

  getCompatName() {
    if (this.args.inferno || this.args['inferno-compat']) {
      return 'Inferno (React compat)';
    }
    if (this.args.preact || this.args['preact-compat']) {
      return 'Preact (React compat)';
    }
    return 'React';
  }

  getQuickConfig() {
    return {
      defaultTitle: `${this.getName()} App`,
      renderShim: require.resolve('./renderShim'),
      renderShimAliases: {
        react: modulePath('react'),
        'react-dom': modulePath('react-dom'),
      },
    };
  }

  getProjectDefaults() {
    return {};
  }

  getProjectDependencies() {
    return getBaseDependencies();
  }

  getProjectQuestions() {
    return null;
  }

  getName = () => {
    if (/^build/.test(this.args._[0])) {
      return this.getCompatName();
    }
    return 'React';
  }

  getBuildDependencies = () => this.getCompatDependencies()

  getBuildConfig = () => getBuildConfig(this.args)

  getServeConfig = () => {
    const config = getBaseConfig();
    config.babel.presets.push(require.resolve('./react-dev-preset'));

    if (this.args.hmr !== false && this.args.hmre !== false) {
      config.babel.presets.push(require.resolve('./react-hmre-preset'));
    }

    return config;
  }

  getQuickDependencies = (): string[] => {
    let deps = getBaseDependencies();
    if (/^build/.test(this.args._[0])) {
      deps = deps.concat(this.getCompatDependencies());
    }
    return deps;
  }

  getQuickBuildConfig = () => ({
    commandConfig: getBuildConfig(this.args, { useModulePath: true }),
    ...this.getQuickConfig(),
  })

  getQuickServeConfig = () => ({
    commandConfig: this.getServeConfig(),
    ...this.getQuickConfig(),
  })

  getKarmaTestConfig() {
    return getBaseConfig();
  }
}

export default (args: Object) => new ReactConfig(args);
