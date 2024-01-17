import React from 'react';
import './App.css';
import { Grid } from '@mui/material';

import NewAlignment from './NewAlignment/NewAlignment.lazy';

function App() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <NewAlignment />
      </Grid>
    </Grid>
  );
}

export default App;
