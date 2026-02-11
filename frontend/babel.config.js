module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        ],
        plugins: [
            "react-native-reanimated/plugin", // Phải luôn ở cuối cùng
        ],
    };
};
