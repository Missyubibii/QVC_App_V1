import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/presentation/components/Card';

export default function PlaceholderScreen() {
    return (
        <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-4">
            <Card className="w-full items-center p-8">
                <Text className="text-2xl font-bold text-slate-300 mb-2">Coming Soon</Text>
                <Text className="text-slate-400 text-center">Tính năng này đang được phát triển trong Phase 2</Text>
            </Card>
        </SafeAreaView>
    );
}
