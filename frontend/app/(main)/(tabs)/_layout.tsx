import { Tabs } from 'expo-router';
import { AppTabBar } from '@/presentation/components/AppTabBar';

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <AppTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'home' }} />
            <Tabs.Screen name="task" options={{ title: 'task' }} />
            <Tabs.Screen name="checkin" options={{ title: 'checkin' }} />
            <Tabs.Screen name="noti" options={{ title: 'noti' }} />
            <Tabs.Screen name="profile" options={{ title: 'profile' }} />
        </Tabs>
    );
}
