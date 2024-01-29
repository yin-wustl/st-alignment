import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Help from './Help/Help.lazy';
import Home from './Home/Home.lazy';
import Import from './Import/Import.lazy';
import Menu from './Menu/Menu.lazy';
import NewAlignment from './NewAlignment/NewAlignment.lazy';

export type Point = {
  x: number,
  y: number,
};

export type Alignment = {
  theta: number,
  px: number,
  py: number,
}

export type Resolution = {
  width: number,
  height: number,
}

export type Slice = {
  name: string;
  image: HTMLImageElement;
  resolution: Resolution;
  alignment: Alignment;
  points: Point[];
}

const App = () => {
  const [slices, setSlices] = React.useState<Slice[]>([]);
  const [colors, setColors] = React.useState<string[]>([]);
  const alignmentPaths = [...new Array(Math.max(slices.length - 1, 0))].map((s, i) => {
    return `/alignment-${i + 1}-and-${i + 2}`;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu slices={slices} setSlices={setSlices}/>}>
          <Route path="/" element={<Home />} />
          <Route path="/help" element={<Help />} />
          <Route path="/import" element={<Import slices={slices} setSlices={setSlices} />} />
          {alignmentPaths.map((path, i) => (
            <Route key={i} path={path} element={<NewAlignment index={i} slices={slices} setSlices={setSlices} colors={colors} setColors={setColors} />} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
