import React, { lazy, Suspense } from 'react';

const LazyNewAlignment = lazy(() => import('./NewAlignment'));

const NewAlignment = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyNewAlignment {...props} />
  </Suspense>
);

export default NewAlignment;
