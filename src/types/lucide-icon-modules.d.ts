declare module 'lucide-react/dist/esm/icons/*' {
  import type {
    ForwardRefExoticComponent,
    RefAttributes,
    SVGAttributes,
  } from 'react';

  type LucideProps = SVGAttributes<SVGSVGElement> & {
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  };

  const Icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;

  export default Icon;
}
