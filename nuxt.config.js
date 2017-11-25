module.exports = {
    // build: {
    //     extend(config, ctx) {
    //         if (ctx.dev && ctx.isClient) {
    //             config.module.rules.push({
    //                 enforce: 'pre',
    //                 test: /\.(js)$/,
    //                 loader: 'eslint-loader',
    //                 exclude: /(node_modules)/
    //             });
    //         }
    //     }
    // },
    srcDir: 'src/views',
    head: { 
        titleTemplate: 'WebF %s',
        meta: [{
            charset: 'utf-8'
        },
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1'
        }
        ],
        link: [{
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css?family=Lato'
        }]
    },
    css: [
        '@/../assets/css/main.scss'
    ],
    loading: false
};
