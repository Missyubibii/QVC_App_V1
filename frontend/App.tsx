import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, TextInput, Image } from 'react-native';
import "./src/global.css"; // Kích hoạt Tailwind

export default function App() {
  // Hàm giả lập Login
  const handleLogin = (type: string) => {
    console.log(`Đang đăng nhập bằng ${type}...`);
    alert(`Chức năng ${type} đang được phát triển!`);
  };

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center px-6">
      <StatusBar style="light" />

      {/* Logo hoặc Tiêu đề */}
      <View className="items-center mb-10">
        <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
           <Text className="text-4xl font-bold text-white">V</Text>
        </View>
        <Text className="text-3xl font-bold text-white tracking-wider">
          SUPER APP
        </Text>
        <Text className="text-slate-400 mt-2">Đăng nhập để tiếp tục</Text>
      </View>

      {/* Form đăng nhập */}
      <View className="w-full space-y-4">
        <View>
            <Text className="text-slate-300 mb-2 font-medium">Email</Text>
            <TextInput 
                className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 focus:border-blue-500"
                placeholder="nhapemail@example.com"
                placeholderTextColor="#64748b"
            />
        </View>
        
        <View className="mt-4">
            <Text className="text-slate-300 mb-2 font-medium">Mật khẩu</Text>
            <TextInput 
                className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 focus:border-blue-500"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
            />
        </View>

        <TouchableOpacity 
            className="w-full bg-blue-600 p-4 rounded-xl items-center mt-6 active:bg-blue-700"
            onPress={() => handleLogin('Email')}
        >
            <Text className="text-white font-bold text-lg">Đăng Nhập</Text>
        </TouchableOpacity>
      </View>

      {/* Phân cách */}
      <View className="flex-row items-center w-full my-8">
        <View className="flex-1 h-[1px] bg-slate-700" />
        <Text className="mx-4 text-slate-500">Hoặc tiếp tục với</Text>
        <View className="flex-1 h-[1px] bg-slate-700" />
      </View>

      {/* Social Login */}
      <View className="flex-row gap-4 w-full">
        <TouchableOpacity 
            className="flex-1 bg-white p-4 rounded-xl items-center flex-row justify-center gap-2"
            onPress={() => handleLogin('Google')}
        >
            {/* Giả lập icon Google bằng Text màu */}
            <Text className="font-bold text-slate-900">Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            className="flex-1 bg-[#1877F2] p-4 rounded-xl items-center flex-row justify-center gap-2"
            onPress={() => handleLogin('Facebook')}
        >
             <Text className="font-bold text-white">Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}