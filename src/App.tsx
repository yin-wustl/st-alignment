import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Help from './Help/Help.lazy';
import Home from './Home/Home.lazy';
import Import from './Import/Import.lazy';
import Menu from './Menu/Menu.lazy';
import NewAlignment from './NewAlignment/NewAlignment.lazy';
import Compute from './Compute/Compute.lazy';
import Preview from './Preview/Preview.lazy';

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
  const [computed, setComputed] = React.useState<boolean>(false);
  const alignmentPaths = [...new Array(Math.max(slices.length - 1, 0))].map((s, i) => {
    return `${i + 1}-and-${i + 2}`;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu slices={slices} computed={computed} />}>
          <Route path="/" element={<Home />} />
          <Route path="/help" element={<Help />} />
          <Route path="/import" element={<Import slices={slices} setSlices={setSlices} />} />
          {alignmentPaths.map((path, i) => (
            <Route key={i} path={`/alignment-${path}`} element={<NewAlignment index={i} slices={slices} setSlices={setSlices} colors={colors} setColors={setColors} allowMixMatch={false} />} />
          ))}
          <Route path="/alignment" element={<NewAlignment index={0} slices={slices} setSlices={setSlices} colors={colors} setColors={setColors} allowMixMatch={true} />} />
          <Route path="/compute" element={<Compute slices={slices} setSlices={setSlices} computed={computed} setComputed={setComputed} />} />
          {alignmentPaths.map((path, i) => (
            <Route key={i} path={`/preview-${path}`} element={<Preview index={i} slices={slices}/>}/>
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
