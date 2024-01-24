import React, { FC } from 'react';
import { marked } from 'marked';
import * as fs from "fs/promises";

interface HelpProps { }

const Help: FC<HelpProps> = () => {
  // FIXME: This is not working
  const [rendered, setRendered] = React.useState<string>('');

  React.useEffect(() => {
    fetch('./help.md')
      .then(response => response.text())
      .then(async text => {
        const renderedText = marked(text);
        setRendered(await Promise.resolve(renderedText));
      });
  }, []);

  return (
    <div>
      Help is on the way...
      {rendered}
    </div>
  );
}

export default Help;
