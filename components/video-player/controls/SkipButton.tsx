import type React from "react";
import { TouchableOpacity, View, type ViewProps } from "react-native";
import { Text } from "@/components/common/Text";
import { FrostColors } from "@/constants/Frost";

interface SkipButtonProps extends ViewProps {
  onPress: () => void;
  showButton: boolean;
  buttonText: string;
}

const SkipButton: React.FC<SkipButtonProps> = ({
  onPress,
  showButton,
  buttonText,
  ...props
}) => {
  return (
    <View className={showButton ? "flex" : "hidden"} {...props}>
      <TouchableOpacity
        onPress={onPress}
        // Frost glass pill.
        style={{
          backgroundColor: FrostColors.glassRaised,
          borderColor: FrostColors.glassEdge,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Text className='text-base font-bold'>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SkipButton;
