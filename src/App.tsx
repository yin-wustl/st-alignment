import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Help from './Help/Help.lazy';
import Home from './Home/Home.lazy';
import Import from './Import/Import.lazy';
import Menu from './Menu/Menu.lazy';
import NewAlignment from './NewAlignment/NewAlignment.lazy';

const App = () =>
(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Menu />}>
        <Route path="/" element={<Home />} />
        <Route path="/help" element={<Help />} />
        <Route path="/import" element={<Import />} />
        <Route path="/new-alignment" element={<NewAlignment />} />
      </Route>
    </Routes>
  </BrowserRouter>
);


export default App;
