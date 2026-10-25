import Svg, { Circle } from "react-native-svg";
import { Colors } from "@/constants/Colors";

type Props = {
  /** Watched fraction, 0...1. */
  progress: number;
  size?: number;
  accessibilityLabel?: string;
};

/** Mint ring for how much of an item has been watched; full once played. */
export const ProgressRing: React.FC<Props> = ({
  progress,
  size = 30,
  accessibilityLabel,
}) => {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, progress)) * circumference;
  const center = size / 2;

  return (
    <Svg
      width={size}
      height={size}
      accessibilityRole='image'
      accessibilityLabel={accessibilityLabel}
    >
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        stroke='rgba(255,255,255,0.15)'
        strokeWidth={stroke}
      />
      {filled > 0 && (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill='none'
          stroke={Colors.primary}
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </Svg>
  );
};
