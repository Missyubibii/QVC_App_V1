import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { AppStorage } from '@/core/storage/mmkv';

export default function StorageViewerScreen() {
    const [storageData, setStorageData] = useState<Record<string, any>>({});

    const loadStorage = () => {
        // Note: MMKV không có API getAllKeys(), cần track keys manually
        // Hoặc dùng một prefix convention
        const knownKeys = ['user_preferences', 'cache_data', 'last_sync'];
        const data: Record<string, any> = {};

        knownKeys.forEach(key => {
            const value = AppStorage.getItem(key);
            if (value) data[key] = value;
        });

        setStorageData(data);
    };

    const deleteKey = (key: string) => {
        Alert.alert('Delete Key', `Are you sure you want to delete "${key}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    AppStorage.removeItem(key);
                    loadStorage();
                }
            }
        ]);
    };

    useEffect(() => {
        loadStorage();
    }, []);

    return (
        <ScrollView className="flex-1 bg-gray-100 p-4">
            <Text className="text-xl font-bold mb-4">MMKV Storage</Text>

            {Object.entries(storageData).map(([key, value]) => (
                <View key={key} className="bg-white p-4 mb-2 rounded">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="font-semibold">{key}</Text>
                            <Text className="text-xs text-gray-600 mt-1" numberOfLines={3}>
                                {JSON.stringify(value)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => deleteKey(key)}
                            className="ml-2 px-2 py-1 bg-red-500 rounded"
                        >
                            <Text className="text-white text-xs">Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <TouchableOpacity
                onPress={loadStorage}
                className="mt-4 p-3 bg-blue-500 rounded"
            >
                <Text className="text-white text-center font-semibold">Reload</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
