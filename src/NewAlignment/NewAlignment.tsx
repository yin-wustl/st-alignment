import React, { FC, useEffect } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalculateIcon from '@mui/icons-material/Calculate';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import { DataGrid, GridColDef, GridValueGetterParams, GridRenderCellParams, GridRowSelectionModel, GridValueFormatterParams } from '@mui/x-data-grid';
import { Matrix, SVD, determinant } from 'ml-matrix';

import { AlignmentProps } from './NewAlignment.lazy';
import { StyledGridOverlay, CustomNoRowsOverlay } from '../Import/Import';


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

const generateDistinctColor = (colorSequence: string[]) => {
  let newColor;
  do {
    newColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
  } while (colorSequence.includes(newColor));
  return newColor;
}

const NewAlignment: FC<AlignmentProps> = (AlignmentProps) => {

  const [leftPoints, setLeftPoints] = React.useState<point[]>([]);
  const [rightPoints, setRightPoints] = React.useState<point[]>([]);
  const [leftPointsOnScreen, setLeftPointsOnScreen] = React.useState<point[]>([]);
  const [rightPointsOnScreen, setRightPointsOnScreen] = React.useState<point[]>([]);
  const [numPoints, setNumPoints] = React.useState<number>(Math.max(leftPoints.length, rightPoints.length));
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const [output, setOutput] = React.useState<output>({ theta: 0, px: 0, py: 0 });
  const [colorSequence, setColorSequence] = React.useState<string[]>([]);

  const [leftScaling, setLeftScaling] = React.useState<{ width: number, height: number }>({ width: 1, height: 1 });
  const [rightScaling, setRightScaling] = React.useState<{ width: number, height: number }>({ width: 1, height: 1 });

  const leftImageRef = AlignmentProps.slices[AlignmentProps.index].image;
  const rightImageRef = AlignmentProps.slices[AlignmentProps.index + 1].image;

  const [mode, setMode] = React.useState<string | null>('add');
  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => { setMode(newMode); };

  const handleLeftImageScale = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    const rect = img.getBoundingClientRect();
    const widthScale = img.clientWidth / img.naturalWidth;
    const heightScale = img.clientHeight / img.naturalHeight;
    setLeftScaling({ width: widthScale, height: heightScale });
    const newLeftPointsOnScreen = leftPoints.map((p) => {
      return { x: p.x * widthScale + rect.left, y: p.y * heightScale + rect.top };
    });
    setLeftPointsOnScreen(newLeftPointsOnScreen);
  };

  const handleRightImageScale = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    const widthScale = img.clientWidth / img.naturalWidth;
    const heightScale = img.clientHeight / img.naturalHeight;
    setRightScaling({ width: widthScale, height: heightScale });
  };

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
        {leftImageRef && (<img id="left-image" src={leftImageRef.src} style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onLoad={handleLeftImageScale}
          onResize={handleLeftImageScale}
          onClick={(e) => {
            setColorSequence(prevColorSequence => [...prevColorSequence, generateDistinctColor(prevColorSequence)]);
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / leftScaling.width;
            const y = (e.clientY - rect.top) / leftScaling.height;
            setLeftPoints([...leftPoints, { x: x, y: y }]);
            setLeftPointsOnScreen([...leftPointsOnScreen, { x: e.clientX, y: e.clientY }]);
            setNumPoints(Math.max(leftPoints.length + 1, rightPoints.length));
          }} />)}

        {leftPointsOnScreen.map((p, i) => {
          return (
            <div key={i} style={{ position: "absolute", left: `${p.x}px`, top: `${p.y}px`, transform: "translate(-50%, -50%)", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${colorSequence[i]}`, zIndex: 100 }} />
          );
        })}

      </Paper>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6">{AlignmentProps.slices[AlignmentProps.index].name}</Typography>
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
        {rightImageRef && (<img id="left-image" src={rightImageRef.src} style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onLoad={handleRightImageScale}
          onResize={handleRightImageScale}
          onClick={(e) => {
            setColorSequence(prevColorSequence => [...prevColorSequence, generateDistinctColor(prevColorSequence)]);
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / leftScaling.width;
            const y = (e.clientY - rect.top) / leftScaling.height;
            setRightPoints([...rightPoints, { x: x, y: y }]);
            setRightPointsOnScreen([...rightPointsOnScreen, { x: e.clientX, y: e.clientY }]);
            setNumPoints(Math.max(leftPoints.length, rightPoints.length + 1));
          }} />)}

        {rightPointsOnScreen.map((p, i) => {
          return (
            <div key={i} style={{ position: "absolute", left: `${p.x}px`, top: `${p.y}px`, transform: "translate(-50%, -50%)", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${colorSequence[i]}`, zIndex: 100 }} />
          );
        })}
      </Paper>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6">{AlignmentProps.slices[AlignmentProps.index + 1].name}</Typography>
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
            return !rowSelectionModel.includes(i + 1);
          });
          const newRightPoints = rightPoints.filter((p, i) => {
            return !rowSelectionModel.includes(i + 1);
          });
          const newLeftPointsOnScreen = leftPointsOnScreen.filter((p, i) => {
            return !rowSelectionModel.includes(i + 1);
          });
          const newRightPointsOnScreen = rightPointsOnScreen.filter((p, i) => {
            return !rowSelectionModel.includes(i + 1);
          });
          setLeftPoints(newLeftPoints);
          setRightPoints(newRightPoints);
          setLeftPointsOnScreen(newLeftPointsOnScreen);
          setRightPointsOnScreen(newRightPointsOnScreen);
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
          setLeftPointsOnScreen([]);
          setRightPointsOnScreen([]);
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
          const filename = `alignment-${AlignmentProps.index + 1}-and-${AlignmentProps.index + 2}.json`;
          const json = JSON.stringify(output);
          const blob = new Blob([json], { type: "application/json" });
          const href = URL.createObjectURL(blob);
          saveFile(href, filename);
        }} >Save Alignment</Button>
    </Box>
  )

  const modeSlection = (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      aria-label="text alignment"
      size='small'
    >
      <ToggleButton value="add">
        <AddIcon />
      </ToggleButton>
      <ToggleButton value="remove">
        <RemoveIcon />
      </ToggleButton>
      <ToggleButton value="move">
        <OpenWithIcon />
      </ToggleButton>
      <ToggleButton value="off">
        <DoNotTouchIcon />
      </ToggleButton>
    </ToggleButtonGroup >
  )

  const columns: GridColDef[] = [
    { field: 'id', headerName: '#', width: 70 },
    {
      field: 'Color', headerName: 'Color', width: 130, renderCell: (params: GridRenderCellParams) => {
        return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: `${colorSequence[params.row.id - 1]}` }} />
          </div>
        )
      }
    },
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
              {modeSlection}
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
              slots={{ noRowsOverlay: CustomNoRowsOverlay }}
              autoHeight
              sx={{ '--DataGrid-overlayHeight': '300px' }}
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
