export default {
    methods: {
        getAddonLogoUrl (addon) {
            let media = addon.media.filter((obj) => {
                return obj.collection === 'logo'
            })

            if (media[0] !== null) {
                return media[0].links.web
            }
        }
    }
}
