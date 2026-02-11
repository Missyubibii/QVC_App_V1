import { View, Text, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export default function DeviceInfoScreen() {
    const info = {
        'App Version': Application.nativeApplicationVersion,
        'Build Number': Application.nativeBuildVersion,
        'Device Name': Device.deviceName,
        'Model': Device.modelName,
        'OS': Platform.OS,
        'OS Version': Platform.Version,
        'Is Device': Device.isDevice ? 'Yes' : 'No (Emulator)',
        'Brand': Device.brand,
    };

    return (
        <ScrollView className="flex-1 bg-gray-100 p-4">
            <Text className="text-xl font-bold mb-4">Device Information</Text>

            {Object.entries(info).map(([key, value]) => (
                <View key={key} className="bg-white p-3 mb-2 rounded">
                    <Text className="text-gray-600 text-sm">{key}</Text>
                    <Text className="font-semibold mt-1">{value}</Text>
                </View>
            ))}
        </ScrollView>
    );
}
