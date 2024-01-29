import React, { FC } from 'react';
import {
  Stack,
  Button,
  Grid,
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

import { Alignment, Point, Slice, Resolution } from '../App';
import { AlignmentProps } from './NewAlignment.lazy';
import { StyledGridOverlay, CustomNoRowsOverlay } from '../Import/Import';

type output = {
  theta: number,
  px: number,
  py: number,
}

const enum Mode { add, remove, move, off };

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
  let r, g, b;
  let newColor;
  do {
    [r, g, b] = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
    newColor = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
  } while (r > 240 && g > 240 && b > 240 && colorSequence.includes(newColor));
  return newColor;
}

const NewAlignment: FC<AlignmentProps> = (AlignmentProps) => {
  const index = AlignmentProps.index;
  const slices = AlignmentProps.slices;
  const setSlices = AlignmentProps.setSlices;
  const colors = AlignmentProps.colors;
  const setColors = AlignmentProps.setColors;

  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const [output, setOutput] = React.useState<output>({ theta: 0, px: 0, py: 0 });

  const [mode, setMode] = React.useState<Mode>(Mode.add);
  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: Mode) => { setMode(newMode); };

  const handleClick = (event: React.MouseEvent<HTMLImageElement>, sliceIndex: number) => {
    if (mode === Mode.add) {
      const maxPoints = slices.map((s) => { return s.points.length; }).reduce((a, b) => { return Math.max(a, b); });
      if (slices[index].points.length === maxPoints) {
        setColors([...colors, generateDistinctColor(colors)]);
      }
      const img = event.currentTarget;
      const rect = img.getBoundingClientRect();
      const widthScale = img.clientWidth / img.naturalWidth;
      const heightScale = img.clientHeight / img.naturalHeight;
      const x = (event.clientX - rect.left) / widthScale;
      const y = (event.clientY - rect.top) / heightScale;
      const newSlices = [...slices];
      newSlices[sliceIndex].points.push({ x: x, y: y });
      setSlices(newSlices);
    } else if (mode === Mode.remove) {

    } else if (mode === Mode.move) {

    }
  };

  const renderPoints = (imgRef: React.RefObject<HTMLImageElement>, sliceIndex: number) => {
    const rect = imgRef.current?.getBoundingClientRect();
    const widthScale = (imgRef.current?.clientWidth ?? 1) / (imgRef.current?.naturalWidth ?? 1);
    const heightScale = (imgRef.current?.clientHeight ?? 1) / (imgRef.current?.naturalHeight ?? 1);
    return slices[sliceIndex].points.map((p, i) =>
    (<div key={`image-${sliceIndex}-point-${i}`}
      style={{ position: "absolute", left: p.x * widthScale, top: p.y * heightScale, width: "10px", height: "10px", borderRadius: "50%", transform: "translate(-50%, -50%)", backgroundColor: `${colors[i]}`, border: "1px solid white" }} />)
    );
  };

  const RenderImg = (sliceIndex: number) => {
    const imgRef = React.useRef<HTMLImageElement>(null);

    return (
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
            position: "relative",
          }}
        >
          <img id={`img-${sliceIndex}`} ref={imgRef} src={slices[sliceIndex].image.src} style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onClick={(e) => {
              handleClick(e, sliceIndex);
            }} />
          {renderPoints(imgRef, sliceIndex)}
        </Paper>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h6">{slices[sliceIndex].name}</Typography>
        </Stack>
      </Box>
    );
  }

  const removeSelectedPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<RemoveIcon />}
        onClick={e => {
          // TODO: remove points across all slices
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
          const newSlices = [...slices]
          newSlices.forEach((s) => { s.points = []; });
          setSlices(newSlices);
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
          if (slices[index].points.length !== slices[index + 1].points.length) {
            alert("Must have same number of points on both images");
            return;
          }
          const res = computeTransformation(slices[index].points, slices[index + 1].points);
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
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: `${colors[params.row.id - 1]}` }} />
          </div>
        )
      }
    },
    { field: 'Xleft', headerName: 'X Left', width: 130, valueFormatter: valueFormat },
    { field: 'Yleft', headerName: 'Y Left', width: 130, valueFormatter: valueFormat },
    { field: 'Xright', headerName: 'X Right', width: 130, valueFormatter: valueFormat },
    { field: 'Yright', headerName: 'Y Right', width: 130, valueFormatter: valueFormat },
  ];

  const rows = [...new Array(Math.max(slices[index].points.length, slices[index + 1].points.length))].map((e, i) => {
    return {
      id: i + 1,
      Xleft: slices[index].points[i] ? slices[index].points[i].x : "NA",
      Yleft: slices[index].points[i] ? slices[index].points[i].y : "NA",
      Xright: slices[index + 1].points[i] ? slices[index + 1].points[i].x : "NA",
      Yright: slices[index + 1].points[i] ? slices[index + 1].points[i].y : "NA",
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
        {/* {leftImage} */}
        {RenderImg(index)}
      </Grid>
      <Grid item xs={6}>
        {controlPanel}
      </Grid>
      <Grid item xs={3}>
        {/* {rightImage} */}
        {RenderImg(index + 1)}
      </Grid>
    </Grid>
  );
}

export default NewAlignment;
