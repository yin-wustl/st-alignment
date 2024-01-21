import React, { lazy, Suspense } from 'react';
import { Outlet, Link } from "react-router-dom";


const LazyHome = lazy(() => import('./Home'));

const Home = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyHome {...props} />
    <Outlet />
  </Suspense>
);

export default Home;
