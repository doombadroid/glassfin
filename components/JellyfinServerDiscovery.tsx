import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { GlassLabel, GlassRow } from "@/components/login/LoginGlass";
import { Colors } from "@/constants/Colors";
import { useJellyfinDiscovery } from "@/hooks/useJellyfinDiscovery";

interface Props {
  onServerSelect?: (server: { address: string; serverName?: string }) => void;
}

// The search stays a tap away rather than running on mount: the first UDP
// broadcast raises iOS's Local Network prompt, which should follow a choice.
const JellyfinServerDiscovery: React.FC<Props> = ({ onServerSelect }) => {
  const { servers, isSearching, startDiscovery } = useJellyfinDiscovery();
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      {servers.length ? (
        <GlassLabel>{t("login.glass.found")}</GlassLabel>
      ) : null}
      {servers.map((server, index) => (
        <GlassRow
          key={server.address}
          highlighted={index === 0}
          title={server.serverName || server.address}
          subtitle={server.serverName ? server.address : undefined}
          onPress={() =>
            onServerSelect?.({
              address: server.address,
              serverName: server.serverName,
            })
          }
        />
      ))}
      <GlassRow
        title={
          isSearching ? t("server.searching") : t("login.glass.find_servers")
        }
        onPress={startDiscovery}
        disabled={isSearching}
        leading={
          isSearching ? (
            <ActivityIndicator size='small' color={Colors.primary} />
          ) : (
            <Ionicons name='wifi' size={18} color={Colors.primary} />
          )
        }
      />
    </View>
  );
};

export default JellyfinServerDiscovery;
