import { clean } from '../utils';

export default function cleanApp(args, cb) {
  const dist = args._[1] || 'dist';
  clean('app', ['coverage', dist], cb);
}
