import React, { FC } from 'react';
import { ImportProps } from './Import.lazy';
import { Alignment, Point, Slice, Resolution } from '../App';

import { Box, Grid, Paper, Stack, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DataGrid, GridColDef, GridValueGetterParams, GridRenderCellParams, GridRowSelectionModel, GridValueFormatterParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import img1 from "../pics/20201201-NMK-F-Fc1U1Z1B1_tissue_hires_image.png";
import img2 from "../pics/20201201-NMK-F-Fc1U2Z1B1_tissue_hires_image.png";
import img3 from "../pics/20201201-NMK-F-Fc1U3Z1B1_tissue_hires_image.png";
import img4 from "../pics/20201201-NMK-F-Fc1U4Z1B1_tissue_hires_image.png";

export const StyledGridOverlay = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  '& .ant-empty-img-1': {
    fill: theme.palette.mode === 'light' ? '#aeb8c2' : '#262626',
  },
  '& .ant-empty-img-2': {
    fill: theme.palette.mode === 'light' ? '#f5f5f7' : '#595959',
  },
  '& .ant-empty-img-3': {
    fill: theme.palette.mode === 'light' ? '#dce0e6' : '#434343',
  },
  '& .ant-empty-img-4': {
    fill: theme.palette.mode === 'light' ? '#fff' : '#1c1c1c',
  },
  '& .ant-empty-img-5': {
    fillOpacity: theme.palette.mode === 'light' ? '0.8' : '0.08',
    fill: theme.palette.mode === 'light' ? '#f5f5f5' : '#fff',
  },
}));

export const CustomNoRowsOverlay = () => (
  <StyledGridOverlay>
    <svg
      style={{ flexShrink: 0 }}
      width="240"
      height="200"
      viewBox="0 0 184 152"
      aria-hidden
      focusable="false"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(24 31.67)">
          <ellipse
            className="ant-empty-img-5"
            cx="67.797"
            cy="106.89"
            rx="67.797"
            ry="12.668"
          />
          <path
            className="ant-empty-img-1"
            d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z"
          />
          <path
            className="ant-empty-img-2"
            d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z"
          />
          <path
            className="ant-empty-img-3"
            d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
          />
        </g>
        <path
          className="ant-empty-img-3"
          d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z"
        />
        <g className="ant-empty-img-4" transform="translate(149.65 15.383)">
          <ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
          <path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
        </g>
      </g>
    </svg>
    <Box sx={{ mt: 1 }}>No Rows</Box>
  </StyledGridOverlay>
);

const defaultAlignment: Alignment = { theta: 0, px: 0, py: 0 };
const defaultResolution = { width: 0, height: 0 };

const Import: FC<ImportProps> = (ImportProps) => {
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);

  const handleImageUpload = async (file: File) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve(img);
        };
        img.onerror = () => {
          reject();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  const importOne = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth component="label" variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<AddIcon />}>
        Add
        <input
          hidden
          multiple={false}
          accept="image/*"
          type="file"
          onChange={async (e) => {
            const file = e.target?.files?.[0];
            if (!file) return;
            const name = file.name;
            const img = await handleImageUpload(file);
            const resolution = { width: img.naturalWidth, height: img.naturalHeight };
            ImportProps.setSlices([...ImportProps.slices, { name: name, image: img, alignment: { theta: 0, px: 0, py: 0 }, resolution: resolution, points: [] }]);
          }}
        />
      </Button>
    </Box>
  );

  const importMulti = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth component="label" variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<AddIcon />}>
        Add Multiple
        <input
          hidden
          multiple={true}
          accept="image/*"
          type="file"
          onChange={async (e) => {
            const file = e.target?.files?.[0];
            if (!file) return;
            const newSlices = Array.from(e.target?.files || []).map(async (file) => {
              return {
                name: file.name,
                image: await handleImageUpload(file),
                alignment: { theta: 0, px: 0, py: 0 },
              } as Slice;
            });
            const resolvedSlices = await Promise.all(newSlices);
            ImportProps.setSlices([...ImportProps.slices, ...resolvedSlices]);
          }}
        />
      </Button>
    </Box>
  );

  const importDemo = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth component="label" variant="contained" color="primary" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<AutoAwesomeIcon />}
        onClick={e => {
          const newSlices = [
            {
              name: "Slice 1",
              image: new Image(),
              alignment: { theta: 0, px: 0, py: 0 },
              resolution: { width: 0, height: 0 },
              points: []
            },
            {
              name: "Slice 2",
              image: new Image(),
              alignment: { theta: 0, px: 0, py: 0 },
              resolution: { width: 0, height: 0 },
              points: []
            },
            {
              name: "Slice 3",
              image: new Image(),
              alignment: { theta: 0, px: 0, py: 0 },
              resolution: { width: 0, height: 0 },
              points: []
            },
            {
              name: "Slice 4",
              image: new Image(),
              alignment: { theta: 0, px: 0, py: 0 },
              resolution: { width: 0, height: 0 },
              points: []
            },
          ];
          newSlices[0].image.src = img1;
          newSlices[0].resolution = { width: newSlices[0].image.naturalWidth, height: newSlices[0].image.naturalHeight };
          newSlices[1].image.src = img2;
          newSlices[1].resolution = { width: newSlices[1].image.naturalWidth, height: newSlices[1].image.naturalHeight };
          newSlices[2].image.src = img3;
          newSlices[2].resolution = { width: newSlices[2].image.naturalWidth, height: newSlices[2].image.naturalHeight };
          newSlices[3].image.src = img4;
          newSlices[3].resolution = { width: newSlices[3].image.naturalWidth, height: newSlices[3].image.naturalHeight };
          ImportProps.setSlices(newSlices);
        }}>
        Use Demo
      </Button>
    </Box>
  );

  const removeSelectedPoints = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-beginning",
      }}>
      <Button fullWidth variant="contained" color="warning" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<RemoveIcon />}
        onClick={e => {
          const newSlices = ImportProps.slices.filter((e, i) => !rowSelectionModel.includes(i + 1));
          ImportProps.setSlices(newSlices);
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
      <Button fullWidth variant="contained" color="error" size="small" style={{ textTransform: 'none', whiteSpace: 'nowrap' }} startIcon={<DeleteIcon />}
        onClick={e => {
          ImportProps.setSlices([]);
        }}>Remove All</Button>
    </Box>
  );

  const buttons = (
    <Stack direction="row" spacing={2}>
      {importOne}
      {importMulti}
      {importDemo}
      <div style={{ flexGrow: 1 }} />
      {removeSelectedPoints}
      {removeAllPoints}
    </Stack>
  );

  const columns: GridColDef[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', headerName: 'Name', width: 500 },
  ];

  const rows = [...ImportProps.slices].map((e, i) => {
    return {
      id: i + 1,
      name: e.name,
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
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newSelection) => { setRowSelectionModel(newSelection); }}
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
        {/* {ImportProps.slices.map((e, i) => e.image && (<img key={i} src={e.image.src} alt={e.name} />))} */}
      </Grid>
    </Grid>
  );
}

export default Import;
