import type { ThreeElements } from '@react-three/fiber';

type LegacyBasicMaterialProps = ThreeElements['meshBasicMaterial'] & {
  roughness?: number;
  metalness?: number;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicMaterial: LegacyBasicMaterialProps;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicMaterial: LegacyBasicMaterialProps;
    }
  }
}
