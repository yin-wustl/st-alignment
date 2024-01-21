import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

const LazyImport = lazy(() => import('./Import'));

const Import = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyImport {...props} />
    <Outlet />
  </Suspense>
);

export default Import;
