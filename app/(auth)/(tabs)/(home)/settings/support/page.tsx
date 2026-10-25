import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Text } from "@/components/common/Text";
import { ListGroup } from "@/components/list/ListGroup";
import { ListItem } from "@/components/list/ListItem";
import { TIP_PRODUCT_IDS } from "@/constants/TipJar";
import { loadTipProducts, purchaseTip } from "@/modules";
import { tipResultMessageKey } from "@/utils/tipJar";

export default function SupportPage() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Prices come from the store in the person's own currency; a build with no
  // App Store access (sideloaded, TestFlight before the tips exist) gets none.
  const { data: products, isLoading } = useQuery({
    queryKey: ["tip-products"],
    queryFn: () => loadTipProducts([...TIP_PRODUCT_IDS]),
    staleTime: 60 * 60 * 1000,
  });

  const tip = useMutation({
    mutationFn: purchaseTip,
    onSuccess: (result) => {
      const message = tipResultMessageKey(result);
      if (!message) return;
      toast[message.kind](t(message.key));
    },
    onError: () => toast.error(t("home.settings.support.failed")),
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View
        className='p-4 flex flex-col gap-4'
        style={{ paddingTop: Platform.OS === "android" ? 10 : 0 }}
      >
        <Text className='text-sm leading-5'>
          {t("home.settings.support.body")}
        </Text>
        {isLoading ? (
          <ActivityIndicator />
        ) : products && products.length > 0 ? (
          <ListGroup title={t("home.settings.support.tips")}>
            {products.map((product) => (
              <ListItem
                key={product.id}
                title={product.title}
                value={product.price}
                disabled={tip.isPending}
                onPress={() => tip.mutate(product.id)}
              />
            ))}
          </ListGroup>
        ) : (
          <Text className='text-sm text-neutral-400'>
            {t("home.settings.support.unavailable")}
          </Text>
        )}
        <Text className='text-xs leading-4 text-neutral-400'>
          {t("home.settings.support.note")}
        </Text>
        <View className='h-24' />
      </View>
    </ScrollView>
  );
}
