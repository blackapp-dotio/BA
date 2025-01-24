module.exports = {
    env: {
        es6: true, // Replace es2021 with es6
        node: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 2018, // Compatible with es6
    },
    rules: {
        // Add your custom rules here
    },

    settings: {
        react: {
            version: "detect", // Automatically detect the React version
        },
    },
    extends: ["plugin:react/recommended"],
};
