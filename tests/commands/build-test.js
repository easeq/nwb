import fs from 'fs';
import path from 'path';

import expect from 'expect';
import glob from 'glob';
import rimraf from 'rimraf';
import temp from 'temp';

import cli from '../../src/cli';

const stripHashes = files => files.map(file => file.replace(/\.\w{8}\./, '.'));

describe('command: build', () => {
  let originalCwd;
  let originalNodeEnv;
  let tmpDir;

  beforeEach((done) => {
    this.timeout(90000);
  });

  function setUp() {
    originalCwd = process.cwd();
    originalNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    tmpDir = temp.mkdirSync('nwb-test');
    process.chdir(tmpDir);
  }

  function tearDown(done) {
    process.chdir(originalCwd);
    process.env.NODE_ENV = originalNodeEnv;
    rimraf(tmpDir, done);
  }

  describe('building a React app', () => {
    let builtHTML;

    before((done) => {
      setUp();
      cli(['new', 'react-app', 'test-app'], (err) => {
        expect(err).toNotExist('No errors creating a new React app');
        process.chdir(path.join(tmpDir, 'test-app'));
        cli(['build'], (cliErr) => {
          expect(cliErr).toNotExist('No errors building a React app');
          builtHTML = fs.readFileSync('dist/index.html', 'utf8');
          done(cliErr);
        });
      });
    });
    after(tearDown);

    it('creates a build with sourcemaps', () => {
      const files = stripHashes((glob.sync('*', { cwd: path.resolve('dist') }))).sort();
      expect(files).toEqual([
        'app.css',
        'app.css.map',
        'app.js',
        'app.js.map',
        'index.html',
        'react.svg',
        'runtime.js',
        'runtime.js.map',
        'vendor.js',
        'vendor.js.map',
      ]);
    });
    it('injects the Webpack runtime into generated HTML', () => {
      expect(builtHTML).toInclude('window.webpackJsonp');
    });
    it('does not generate a <script src> for the runtime', () => {
      expect(builtHTML).toNotInclude('src="/runtime"');
    });
    it('injects scripts in the correct order', () => {
      const appIndex = builtHTML.indexOf('src="/app');
      const vendorIndex = builtHTML.indexOf('src="/vendor');
      expect(appIndex).toNotBe(-1);
      expect(vendorIndex).toNotBe(-1);
      expect(vendorIndex).toBeLessThan(appIndex);
    });
  });

  describe('building a React component and its demo app', () => {
    before((done) => {
      setUp();
      cli(['new', 'react-component', 'test-component', '--umd=TestComponent', '--es-modules'], (err) => {
        expect(err).toNotExist('No errors creating a new React component');
        process.chdir(path.join(tmpDir, 'test-component'));
        cli(['build'], (cliErr) => {
          expect(cliErr).toNotExist();
          done(cliErr);
        });
      });
    });
    after(tearDown);

    it('creates an ES5 build', () => {
      expect(glob.sync('*', { cwd: path.resolve('lib') })).toEqual([
        'index.js',
      ]);
    });
    it('creates an ES modules build', () => {
      expect(glob.sync('*', { cwd: path.resolve('es') })).toEqual([
        'index.js',
      ]);
    });
    it('creates a UMD build with a sourcemap', () => {
      expect(glob.sync('*', { cwd: path.resolve('umd') })).toEqual([
        'test-component.js',
        'test-component.min.js',
        'test-component.min.js.map',
      ]);
    });
    it('exports the configured global in the UMD build', () => {
      expect(fs.readFileSync('umd/test-component.js', 'utf8'))
        .toInclude('root["TestComponent"]');
    });
    it('builds the demo app with a sourcemap', () => {
      expect(glob.sync('*', { cwd: path.resolve('demo/dist') })).toMatch([
        /^demo\.\w{8}\.js/,
        /^demo\.\w{8}\.js\.map/,
        'index.html',
      ]);
    });
  });

  describe('building and cleaning a Web app with spaces in the path', () => {
    before((done) => {
      setUp();
      cli(['new', 'web-app', 'test web app'], (err) => {
        expect(err).toNotExist('No errors creating a new web app');
        process.chdir(path.join(tmpDir, 'test web app'));
        cli(['clean'], (cliErr) => {
          expect(cliErr).toNotExist('No errors cleaning with spaces in the path');
          done(cliErr);
        });
      });
    });
    after(tearDown);
    it('had no errors', () => {});
  });
});
