import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

export interface MenuProps {
  slices: Slice[];
  setSlices: (slices: Slice[]) => void;
}

const LazyMenu = lazy(() => import('./Menu'));

const Menu = (props: MenuProps) => (
  <Suspense fallback={null}>
    <LazyMenu {...props} />
  </Suspense>
);

export default Menu;
