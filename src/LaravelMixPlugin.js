const mix = require('laravel-mix')
let collect = require('collect.js')
let fs = require('fs')
let path = require('path')
let glob = require('glob')
let webpack = require('webpack')
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */
class InertiaPackages {
    /**
     * All dependencies that should be installed by Mix.
     *
     * @return {Array}
     */
    dependencies() {
        // Example:
        return ['collect.js', 'fs', 'glob'];
    }

    register(viewpath) {
        this.viewpath = viewpath;
        this.packages = {};
        this.alias = {};
    }

     /**
     * Boot the component. This method is triggered after the
     * user's webpack.mix.js file has executed.
     */
    boot() {
        collect(glob.sync(
            'vendor/**/**/package.json'
        )).map(file => {
            return JSON.parse(fs.readFileSync(file, "utf8"))
        }).filter((file, key) => {
            return file.extra && file.extra.inertia !== undefined;
        }).each(file => {
            let view = path.resolve(__dirname, this.viewpath, 'vendor', file.extra.inertia.namespace);
            this.packages[file.extra.inertia.namespace] = fs.existsSync(view) ? `${this.viewpath}/vendor/${file.extra.inertia.namespace}` : `vendor/${file.extra.inertia.vendor}/resources/views`;
        })
    }
    webpackPlugins() {
        return new webpack.DefinePlugin({
            'process.env.hints' : JSON.stringify(this.packages),
            'process.env.viewpath' : JSON.stringify(this.viewpath),
        });
    }

    webpackConfig(webpackConfig) {
        this.packages.each((item) => {
            webpackConfig.resolve.alias[`@${item.alias}`] = path.resolve(`vendor/${item.name}/resources/js`)
        })
    }
}

mix.extend('inertiaPackages', new InertiaPackages());