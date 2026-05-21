import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign_in" />;

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <WebTabBar>
          <TabTrigger name="index" href="/" asChild>
            <WebTabButton>List</WebTabButton>
          </TabTrigger>
          <TabTrigger name="planner" href="/planner" asChild>
            <WebTabButton>Planner</WebTabButton>
          </TabTrigger>
          <TabTrigger name="insights" href="/insights" asChild>
            <WebTabButton>Insights</WebTabButton>
          </TabTrigger>
        </WebTabBar>
      </TabList>
    </Tabs>
  );
}

function WebTabBar(props: React.ComponentProps<typeof View>) {
  return (
    <ThemedView type="backgroundElement" style={styles.tabBar} {...props} />
  );
}

function WebTabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon?: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButtonPressable, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButton}
      >
        {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}
        <ThemedText
          type="small"
          themeColor={isFocused ? 'text' : 'textSecondary'}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tabButtonPressable: {
    flex: 1,
    maxWidth: 160,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  icon: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});