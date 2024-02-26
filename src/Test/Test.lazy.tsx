import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

const LazyTest = lazy(() => import('./Test'));

export interface TestProps {
  slices: Slice[];
}

const Test = (props: TestProps) => (
  <Suspense fallback={null}>
    <LazyTest {...props} />
  </Suspense>
);

export default Test;
