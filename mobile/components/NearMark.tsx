import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

/** Official NEAR Protocol mark (24×24 grid). */
const NEAR_PATH =
  'M21.443 0c-.89 0-1.714.46-2.18 1.218l-5.017 7.448a.533.533 0 0 0 .792.7l4.938-4.282a.2.2 0 0 1 .334.151v13.41a.2.2 0 0 1-.354.128L5.03.905A2.56 2.56 0 0 0 3.078 0h-.521A2.557 2.557 0 0 0 0 2.557v18.886a2.557 2.557 0 0 0 4.736 1.338l5.017-7.448a.533.533 0 0 0-.792-.7l-4.938 4.283a.2.2 0 0 1-.333-.152V5.352a.2.2 0 0 1 .354-.128l14.924 17.87c.486.574 1.2.905 1.952.906h.521A2.56 2.56 0 0 0 24 21.445V2.557A2.56 2.56 0 0 0 21.443 0';

export function NearMark({ size = 24, color }: { size?: number; color?: string }) {
  const fill = color ?? 'url(#nearMarkGradient)';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {!color && (
        <Defs>
          <LinearGradient id="nearMarkGradient" x1="0" y1="24" x2="24" y2="0">
            <Stop offset="0" stopColor="#00EC97" />
            <Stop offset="1" stopColor="#7DE2C5" />
          </LinearGradient>
        </Defs>
      )}
      <Path d={NEAR_PATH} fill={fill} />
    </Svg>
  );
}
