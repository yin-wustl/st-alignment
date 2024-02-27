import React, { lazy, Suspense } from 'react';
import { Outlet, Link } from "react-router-dom";

const LazyHelp = lazy(() => import('./Help'));

export interface HelpProps { }

const Help = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyHelp {...props} />
    <Outlet />
  </Suspense>
);

export default Help;
