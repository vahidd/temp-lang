import {useMemo} from 'react';

import {getLang} from '../index';

const useTranslation = () => {
  const lang = getLang();
  return useMemo(
    () => ({
      t: (...params: Parameters<typeof lang.get>): string => {
        return lang.get(...params);
      },
      choice: (...params: Parameters<typeof lang.choice>): string => {
        return lang.choice(...params);
      },
    }),
    [lang],
  );
};

export default useTranslation;
