import React from "react";
import { Composition, Still } from "remotion";
import { Main } from "./Main";
import { Cover } from "./Cover";
import { FPS, DURATION } from "./timeline";
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} width={1920} height={1080} fps={FPS} durationInFrames={Math.ceil(DURATION * FPS)} />
    <Still id="Cover34" component={Cover as any} width={1080} height={1440} defaultProps={{ v: "34" }} />
    <Still id="Cover43" component={Cover as any} width={1440} height={1080} defaultProps={{ v: "43" }} />
  </>
);
