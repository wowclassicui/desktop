module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: "WoWClassicUI App",
                appId: "com.wowclassicui.app",
                win: {
                    publish: {
                        provider: 'github'
                    },
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
