import React, { FC } from 'react';
import {
  Stack,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Slider,
  Input,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalculateIcon from '@mui/icons-material/Calculate';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { DataGrid, GridColDef, GridValueGetterParams, GridRenderCellParams, GridRowSelectionModel, GridValueFormatterParams } from '@mui/x-data-grid';
import { Matrix, SVD, determinant } from 'ml-matrix';

import img1 from "../pics/20201201-NMK-F-Fc1U1Z1B1_tissue_hires_image.png";
import img2 from "../pics/20201201-NMK-F-Fc1U2Z1B1_tissue_hires_image.png";
import img3 from "../pics/20201201-NMK-F-Fc1U3Z1B1_tissue_hires_image.png";
import img4 from "../pics/20201201-NMK-F-Fc1U4Z1B1_tissue_hires_image.png";
import { PointerOptions } from '@testing-library/user-event/dist/utils';

interface NewAlignmentProps { }

type point = {
  x: number,
  y: number,
};

type output = {
  theta: number,
  px: number,
  py: number,
}

const saveFile = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

const centroid = (points: point[]) => {
  let x = 0;
  let y = 0;
  points.forEach((p) => {
    x += p.x;
    y += p.y;
  });
  return { x: x / points.length, y: y / points.length };
}

const translate = (points: point[], centroid: { x: number, y: number }) => {
  return points.map((p) => {
    return { x: p.x - centroid.x, y: p.y - centroid.y };
  });
}

const pointsToMatrix = (points: point[]) => {
  const m = new Matrix(points.length, 2);
  points.forEach((p, i) => {
    m.set(i, 0, p.x);
    m.set(i, 1, p.y);
  });
  return m;
}

const computeTransformation = (left: point[], right: point[]) => {
  const leftCentroid = centroid(left);
  const rightCentroid = centroid(right);
  const translation = { x: leftCentroid.x - rightCentroid.x, y: leftCentroid.y - rightCentroid.y };
  const leftTranslated = translate(left, leftCentroid);
  const rightTranslated = translate(right, rightCentroid);
  const P = pointsToMatrix(leftTranslated);
  const Q = pointsToMatrix(rightTranslated);
  const H = P.transpose().mmul(Q);
  const svd = new SVD(H);
  console.log(svd);
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

const valueFormat = (params: GridValueFormatterParams<number>) => {
  return params.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const NewAlignment: FC<NewAlignmentProps> = () => {

  const [leftPoints, setLeftPoints] = React.useState<point[]>([]);
  const [rightPoints, setRightPoints] = React.useState<point[]>([]);
  const [numPoints, setNumPoints] = React.useState<number>(Math.max(leftPoints.length, rightPoints.length));
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const [output, setOutput] = React.useState<output>({ theta: 0, px: 0, py: 0 });

  const [leftScaling, setLeftScaling] = React.useState<{ width: number, height: number }>({ width: 1, height: 1 });
  const [rightScaling, setRightScaling] = React.useState<{ width: number, height: number }>({ width: 1, height: 1 });

  const leftImage = (
    <Box>
      <Paper
        elevation={9}
        style={{ marginBottom: "10px" }}
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img id="left-image" src={img1} style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onClick={(e) => {
            const widthScale = e.currentTarget.offsetWidth / e.currentTarget.naturalWidth;
            const heightScale = e.currentTarget.offsetHeight / e.currentTarget.naturalHeight;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / widthScale;
            const y = (e.clientY - rect.top) / heightScale;
            setLeftPoints([...leftPoints, { x: x, y: y }]);
            setNumPoints(Math.max(leftPoints.length + 1, rightPoints.length));
          }} />

        {leftPoints.map((p, i) => {
          return (
            <div key={i} style={{ position: "absolute", left: `${p.x}px`, top: `${p.y}px`, transform: "translate(-50%, -50%)", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "red", zIndex: 100 }} />
          );
        })}

      </Paper>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6">Left</Typography>
      </Stack>
    </Box>
  );

  const rightImage = (
    <Box>
      <Paper
        elevation={9}
        style={{ marginBottom: "10px" }}
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img id="right-image" src={img2} style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onClick={(e) => {
            const widthScale = e.currentTarget.offsetWidth / e.currentTarget.naturalWidth;
            const heightScale = e.currentTarget.offsetHeight / e.currentTarget.naturalHeight;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / widthScale;
            const y = (e.clientY - rect.top) / heightScale;
            setRightPoints([...rightPoints, { x: x, y: y }]);
            setNumPoints(Math.max(leftPoints.length, rightPoints.length + 1));
          }} />
      </Paper>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6">Right</Typography>
      </Stack>
    </Box>
  );

  const addPoint = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<AddIcon />}>New Point</Button>
    </Box>
  );

  const removeSelectedPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<RemoveIcon />}
        onClick={e => {
          const newLeftPoints = leftPoints.filter((p, i) => {
            return !rowSelectionModel.includes(i);
          });
          const newRightPoints = rightPoints.filter((p, i) => {
            return !rowSelectionModel.includes(i);
          });
          setLeftPoints(newLeftPoints);
          setRightPoints(newRightPoints);
          setNumPoints(Math.max(newLeftPoints.length, newRightPoints.length));
          setRowSelectionModel([]);
        }}>Remove Selected</Button>
    </Box>
  );

  const removeAllPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="warning" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<DeleteIcon />}
        onClick={e => {
          setLeftPoints([]);
          setRightPoints([]);
          setNumPoints(0);
          setRowSelectionModel([]);
        }}>Remove All</Button>
    </Box>
  );

  const compute = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        align: "right",
      }}>
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<CalculateIcon />}
        onClick={(e) => {
          if (leftPoints.length !== rightPoints.length) {
            alert("Must have same number of points on both images");
            return;
          }
          const res = computeTransformation(leftPoints, rightPoints);
          const theta = rotationMatrixToAngle(res.R);
          setOutput({ theta: theta, px: res.translation.x, py: res.translation.y });
          console.log(output);
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
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<SaveIcon />}
        onClick={(e) => {
          const filename = "alignment.json";
          const json = JSON.stringify(output);
          const blob = new Blob([json], { type: "application/json" });
          const href = URL.createObjectURL(blob);
          saveFile(href, filename);
        }} >Save Alignment</Button>
    </Box>
  )

  const columns: GridColDef[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'Xleft', headerName: 'X Left', width: 130, valueFormatter: valueFormat },
    { field: 'Yleft', headerName: 'Y Left', width: 130, valueFormatter: valueFormat },
    { field: 'Xright', headerName: 'X Right', width: 130, valueFormatter: valueFormat },
    { field: 'Yright', headerName: 'Y Right', width: 130, valueFormatter: valueFormat },
  ];

  const rows = [...new Array(numPoints)].map((e, i) => {
    return {
      id: i + 1,
      Xleft: i < leftPoints.length ? leftPoints[i].x : "NA",
      Yleft: i < leftPoints.length ? leftPoints[i].y : "NA",
      Xright: i < rightPoints.length ? rightPoints[i].x : "NA",
      Yright: i < rightPoints.length ? rightPoints[i].y : "NA",
    };
  });

  const controlPanel = (
    <Box>
      <Paper
        elevation={9}
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Grid container spacing={2}>
          <Grid item container xs={12}>
            <Stack spacing={1} direction="row" style={{ padding: "15px", width: "100%", flex: "1 1 auto" }}>
              {/* {addPoint} */}
              {removeSelectedPoints}
              {removeAllPoints}
              <div style={{ width: "100%", flex: "1 1 auto" }} />
              {compute}
              {save}
            </Stack>
          </Grid>
          <Grid item container xs={12}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              checkboxSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newSelection) => { setRowSelectionModel(newSelection); }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid item xs={3}>
        {leftImage}
      </Grid>
      <Grid item xs={6}>
        {controlPanel}
      </Grid>
      <Grid item xs={3}>
        {rightImage}
      </Grid>
    </Grid>
  );
}

export default NewAlignment;
