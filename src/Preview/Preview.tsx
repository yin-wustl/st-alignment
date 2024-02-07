import React, { FC } from "react";
import { PreviewProps } from "./Preview.lazy";
import { Box, Grid } from "@mui/material";

const Preview: FC<PreviewProps> = (PreviewProps) => {
  const index = PreviewProps.index;
  const slices = PreviewProps.slices;

  const RenderImages = () => {
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [transform, setTransform] = React.useState({ x: 0, y: 0, rotation: 0 });

    const handleImageLoad = () => {
      if (imgRef.current) {
        setTransform({
          x: slices[index + 1].alignment.px * (imgRef.current.clientWidth / imgRef.current.naturalWidth),
          y: slices[index + 1].alignment.py * (imgRef.current.clientHeight / imgRef.current.naturalHeight),
          rotation: slices[index + 1].alignment.theta,
        });
      }
    };

    React.useEffect(() => {
      if (imageLoaded) {
        handleImageLoad();
      }
    }, [imageLoaded]);

    return (
      <Box>
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
          onLoad={e => setImageLoaded(true)}
          style={{
            height: "50vh", objectFit: "contain", position: "absolute", opacity: 0.5,
            transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
          }}
          alt="something must went wrong..."
        />
      </Box>
    );
  };

  return (
    <Box>
      {RenderImages()}
    </Box>
  );
};

export default Preview;
