import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface LeafletMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ latitude, longitude, zoom = 15 }) => {
    // HTML content for Leaflet Map
    const mapHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            L.marker([${latitude}, ${longitude}]).addTo(map)
                .bindPopup('Vị trí của bạn')
                .openPopup();
          </script>
        </body>
      </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={styles.map}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden', // Bo tròn góc WebView
        minHeight: 200,     // Chiều cao tối thiểu
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});

export default LeafletMap;
