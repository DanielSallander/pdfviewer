import powerbiVisualsPlugin from "eslint-plugin-powerbi-visuals";

export default [
    {
        plugins: {
            'powerbi-visuals': powerbiVisualsPlugin
        },
        rules: powerbiVisualsPlugin.configs.recommended.rules,
    },
    {
        ignores: ["node_modules/**", "dist/**", ".vscode/**", ".tmp/**"],
    },
];