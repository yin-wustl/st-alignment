import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

export interface ComputeProps {
  slices: Slice[];
  setSlices: (slices: Slice[]) => void;
  computed: boolean;
  setComputed: (computed: boolean) => void;
}

const LazyCompute = lazy(() => import('./Compute'));

const Compute = (props: ComputeProps) => (
  <Suspense fallback={null}>
    <LazyCompute {...props} />
  </Suspense>
);

export default Compute;
