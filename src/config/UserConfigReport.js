import util from 'util';

import chalk from 'chalk';
import figures from 'figures';

import { pluralise as s } from '../utils';

export default class UserConfigReport {
  constructor({ configFileExists, configPath } = {}) {
    this.configFileExists = configFileExists;
    this.configPath = configPath;
    this.deprecations = [];
    this.errors = [];
    this.hints = [];
    this.hasArgumentOverrides = false;
  }

  deprecated(path, ...messages) {
    this.deprecations.push({ path, messages });
  }

  error(path, value, message) {
    this.errors.push({ path, value, message });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasSomethingToReport() {
    return this.errors.length + this.deprecations.length + this.hints.length > 0;
  }

  hint(path, ...messages) {
    this.hints.push({ path, messages });
  }

  getConfigSource() {
    if (this.configFileExists) {
      let description = this.configPath;
      if (this.hasArgumentOverrides) {
        description += ' (with CLI argument overrides)';
      }
      return description;
    }
    if (this.hasArgumentOverrides) {
      return 'config via CLI arguments';
    }
    return 'funsies';
  }

  getReport() {
    const report = [];

    report.push(chalk.underline(`nwb config report for ${this.getConfigSource()}`));
    report.push('');

    if (!this.hasSomethingToReport()) {
      report.push(chalk.green(`${figures.tick} Nothing to report!`));
      return report.join('\n');
    }

    if (this.errors.length) {
      const count = this.errors.length > 1 ? `${this.errors.length} ` : '';
      report.push(chalk.red.underline(`${count}Error${s(this.errors.length)}`));
      report.push('');
    }
    this.errors.forEach(({ path, value, message }) => {
      report.push(`${chalk.red(`${figures.cross} ${path}`)} ${chalk.cyan('=')} ${util.inspect(value)}`);
      report.push(`  ${message}`);
      report.push('');
    });

    if (this.deprecations.length) {
      const count = this.deprecations.length > 1 ? `${this.deprecations.length} ` : '';
      report.push(chalk.yellow.underline(`${count}Deprecation Warning${s(this.deprecations.length)}`));
      report.push('');
    }
    this.deprecations.forEach(({ path, messages }) => {
      report.push(chalk.yellow(`${figures.warning} ${path}`));
      messages.forEach((message) => {
        report.push(`  ${message}`);
      });
      report.push('');
    });

    if (this.hints.length) {
      const count = this.hints.length > 1 ? `${this.hints.length} ` : '';
      report.push(chalk.cyan.underline(`${count}Hint${s(this.hints.length)}`));
      report.push('');
    }
    this.hints.forEach(({ path, messages }) => {
      report.push(chalk.cyan(`${figures.info} ${path}`));
      messages.forEach((message) => {
        report.push(`  ${message}`);
      });
      report.push('');
    });

    return report.join('\n');
  }

  log() {
    console.log(this.getReport());
  }
}
