import React, { lazy, Suspense } from 'react';

const LazyImport = lazy(() => import('./Import'));

const Import = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyImport {...props} />
  </Suspense>
);

export default Import;
