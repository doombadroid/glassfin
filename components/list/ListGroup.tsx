import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
  useContext,
} from "react";
import { StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";
import { Text } from "../common/Text";

/**
 * Inside it every ListGroup draws as a glass card under a mint label, rows
 * included. The settings index sets it so the groups other components render
 * there (user info, storage, language) match its own.
 */
export const ListGlassContext = createContext(false);

interface Props extends ViewProps {
  title?: string | null | undefined;
  description?: ReactElement;
}

export const ListGroup: React.FC<PropsWithChildren<Props>> = ({
  title,
  children,
  description,
  ...props
}) => {
  const childrenArray = Children.toArray(children);
  const glass = useContext(ListGlassContext);

  return (
    <View {...props}>
      {title ? (
        <Text
          className={
            glass
              ? "ml-4 mb-1.5 uppercase text-[#8FE6CB] text-xs font-extrabold tracking-widest"
              : "ml-4 mb-1 uppercase text-[#8E8D91] text-xs"
          }
        >
          {title}
        </Text>
      ) : null}
      <View
        style={[]}
        className={
          glass
            ? "flex flex-col rounded-[18px] overflow-hidden border border-white/10 bg-white/5"
            : "flex flex-col rounded-xl overflow-hidden pl-0 bg-neutral-900"
        }
      >
        {Children.map(childrenArray, (child, index) => {
          if (isValidElement<{ style?: ViewStyle }>(child)) {
            return cloneElement(child as any, {
              style: StyleSheet.compose(
                StyleSheet.compose(
                  child.props.style,
                  glass ? styles.glassRow : undefined,
                ),
                index < childrenArray.length - 1
                  ? glass
                    ? styles.glassBorderBottom
                    : styles.borderBottom
                  : undefined,
              ),
            });
          }
          return child;
        })}
      </View>
      {description && <View className='pl-4 mt-1'>{description}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3D3C40",
  },
  // The rows paint their own neutral fill, which would hide the glass.
  glassRow: { backgroundColor: "transparent" },
  glassBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
});
