import React, { lazy, Suspense } from 'react';
import { Slice } from '../App';

const LazyPreview = lazy(() => import('./Preview'));

export interface PreviewProps {
  index: number;
  slices: Slice[];
 };

const Preview = (props: PreviewProps) => (
  <Suspense fallback={null}>
    <LazyPreview {...props} />
  </Suspense>
);

export default Preview;
