import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function DebugLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="logs"
                options={{
                    title: 'Logs',
                    tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text>
                }}
            />
            <Tabs.Screen
                name="storage"
                options={{
                    title: 'Storage',
                    tabBarIcon: ({ color }) => <Text style={{ color }}>💾</Text>
                }}
            />
            <Tabs.Screen
                name="device"
                options={{
                    title: 'Device',
                    tabBarIcon: ({ color }) => <Text style={{ color }}>📱</Text>
                }}
            />
        </Tabs>
    );
}
