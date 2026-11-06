
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

const MANIFEST_URL =
  "https://raw.githubusercontent.com/Rogith01/SEIYALAM/main/mobile/android-latest.json";

type UpdateManifest = {
  platform: string;
  latestVersion: string;
  apkUrl: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
};

function compareVersions(a: string, b: string) {
  const first = a.replace(/^v/i, "").split(".").map(Number);
  const second = b.replace(/^v/i, "").split(".").map(Number);

  for (let i = 0; i < Math.max(first.length, second.length); i++) {
    const x = first[i] || 0;
    const y = second[i] || 0;

    if (x > y) return 1;
    if (x < y) return -1;
  }

  return 0;
}

export default function AndroidApkUpdater() {
  const currentVersion = Constants.expoConfig?.version || "1.0.0";

  const [update, setUpdate] = useState<UpdateManifest | null>(null);
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    let active = true;

    const checkUpdate = async () => {
      try {
        const response = await fetch(
          `${MANIFEST_URL}?t=${Date.now()}`
        );

        if (!response.ok) return;

        const data: UpdateManifest = await response.json();

        if (
          data.platform !== "android" ||
          !data.latestVersion ||
          !data.apkUrl ||
          !data.apkUrl.startsWith(
            "https://github.com/Rogith01/SEIYALAM/releases/download/"
          )
        ) {
          return;
        }

        if (compareVersions(data.latestVersion, currentVersion) > 0) {
          if (active) {
            setUpdate(data);
            setVisible(true);
          }
        }
      } catch {
        // Update checking must not interrupt normal app usage.
      }
    };

    void checkUpdate();

    return () => {
      active = false;
    };
  }, [currentVersion]);

  const installUpdate = async () => {
    if (!update || downloading) return;

    try {
      setDownloading(true);
      setProgress(0);

      const cacheDirectory = FileSystem.cacheDirectory;

      if (!cacheDirectory) {
        throw new Error("App cache directory is unavailable.");
      }

      const fileUri =
        `${cacheDirectory}seiyalam-update-${update.latestVersion}.apk`;

      const oldFile = await FileSystem.getInfoAsync(fileUri);

      if (oldFile.exists) {
        await FileSystem.deleteAsync(fileUri);
      }

      const download = FileSystem.createDownloadResumable(
        update.apkUrl,
        fileUri,
        {},
        (result) => {
          if (result.totalBytesExpectedToWrite > 0) {
            setProgress(
              Math.min(
                100,
                Math.round(
                  (result.totalBytesWritten /
                    result.totalBytesExpectedToWrite) *
                    100
                )
              )
            );
          }
        }
      );

      const result = await download.downloadAsync();

      if (!result?.uri) {
        throw new Error("APK download did not complete.");
      }

      const contentUri = await FileSystem.getContentUriAsync(
        result.uri
      );

      setDownloading(false);
      setVisible(false);

      await IntentLauncher.startActivityAsync(
        "android.intent.action.INSTALL_PACKAGE",
        {
          data: contentUri,
          type: "application/vnd.android.package-archive",
          flags: 1,
        }
      );
    } catch (error: any) {
      setDownloading(false);

      Alert.alert(
        "Update failed",
        error?.message ||
          "Unable to download or open the Android installer. Please try again."
      );
    }
  };

  if (Platform.OS !== "android" || !update) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!update.forceUpdate && !downloading) {
          setVisible(false);
        }
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          padding: 22,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 22,
          }}
        >
          <Text
            style={{
              fontSize: 21,
              fontWeight: "900",
              color: "#101828",
            }}
          >
            SEIYALAM Update Available
          </Text>

          <Text style={{ marginTop: 12, color: "#475569" }}>
            Version {update.latestVersion} is ready to install.
          </Text>

          {!!update.releaseNotes && (
            <Text
              style={{
                marginTop: 12,
                color: "#64748B",
                lineHeight: 21,
              }}
            >
              {update.releaseNotes}
            </Text>
          )}

          {downloading ? (
            <View style={{ marginTop: 22 }}>
              <Text style={{ color: "#205DF5", fontWeight: "700" }}>
                Downloading update: {progress}%
              </Text>

              <View
                style={{
                  height: 8,
                  backgroundColor: "#E2E8F0",
                  borderRadius: 10,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${progress}%`,
                    height: 8,
                    backgroundColor: "#205DF5",
                  }}
                />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => void installUpdate()}
              style={{
                backgroundColor: "#205DF5",
                padding: 15,
                borderRadius: 10,
                alignItems: "center",
                marginTop: 22,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                Update Now
              </Text>
            </Pressable>
          )}

          {!update.forceUpdate && !downloading && (
            <Pressable
              onPress={() => setVisible(false)}
              style={{ padding: 13, alignItems: "center" }}
            >
              <Text style={{ color: "#64748B", fontWeight: "700" }}>
                Later
              </Text>
            </Pressable>
          )}

          {downloading && (
            <ActivityIndicator
              color="#205DF5"
              style={{ marginTop: 15 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
