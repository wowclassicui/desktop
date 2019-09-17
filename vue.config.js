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
        },
        i18n: {
            locale: 'en',
            fallbackLocale: 'en',
            localeDir: 'i18n',
            enableInSFC: true
        }
    }
}
