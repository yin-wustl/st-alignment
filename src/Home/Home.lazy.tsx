import React, { lazy, Suspense } from 'react';
import { Outlet, Link } from "react-router-dom";

const LazyHome = lazy(() => import('./Home'));

export interface HomeProps {}

const Home = (props: HomeProps) => (
  <Suspense fallback={null}>
    <LazyHome {...props} />
    <Outlet />
  </Suspense>
);

export default Home;
