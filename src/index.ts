import Lang, {MessagesGroup} from './utils/lang';

export {default as useTranslation} from './hooks/use-translation';
export {default as Trans} from './components/trans';
export {default as Choice} from './components/choice';

let lang: Lang;

export const init = (messages: MessagesGroup) => {
  lang = new Lang(messages);
  return lang;
};

export const getLang = (): Lang => {
  if (typeof lang === 'undefined') {
    throw Error(
      'Translations are not initialized! please use the `init` method to initialize',
    );
  }
  return lang;
};
