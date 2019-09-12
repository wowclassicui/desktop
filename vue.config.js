module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: "Classic Warcraft App",
                appId: "classicwarcraft.app",
                win: {
                  extraResources: [
                    'node_modules/regedit/vbs/*'
                  ]
                }
            }
        }
    }
}
