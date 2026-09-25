import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const openimisFrontendPath = process.env.OPENIMIS_FE_JS_PATH || path.resolve(__dirname, '../../openimis-fe_js');
const openimisFrontendNodeModules = path.resolve(openimisFrontendPath, 'node_modules');
const fromOpenimisFrontend = (dependency) => {
  const dependencyPath = path.resolve(openimisFrontendNodeModules, dependency);
  return fs.existsSync(dependencyPath) ? dependencyPath : dependency;
};

// Under test the module uses its own copies of the runtime libraries (they are
// devDependencies). Fall back to the bare specifier when they are absent, as in
// the assembly build where the module's node_modules is not installed.
const fromLocalNodeModules = (dependency) => {
  const dependencyPath = path.resolve(__dirname, 'node_modules', dependency);
  return fs.existsSync(dependencyPath) ? dependencyPath : dependency;
};

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsxImportSource: '@emotion/react',
  })],
  resolve: {
    alias: {
      '@emotion/react': fromOpenimisFrontend('@emotion/react'),
      '@emotion/styled': fromOpenimisFrontend('@emotion/styled'),
      '@mui/material/styles': fromOpenimisFrontend('@mui/material/styles'),
      '@mui/material': fromOpenimisFrontend('@mui/material'),
      lodash: fromOpenimisFrontend('lodash'),
      react: fromOpenimisFrontend('react'),
      'react-dom': fromOpenimisFrontend('react-dom'),
      'react-intl': fromOpenimisFrontend('react-intl'),
      'react-redux': fromOpenimisFrontend('react-redux'),
      redux: fromOpenimisFrontend('redux'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.jsx'),
      name: 'OpenIMISFeInsuree',
      fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        /^@babel.*/,
        /^@date-io\/.*/,
        /^@openimis.*/,
        'classnames',
        'clsx',
        'history',
        /^lodash.*/,
        'moment',
        'prop-types',
        /^react.*/,
        /^redux.*/,
        /^@mui\/material/,
        /^@mui\/icons-material/,
        '@mui/x-date-pickers',
        /^@emotion\/react/,    
        /^@emotion\/styled/,
        /^@emotion\/cache/,
        '@mui/styled-engine',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.{js,jsx}'],
    // The runtime libs are aliased above so the dev app shares the assembly's
    // copies; under test the module uses its own copies, otherwise React and
    // @emotion end up duplicated.
    alias: {
      '@openimis/fe-core': path.resolve(__dirname, 'tests/mocks/feCore.jsx'),
      react: fromLocalNodeModules('react'),
      'react-dom': fromLocalNodeModules('react-dom'),
      'react-intl': fromLocalNodeModules('react-intl'),
      '@emotion/react': fromLocalNodeModules('@emotion/react'),
      '@emotion/styled': fromLocalNodeModules('@emotion/styled'),
      '@mui/material': fromLocalNodeModules('@mui/material'),
      '@mui/material/styles': fromLocalNodeModules('@mui/material/styles'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/index.jsx'],
    },
  },
});
