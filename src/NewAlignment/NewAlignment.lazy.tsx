import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

const LazyNewAlignment = lazy(() => import('./NewAlignment'));

const NewAlignment = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyNewAlignment {...props} />
    <Outlet />
  </Suspense>
);

export default NewAlignment;
