import { Redirect } from 'expo-router';

export default function MainIndex() {
    // Redirect to home tab instead of test screen
    return <Redirect href="/(main)/(tabs)/home" />;
}
