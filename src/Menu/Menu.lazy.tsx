import React, { lazy, Suspense } from 'react';
import { Outlet, Link } from "react-router-dom";

const LazyMenu = lazy(() => import('./Menu'));

const Menu = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyMenu {...props} />
    {/* <Outlet /> */}
  </Suspense>
);

export default Menu;
