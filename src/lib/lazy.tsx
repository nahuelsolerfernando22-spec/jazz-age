import { lazy, type ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

export function lazyNamed<M extends Record<string, AnyComponent>, K extends keyof M & string>(
  loader: () => Promise<M>,
  name: K,
): M[K] {
  const Lazy = lazy(async () => {
    const mod = await loader();
    const Comp = mod[name];
    if (!Comp) throw new Error(`lazyNamed: export "${name}" not found`);
    return { default: Comp as AnyComponent };
  });
  return Lazy as unknown as M[K];
}
