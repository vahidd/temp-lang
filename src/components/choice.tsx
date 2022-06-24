import React from 'react';
import {getLang} from '../index';
import {Replacements} from '../utils/lang';

const Choice = (props: {
  transKey: string;
  count: number;
  replacements?: Replacements;
}) => {
  const lang = getLang();
  return <>{lang.choice(props.transKey, props.count, props.replacements)}</>;
};

export default Choice;
