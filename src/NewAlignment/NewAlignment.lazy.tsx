import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

export interface AlignmentProps {
  index: number;
  slices: Slice[];
  setSlices: (slices: Slice[]) => void;
}

const LazyNewAlignment = lazy(() => import('./NewAlignment'));

const NewAlignment = (props: AlignmentProps) => (
  <Suspense fallback={null}>
    <LazyNewAlignment {...props} />
  </Suspense>
);

export default NewAlignment;
