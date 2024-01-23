import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

export interface ImportProps {
  slices: Slice[];
  setSlices: (slices: Slice[]) => void;
}

const LazyImport = lazy(() => import('./Import'));

const Import = (props: ImportProps ) => (
  <Suspense fallback={null}>
    <LazyImport {...props} />
  </Suspense>
);

export default Import;
