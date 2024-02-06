import React, { FC } from "react";
import { PreviewProps } from "./Preview.lazy";
import { Box, Grid } from "@mui/material";
import { Resolution } from "../App";

const Preview: FC<PreviewProps> = (PreviewProps) => {
  const index = PreviewProps.index;
  const slices = PreviewProps.slices;

  const RenderImages = () => {
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [resolution, setResolution] = React.useState<Resolution>({ width: 0, height: 0 });

    const handleResize = () => {
      if (imgRef.current) {
        setResolution({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight });
      }
    };

    React.useEffect(() => {

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const transform = {
      x: slices[index + 1].alignment.px * resolution.width / slices[index + 1].resolution.width,
      y: slices[index + 1].alignment.py * resolution.height / slices[index + 1].resolution.height,
      rotation: slices[index].alignment.theta,
    };

    const transformation = `translate(${transform.x}px, ${transform.y}px), rotate(${transform.rotation}deg)`

    return (
      <Grid item container xs={12}>
        <Grid item container xs={6}>
          <img
            id={`img-${index}`}
            src={slices[index].image.src}
            style={{ height: "50vh", objectFit: "contain", position: "absolute", opacity: 0.5 }}
            alt="something must went wrong..."
          />
          <img
            id={`img-${index + 1}`}
            src={slices[index + 1].image.src}
            ref={imgRef}
            onLoad={handleResize}
            style={{
              height: "50vh", objectFit: "contain", position: "absolute", opacity: 0.5,
              transform: transformation
            }}
            alt="something must went wrong..."
          />
        </Grid>
        <Grid item sx={{ zIndex: 100 }} xs={6}>
            <p>{slices[index + 1].resolution.width}</p>
            <p></p>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {RenderImages()}
    </Box>
  );
};

export default Preview;
