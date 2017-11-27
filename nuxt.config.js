module.exports = {
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
