import React, { FC } from 'react';
import { Matrix, SVD, determinant } from 'ml-matrix';

import { Alignment, Point, Slice, Resolution } from '../App';
import { ComputeProps } from './Compute.lazy';
import { StyledGridOverlay, CustomNoRowsOverlay } from '../Import/Import';
import { valueFormat } from '../NewAlignment/NewAlignment';

import { Box, Button, Grid, Stack } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

const saveFile = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

const centroid = (points: Point[]) => {
  let x = 0;
  let y = 0;
  points.forEach((p) => {
    x += p.x;
    y += p.y;
  });
  return { x: x / points.length, y: y / points.length };
}

const translate = (points: Point[], centroid: { x: number, y: number }) => {
  return points.map((p) => {
    return { x: p.x - centroid.x, y: p.y - centroid.y };
  });
}

const pointsToMatrix = (points: Point[]) => {
  const m = new Matrix(points.length, 2);
  points.forEach((p, i) => {
    m.set(i, 0, p.x);
    m.set(i, 1, p.y);
  });
  return m;
}

const computeTransformation = (left: Point[], right: Point[]) => {
  const leftCentroid = centroid(left);
  const rightCentroid = centroid(right);
  const translation = { x: leftCentroid.x - rightCentroid.x, y: leftCentroid.y - rightCentroid.y };
  const leftTranslated = translate(left, leftCentroid);
  const rightTranslated = translate(right, rightCentroid);
  const P = pointsToMatrix(leftTranslated);
  const Q = pointsToMatrix(rightTranslated);
  const H = P.transpose().mmul(Q);
  const svd = new SVD(H);
  const U = svd.leftSingularVectors;
  const Sigma = svd.diagonal;
  const V = svd.rightSingularVectors;
  const d = Math.sign(determinant(V.mmul(U.transpose())));
  const newDiag = new Matrix([[1, 0], [0, d]]);
  const R = V.mmul(newDiag).mmul(U.transpose());
  return { R, translation };
}

const rotationMatrixToAngle = (R: Matrix) => {
  const theta = Math.atan2(R.get(1, 0), R.get(0, 0));
  const angle = theta * 180 / Math.PI;
  return angle;
}

const Compute: FC<ComputeProps> = (ComputeProps) => {
  const { slices, setSlices, computed, setComputed } = ComputeProps;

  const compute = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        align: "right",
      }}>
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<CalculateIcon />}
        disabled={slices.length < 2 || !slices.reduce((acc, curr) => acc && curr.points.length === slices[0].points.length, true)}
        onClick={(e) => {
          setComputed(true);
          slices.forEach((slice, index) => {
            let newAlignment: Alignment = { theta: 0, px: 0, py: 0 };
            if (index === 0) {
              // newAlignment = { theta: 0, px: 0, py: 0 };
            } else {
              const res = computeTransformation(slices[index - 1].points, slices[index].points);
              const theta = rotationMatrixToAngle(res.R);
              newAlignment = { theta: theta, px: res.translation.x, py: res.translation.y };
            }
            const newSlices = [...slices];
            newSlices[index].alignment = newAlignment;
            setSlices(newSlices);
          });
        }} >Compute Alignment</Button>
    </Box>
  );

  const save = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        align: "right",
      }}>
      <Button disabled={!computed} fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<SaveIcon />}
        onClick={(e) => {
          // const filename = `alignment-${AlignmentProps.index + 1}-and-${AlignmentProps.index + 2}.json`;
          // const json = JSON.stringify(output);
          // const blob = new Blob([json], { type: "application/json" });
          // const href = URL.createObjectURL(blob);
          // saveFile(href, filename);
        }} >Save Alignment</Button>
    </Box>
  );

  const removeAllPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="error" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<DeleteIcon />}
        onClick={e => {
          setSlices([]);
        }}>Remove All</Button>
    </Box>
  );

  const buttons = (
    <Stack direction="row" spacing={2}>
      {compute}
      {save}
      <div style={{ flexGrow: 1 }} />
      {removeAllPoints}
    </Stack>
  );

  const columns: GridColDef[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', headerName: 'Name', width: 300 },
    { field: 'numpoints', headerName: 'Number of Points', width: 150 },
    { field: 'x', headerName: 'X', width: 150, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    { field: 'y', headerName: 'Y', width: 150, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    { field: 'rotation', headerName: 'Rotation', width: 150, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    {
      field: 'action', headerName: 'Action', width: 150, align: 'right', headerAlign: 'right', disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const index = params.row.id - 1;
        return (
          <Button variant="text" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<SaveIcon />}
            disabled={!computed || index === 0}
            onClick={e => {
              const filename = `alignment-${index}-and-${index + 1}.json`;
              const json = JSON.stringify(slices[index].alignment);
              const blob = new Blob([json], { type: "application/json" });
              const href = URL.createObjectURL(blob);
              saveFile(href, filename);
            }} />
        );
      }
    },
  ];

  const rows = [...slices].map((e, i) => {
    return {
      id: i + 1,
      name: e.name,
      numpoints: e.points.length,
      x: e.alignment.px,
      y: e.alignment.py,
      rotation: e.alignment.theta,
    };
  });

  const table = (
    <Grid item container xs={12}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        autoHeight
        sx={{ '--DataGrid-overlayHeight': '300px' }}
      />
    </Grid>
  );

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid item xs={12}>
        {buttons}
      </Grid>
      <Grid item xs={12}>
        {table}
      </Grid>
    </Grid>
  );
}

export default Compute;
