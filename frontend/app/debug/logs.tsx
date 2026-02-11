import { FlashList } from '@shopify/flash-list';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useLogStore, LogEntry } from '@/core/logger/logStore';

export default function DebugLogScreen() {
    const { logs, clearLogs } = useLogStore();
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    const getLogColor = (type: string) => {
        switch (type) {
            case 'ERROR': return 'text-red-600';
            case 'WARN': return 'text-yellow-600';
            case 'NETWORK': return 'text-blue-600';
            default: return 'text-gray-800';
        }
    };

    const copyAllLogs = async () => {
        const logText = logs.map(log =>
            `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type}: ${log.message}`
        ).join('\n');

        await Clipboard.setStringAsync(logText);
        alert('Logs copied to clipboard!');
    };

    return (
        <View className="flex-1 bg-gray-100">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
                <Text className="text-lg font-bold">Debug Logs ({logs.length}/50)</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={copyAllLogs}
                        className="px-3 py-2 bg-blue-500 rounded"
                    >
                        <Text className="text-white font-semibold">Chọn tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={clearLogs}
                        className="px-3 py-2 bg-red-500 rounded"
                    >
                        <Text className="text-white font-semibold">Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Log List */}
            <FlashList
                data={logs}
                getItemType={(item) => item.type} // Optimize: Group by log type
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedLog(item)}
                        className="p-3 bg-white border-b border-gray-200"
                    >
                        <View className="flex-row justify-between">
                            <Text className={`font-semibold ${getLogColor(item.type)}`}>
                                {item.type}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                        <Text className="text-sm mt-1" numberOfLines={2}>
                            {item.message}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedLog}
                animationType="slide"
                onRequestClose={() => setSelectedLog(null)}
            >
                <View className="flex-1 bg-white p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold">Log Details</Text>
                        <TouchableOpacity onPress={() => setSelectedLog(null)}>
                            <Text className="text-blue-500 text-lg">Close</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedLog && (
                        <View>
                            <Text className="font-semibold mb-2">Type: {selectedLog.type}</Text>
                            <Text className="text-gray-600 mb-2">
                                Time: {new Date(selectedLog.timestamp).toLocaleString()}
                            </Text>
                            <Text className="font-semibold mb-2">Message:</Text>
                            <Text className="mb-4">{selectedLog.message}</Text>

                            {selectedLog.details && (
                                <>
                                    <Text className="font-semibold mb-2">Details:</Text>
                                    <Text className="font-mono text-xs bg-gray-100 p-2 rounded">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}
