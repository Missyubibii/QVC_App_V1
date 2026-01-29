import { Stack } from 'expo-router';

export default function CheckInLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="location" />
            <Stack.Screen name="face" />
        </Stack>
    );
}
