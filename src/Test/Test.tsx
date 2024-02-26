import React, { FC } from 'react';
import { Box, Paper, Slider, Typography } from '@mui/material';

import { TestProps } from './Test.lazy'
import testimg from '../pics/test.jpg';
import { ImageRounded } from '@mui/icons-material';


const Test: FC<TestProps> = (TestProps) => {
  const slices = TestProps.slices;
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [curser, setCurser] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);

  const handleDragStart = (event: React.DragEvent<HTMLImageElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    setDragging(true);
    setCurser({ x: event.clientX, y: event.clientY });
  };

  const handleDrag = (event: React.DragEvent<HTMLImageElement>) => {
    event.preventDefault();
    if (!dragging) return;
    const oldCurser = curser;
    setCurser({ x: event.clientX, y: event.clientY });
    setPosition({ x: (imgRef.current?.offsetLeft ?? 0) - (oldCurser.x - event.clientX), y: (imgRef.current?.offsetTop ?? 0) - (oldCurser.y - event.clientY) });
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  return (
    <Box>
      <Paper
        elevation={9}
        style={{ marginBottom: "20px" }}
        sx={{
          height: "600px",
          width: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
        <img id={'img-test'} ref={imgRef} src={testimg}
          style={{
            width: "100%", height: "100%", objectFit: "contain", transform: `scale(${zoom})`,
            position: 'absolute', left: position.x, top: position.y,
          }}
          draggable={true}
          // onMouseDown={handleDragStart}
          // onMouseMove={handleDrag}
          // onMouseUp={handleDragEnd}
          onDragStart={handleDragStart}
          onDragOver={e => { e.preventDefault(); }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      </Paper>

      <Box sx={{ width: '300px' }}>
        <Typography id="zoom-slider" gutterBottom>
          Zoom
        </Typography>
        <Slider value={zoom} min={1.0} max={5.0} step={0.1} valueLabelDisplay="auto" onChange={(e, val) => setZoom(val as number)} style={{ width: "inherit" }} />
      </Box>
    </Box>
  );
};

export default Test;
