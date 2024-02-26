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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Slider,
  Fab,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from '@mui/lab';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import { DataGrid, GridColDef, GridValueGetterParams, GridRenderCellParams, GridRowSelectionModel, GridValueFormatterParams } from '@mui/x-data-grid';
import { Matrix, SVD, determinant } from 'ml-matrix';

import { Alignment, Point, Slice, Resolution } from '../App';
import { AlignmentProps } from './NewAlignment.lazy';
import { StyledGridOverlay, CustomNoRowsOverlay } from '../Import/Import';

const enum Mode { add, remove, move, off };
const enum Direction { left, right };

export const valueFormat = (params: GridValueFormatterParams<number>) => {
  return params.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

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
  const allowMixMatch = AlignmentProps.allowMixMatch;

  const [leftSliceIndex, setLeftSliceIndex] = React.useState<number>(index);
  const [rightSliceIndex, setRightSliceIndex] = React.useState<number>(index + 1);
  const [transform, setTransform] = React.useState({ x: 0, y: 0, rotation: 0 });
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
  const [opacity, setOpacity] = React.useState(0.5);
  const [zoom, setZoom] = React.useState(1);

  const [tabValue, setTabValue] = React.useState('1');
  const handleChange = (event: React.SyntheticEvent, newValue: string) => { setTabValue(newValue); };

  const [mode, setMode] = React.useState<Mode>(Mode.add);
  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: Mode) => { setMode(newMode); };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setMode(Mode.remove);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setMode(Mode.add);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const removePoints = () => {
    const newSlices = [...slices]
    newSlices.forEach((s) => {
      s.points = s.points.filter((p, i) => {
        return !rowSelectionModel.includes(i + 1);
      });
    });
    const newColors = [...colors].filter((c, i) => {
      return !rowSelectionModel.includes(i + 1);
    });
    setSlices(newSlices);
    setRowSelectionModel([]);
    setColors(newColors);
  };

  const removeAllPoints = () => {
    const newSlices = [...slices]
    newSlices.forEach((s) => { s.points = []; });
    setSlices(newSlices);
    setRowSelectionModel([]);
    setColors([]);
  };

  const RenderPoints = (imgRef: React.RefObject<HTMLImageElement>, sliceIndex: number) => {
    const rect = imgRef.current?.getBoundingClientRect();
    const width = imgRef.current?.naturalWidth ?? 1;
    const height = imgRef.current?.naturalHeight ?? 1;
    const widthOnScreen = imgRef.current?.clientWidth ?? 1;
    const heightOnScreen = imgRef.current?.clientHeight ?? 1;

    return slices[sliceIndex].points.map((p, i) =>
    (<div key={`image-${sliceIndex}-point-${i}`} id={`image-${sliceIndex}-point-${i}`}
      style={{ position: "absolute", left: `${p.x / width * 100}%`, top: `${p.y / height * 100}%`, width: `${10/zoom}px`, height: `${10/zoom}px`, borderRadius: "50%", transform: "translate(-50%, -50%)", backgroundColor: `${colors[i]}`, border: `${1/zoom}px solid white` }}
      onClick={e => {
        if (mode === Mode.add) {
          if (!rowSelectionModel.includes(i + 1)) {
            const newRowSelectionModel = [...rowSelectionModel];
            newRowSelectionModel.push(i + 1);
            setRowSelectionModel(newRowSelectionModel);
          } else {
            const newRowSelectionModel = [...rowSelectionModel];
            newRowSelectionModel.splice(newRowSelectionModel.indexOf(i + 1), 1);
            setRowSelectionModel(newRowSelectionModel);
          }
        } else if (mode === Mode.remove) {
          const newSlices = [...slices];
          newSlices.forEach((s) => {
            s.points = s.points.filter((p, j) => {
              return j !== i;
            });
          });
          const newColors = [...colors];
          newColors.splice(i, 1);
          setSlices(newSlices);
          setRowSelectionModel([]);
          setColors(newColors);
        }
      }}
      draggable={mode === Mode.add}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={e => {
        e.preventDefault();
      }}
      onDrag={e => {
        e.preventDefault();
        const x = (e.clientX - (rect?.left ?? 0)) / (widthOnScreen / width);
        const y = (e.clientY - (rect?.top ?? 0)) / (heightOnScreen / height);
        const newPoints = [...slices[sliceIndex].points];
        newPoints[i] = { x: x, y: y };
        const newSlices = [...slices];
        newSlices[sliceIndex].points = newPoints;
        setSlices(newSlices);
      }}
    />)
    );
  };

  const RenderImg = (sliceIndex: number, location: Direction) => {
    const divRef = React.useRef<HTMLDivElement>(null);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [curser, setCurser] = React.useState({ x: 0, y: 0 });

    return (
      <Box>
        <Paper
          elevation={9}
          style={{ marginBottom: "20px" }}
          sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div id={`div-${sliceIndex}`} ref={divRef}
            style={{
              width: "100%", height: "100%", objectFit: "contain", transform: `scale(${zoom})`,
              position: 'relative', left: position.x, top: position.y,
            }}
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
              if (mode === Mode.add) {
                setColors([...colors, generateDistinctColor(colors)]);
                const div = event.currentTarget;
                const img = event.currentTarget.firstChild as HTMLImageElement;
                const rect = img.getBoundingClientRect();
                const widthScale = img.clientWidth / img.naturalWidth;
                const heightScale = img.clientHeight / img.naturalHeight;
                const x = (event.clientX - rect.left) / widthScale;
                const y = (event.clientY - rect.top) / heightScale;
                const newSlices = [...slices];
                newSlices.forEach((s, i) => {
                  s.points.push({ x: x, y: y });
                });
                setSlices(newSlices);
              } else if (mode === Mode.remove) {

              }
            }}
            draggable={true}
            onDragStart={(event: React.DragEvent<HTMLDivElement>) => {
              if (mode !== Mode.move) return;
              event.dataTransfer.effectAllowed = 'move';
              setDragging(true);
              setCurser({ x: event.clientX, y: event.clientY });
            }}
            onDragOver={e => { e.preventDefault(); }}
            onDrag={(event: React.DragEvent<HTMLDivElement>) => {
              event.preventDefault();
              if (!dragging) return;
              const oldCurser = curser;
              setCurser({ x: event.clientX, y: event.clientY });
              setPosition({ x: (divRef.current?.offsetLeft ?? 0) - (oldCurser.x - event.clientX), y: (divRef.current?.offsetTop ?? 0) - (oldCurser.y - event.clientY) });
            }}
            onDragEnd={() => {
              setDragging(false);
            }}
          >
            <img id={`img-${sliceIndex}`} ref={imgRef} src={slices[sliceIndex].image.src}
              style={{ width: "100%", height: "100%", objectFit: "contain", position: 'relative' }}
              alt='something must went wrong...'
              onLoad={() => { setImageLoaded(true); }}
            />
            {imageLoaded && RenderPoints(imgRef, sliceIndex)}
          </div>
        </Paper>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <FormControl variant='standard' sx={{ m: 1, minWidth: 80 }}>
            <InputLabel>Slice</InputLabel>
            <Select
              value={location === Direction.left ? leftSliceIndex : rightSliceIndex}
              onChange={e => { location === Direction.left ? setLeftSliceIndex(Number(e.target.value)) : setRightSliceIndex(Number(e.target.value)) }}
              autoWidth
              disabled={!allowMixMatch}
              sx={{ minWidth: 200 }}
              MenuProps={{
                PaperProps: {
                  style: {
                    minWidth: '200px',
                  },
                },
              }}
            >
              {slices.map((s, i) => (<MenuItem value={i} key={i}>{s.name}</MenuItem>))}
            </Select>
          </FormControl>
        </Stack>
      </Box >
    );
  };

  const RenderPreview = () => {
    const previewRef = React.useRef<HTMLImageElement>(null);
    const leftPoints = slices[leftSliceIndex].points;
    const rightPoints = slices[rightSliceIndex].points;
    const res = computeTransformation(leftPoints, rightPoints);
    const angle = rotationMatrixToAngle(res.R);

    React.useEffect(() => {
      setTransform({
        x: res.translation.x * (previewRef.current?.clientWidth ?? 0) / (previewRef.current?.naturalWidth ?? 1),
        y: res.translation.y * (previewRef.current?.clientHeight ?? 0) / (previewRef.current?.naturalHeight ?? 1),
        rotation: angle,
      });
    }, [leftPoints, rightPoints]);

    return (
      <Box sx={{
        width: "600px",
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
      }}>
        <img
          id={`preview-${index}`}
          src={slices[leftSliceIndex].image.src}
          style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", opacity: 1 - opacity }}
          alt="something must went wrong..."
        />
        <img
          id={`preview-${index + 1}`}
          src={slices[rightSliceIndex].image.src}
          ref={previewRef}
          style={{
            width: "100%", height: "100%", objectFit: "contain", position: "absolute", opacity: opacity,
            transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
          }}
          alt="something must went wrong..."
        />
      </Box>
    );
  };

  const buttons = (
    <Stack spacing={1} direction="row" style={{ padding: "15px", width: "100%", flex: "1 1 auto" }}>
      <Button fullWidth variant="contained" color="warning" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<RemoveIcon />}
        onClick={e => {
          removePoints();
        }}>Remove Selected</Button>
      <Button fullWidth variant="contained" color="error" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<DeleteIcon />}
        onClick={e => {
          removeAllPoints();
        }}>Remove All</Button>
    </Stack>
  );

  const modeSelection = (
    <Box>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="text alignment"
        size='small'
      >
        <ToggleButton value={Mode.add}>
          <TouchAppIcon />
        </ToggleButton>
        <ToggleButton value={Mode.remove}>
          <DeleteIcon />
        </ToggleButton>
        <ToggleButton value={Mode.move}>
          <OpenWithIcon />
        </ToggleButton>
        <ToggleButton value={Mode.off}>
          <DoNotTouchIcon />
        </ToggleButton>
      </ToggleButtonGroup >
    </Box>
  );

  const opacitySlider = (
    <Box sx={{ width: '300px' }}>
      <Typography id="opacity-slider" gutterBottom>
        Preview Opacity
      </Typography>
      <Slider value={opacity} min={0.0} max={1.0} step={0.01} valueLabelDisplay="auto" onChange={(e, val) => setOpacity(val as number)} style={{ width: "inherit" }} />
    </Box>
  );

  const zoomSlider = (
    <Box sx={{ width: '300px' }}>
      <Typography id="zoom-slider" gutterBottom>
        Zoom
      </Typography>
      <Slider value={zoom} min={1.0} max={5.0} step={0.1} valueLabelDisplay="auto" onChange={(e, val) => setZoom(val as number)} style={{ width: "inherit" }} />
    </Box>
  );

  const columns: GridColDef[] = [
    { field: 'id', headerName: '#', width: 70, disableColumnMenu: true },
    {
      field: 'Color', headerName: 'Color', width: 100, disableColumnMenu: true, renderCell: (params: GridRenderCellParams) => {
        return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: `${colors[params.row.id - 1]}` }} />
          </div>
        )
      }
    },
    { field: 'Xleft', headerName: 'X Left', width: 100, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    { field: 'Yleft', headerName: 'Y Left', width: 100, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    { field: 'Xright', headerName: 'X Right', width: 100, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
    { field: 'Yright', headerName: 'Y Right', width: 100, valueFormatter: valueFormat, align: 'right', headerAlign: 'right', disableColumnMenu: true },
  ];

  const rows = [...new Array(Math.max(slices[leftSliceIndex].points.length, slices[rightSliceIndex].points.length))].map((e, i) => {
    return {
      id: i + 1,
      Xleft: slices[leftSliceIndex].points[i] ? slices[leftSliceIndex].points[i].x : "NA",
      Yleft: slices[leftSliceIndex].points[i] ? slices[leftSliceIndex].points[i].y : "NA",
      Xright: slices[rightSliceIndex].points[i] ? slices[rightSliceIndex].points[i].x : "NA",
      Yright: slices[rightSliceIndex].points[i] ? slices[rightSliceIndex].points[i].y : "NA",
    };
  });

  const debugTable = (
    <DataGrid
      rows={rows}
      columns={columns}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 10 },
        },
      }}
      pageSizeOptions={[10, 25, 50, 100]}
      checkboxSelection
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={(newSelection) => { setRowSelectionModel(newSelection); }}
      slots={{ noRowsOverlay: CustomNoRowsOverlay }}
      sx={{ height: 600 }}
    />
  );

  const controlPanel = (
    <Box sx={{ overflow: 'auto' }}>
      <Grid item container xs={12}>
        <Stack spacing={1} direction="row" justifyContent="center" alignItems="center" style={{ padding: "15px", width: "100%", flex: "1 1 auto" }}>
          {modeSelection}
          <div style={{ width: "100%", flex: "1 1 auto" }} />
          {buttons}
        </Stack>
        <Stack spacing={1} direction="column" justifyContent="center" alignItems="left" style={{ padding: "15px", width: "100%", flex: "1 1 auto" }}>
          {opacitySlider}
          {zoomSlider}
        </Stack>
      </Grid>
    </Box>
  );

  const previewPanel = (
    <Box>
      <Grid item container xs={12}>
        <Box sx={{ width: '100%' }}>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Preview" value="1" />
                <Tab label="Debug" value="2" />
              </Tabs>
            </Box>
            <TabPanel value="1">
              {RenderPreview()}
            </TabPanel>
            <TabPanel value="2">
              {debugTable}
            </TabPanel>
          </TabContext>
        </Box>
      </Grid>
    </Box>
  )

  const fab = (
    <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16 }} onClick={removeAllPoints}>
      <DeleteIcon />
    </Fab>
  );

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid item container xs={6} spacing={2}>
        <Grid item xs={6}>
          {RenderImg(leftSliceIndex, Direction.left)}
        </Grid>
        <Grid item xs={6}>
          {RenderImg(rightSliceIndex, Direction.right)}
        </Grid>
        <Grid item xs={12}>
          {controlPanel}
        </Grid>
      </Grid>
      <Grid item container xs={6}>
        {previewPanel}
      </Grid>
      {fab}
    </Grid>
  );
}

export default NewAlignment;
