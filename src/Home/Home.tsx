import React, { FC } from 'react';
import ReactMarkdown from 'react-markdown';

import { HomeProps } from './Home.lazy';

const Home: FC<HomeProps> = (HomeProps) => {
  const [markdown, setMarkdown] = React.useState('');
  const text = require('./readme.md');

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
};

export default Home;
