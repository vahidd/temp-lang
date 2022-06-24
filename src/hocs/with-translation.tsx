import React from 'react';
import {useTranslation} from '../../index';

interface WithTranslationProps {
  t: string;
  choice: (name: string) => string;
}

export function withTheme<
  T extends WithTranslationProps = WithTranslationProps,
>(WrappedComponent: React.ComponentType<T>) {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  // Creating the inner component. The calculated Props type here is the where the magic happens.
  const ComponentWithTheme = (props: Omit<T, keyof WithTranslationProps>) => {
    // Fetch the props you want to inject. This could be done with context instead.
    const themeProps = useTranslation();

    // props comes afterwards so the can override the default ones.
    return <WrappedComponent {...themeProps} {...(props as T)} />;
  };

  ComponentWithTheme.displayName = `withTheme(${displayName})`;

  return ComponentWithTheme;
}
