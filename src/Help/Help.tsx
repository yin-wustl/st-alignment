import React, { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { HelpProps } from './Help.lazy';


const Help: FC<HelpProps> = (HelpProps) => {
  const [markdown, setMarkdown] = React.useState('');
  const text = require('./help.md');

  React.useEffect(() => {
    fetch(text)
      .then(response => response.text())
      .then(text => setMarkdown(text));
  }, []);

  return (
    <div>
      <ReactMarkdown children={markdown} />
    </div>
  );
}

export default Help;
