import React, { useState } from 'react';
import { Alert, ActivityIndicator, TouchableOpacity, Text, View } from 'react-native';
import { useDeleteAccount } from '@/data/hooks/useDeleteAccount';
import { useAuth } from '@/data/hooks/useAuth';

export function DeleteAccountButton() {
    const [isDeleting, setIsDeleting] = useState(false);
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    const { logout } = useAuth();

    const handleDelete = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);

            // Call API to delete account
            await deleteAccount();

            Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            logout(); // This will trigger auth guard to redirect to login
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to delete account. Please try again or contact support.'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            style={{
                padding: 16,
                backgroundColor: '#dc2626', // Red-600
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 20,
            }}
        >
            {isDeleting ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                    Delete Account
                </Text>
            )}
        </TouchableOpacity>
    );
}
