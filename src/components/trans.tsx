import React from 'react';
import {getLang} from '../index';
import {Replacements} from '../utils/lang';

type TransProps = {
  transKey: string;
  replacements?: Replacements;
  count?: number;
};

const Trans = (props: TransProps) => {
  const lang = getLang();
  return <>{lang.get(props.transKey, props.replacements, props.count)}</>;
};

export default Trans;
