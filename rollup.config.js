import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/cjs/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/esm/index.js',
      format: 'es',
    },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    typescript({ useTsconfigDeclarationDir: true }),
    commonjs(),
    resolve(),
  ],
};
