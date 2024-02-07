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
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalculateIcon from '@mui/icons-material/Calculate';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import TouchAppIcon from '@mui/icons-material/TouchApp';
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

  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);

  const [mode, setMode] = React.useState<Mode>(Mode.add);
  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: Mode) => { setMode(newMode); };

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

  const handleClick = (event: React.MouseEvent<HTMLImageElement>, sliceIndex: number) => {
    if (mode === Mode.add) {
      setColors([...colors, generateDistinctColor(colors)]);
      const img = event.currentTarget;
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
  };

  const RenderPoints = (imgRef: React.RefObject<HTMLImageElement>, sliceIndex: number) => {
    const rect = imgRef.current?.getBoundingClientRect();
    const width = imgRef.current?.naturalWidth ?? 1;
    const height = imgRef.current?.naturalHeight ?? 1;
    const widthOnScreen = imgRef.current?.clientWidth ?? 1;
    const heightOnScreen = imgRef.current?.clientHeight ?? 1;

    return slices[sliceIndex].points.map((p, i) =>
    (<div key={`image-${sliceIndex}-point-${i}`} id={`image-${sliceIndex}-point-${i}`}
      style={{ position: "absolute", left: `${p.x / width * 100}%`, top: `${p.y / height * 100}%`, width: "10px", height: "10px", borderRadius: "50%", transform: "translate(-50%, -50%)", backgroundColor: `${colors[i]}`, border: "1px solid white" }}
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
          // FIXME: this is not working
          const newRowSelectionModel = [i + 1];
          setRowSelectionModel(newRowSelectionModel);
          removePoints();
        }
      }}
      draggable={true}
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
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

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
          }}
        >
          <img id={`img-${sliceIndex}`} ref={imgRef} src={slices[sliceIndex].image.src} style={{ width: "100%", height: "100%", objectFit: "contain" }}
            alt='something must went wrong...'
            onLoad={handleImageLoad}
            onClick={(e) => {
              handleClick(e, sliceIndex);
            }} />
          {imageLoaded && RenderPoints(imgRef, sliceIndex)}
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
              label="Age"
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
  }

  const removeSelectedPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="warning" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<RemoveIcon />}
        onClick={e => {
          removePoints();
        }}>Remove Selected</Button>
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
          const newSlices = [...slices]
          newSlices.forEach((s) => { s.points = []; });
          setSlices(newSlices);
          setRowSelectionModel([]);
          setColors([]);
        }}>Remove All</Button>
    </Box>
  );

  const modeSelection = (
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
      <ToggleButton value={Mode.off}>
        <DoNotTouchIcon />
      </ToggleButton>
    </ToggleButtonGroup >
  )

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
              {modeSelection}
              <div style={{ width: "100%", flex: "1 1 auto" }} />
              {removeSelectedPoints}
              {removeAllPoints}
            </Stack>
          </Grid>
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
              checkboxSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newSelection) => { setRowSelectionModel(newSelection); }}
              slots={{ noRowsOverlay: CustomNoRowsOverlay }}
              sx={{ height: 600 }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Grid item container xs={12} spacing={2}>
      <Grid item xs={3}>
        {RenderImg(leftSliceIndex, Direction.left)}
      </Grid>
      <Grid item xs={6}>
        {controlPanel}
      </Grid>
      <Grid item xs={3}>
        {RenderImg(rightSliceIndex, Direction.right)}
      </Grid>
    </Grid>
  );
}

export default NewAlignment;
