import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, CameraType } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

export default function FaceVerificationScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [type, setType] = useState(CameraType.front);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const cameraRef = useRef<Camera>(null);

    React.useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleFacesDetected = ({ faces }: any) => {
        setFaceDetected(faces.length > 0);
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;

        setIsProcessing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });
            setCapturedImage(photo.uri);

            // Simulate face verification API call
            setTimeout(() => {
                setIsProcessing(false);
                Alert.alert(
                    'Chấm công thành công! ✅',
                    'Đã ghi nhận thời gian chấm công của bạn.',
                    [
                        {
                            text: 'Về trang chủ',
                            onPress: () => router.replace('/(main)/(tabs)/home'),
                        },
                    ]
                );
            }, 2000);
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
        }
    };

    const retake = () => {
        setCapturedImage(null);
        setIsProcessing(false);
    };

    if (hasPermission === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="camera-off" size={64} color="#94A3B8" />
                <Text style={styles.errorText}>Không có quyền truy cập camera</Text>
                <TouchableOpacity
                    style={styles.errorButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.errorButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Xác minh khuôn mặt</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            {/* Camera or Preview */}
            <View style={styles.cameraContainer}>
                {capturedImage ? (
                    <Image source={{ uri: capturedImage }} style={styles.preview} />
                ) : (
                    <Camera
                        ref={cameraRef}
                        style={styles.camera}
                        type={type}
                        onFacesDetected={handleFacesDetected}
                        faceDetectorSettings={{
                            mode: FaceDetector.FaceDetectorMode.fast,
                            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                            runClassifications: FaceDetector.FaceDetectorClassifications.none,
                            minDetectionInterval: 100,
                            tracking: true,
                        }}
                    >
                        {/* Face detection overlay */}
                        <View style={styles.overlay}>
                            <View style={styles.faceFrame}>
                                {faceDetected && (
                                    <View style={styles.faceDetectedIndicator}>
                                        <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </Camera>
                )}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsCard}>
                {!capturedImage ? (
                    <>
                        <Text style={styles.instructionsTitle}>Hướng dẫn</Text>
                        <View style={styles.instructionItem}>
                            <Ionicons name="person-circle-outline" size={24} color="#3B82F6" />
                            <Text style={styles.instructionText}>
                                Đặt khuôn mặt vào khung hình
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Ionicons name="sunny-outline" size={24} color="#3B82F6" />
                            <Text style={styles.instructionText}>
                                Đảm bảo ánh sáng đủ
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Ionicons name="glasses-outline" size={24} color="#3B82F6" />
                            <Text style={styles.instructionText}>
                                Tháo kính/khẩu trang nếu có
                            </Text>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.previewTitle}>Xem lại ảnh</Text>
                        <Text style={styles.previewSubtitle}>
                            Đảm bảo khuôn mặt rõ ràng trước khi xác nhận
                        </Text>
                    </>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {capturedImage ? (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={retake}
                                disabled={isProcessing}
                            >
                                <Ionicons name="camera-reverse" size={20} color="#3B82F6" />
                                <Text style={styles.buttonSecondaryText}>Chụp lại</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, isProcessing && styles.buttonDisabled]}
                                onPress={takePicture}
                                disabled={isProcessing}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.buttonGradient}
                                >
                                    {isProcessing ? (
                                        <>
                                            <ActivityIndicator color="#FFFFFF" />
                                            <Text style={styles.buttonText}>Đang xử lý...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                            <Text style={styles.buttonText}>Xác nhận</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePicture}
                        >
                            <View style={styles.captureButtonOuter}>
                                <View style={styles.captureButtonInner} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#64748B',
        marginTop: 16,
        textAlign: 'center',
    },
    errorButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
    },
    errorButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    preview: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceFrame: {
        width: 250,
        height: 300,
        borderWidth: 3,
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceDetectedIndicator: {
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        borderRadius: 20,
        padding: 8,
    },
    instructionsCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    instructionsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 15,
        color: '#64748B',
    },
    previewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    previewSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonSecondary: {
        backgroundColor: '#EFF6FF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    captureButton: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    captureButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
    },
});
