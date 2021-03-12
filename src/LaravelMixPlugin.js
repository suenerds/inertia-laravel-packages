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

    register() {
        this.viewpath = 'resources/views';
        this.assetspath = 'resources/js';
        this.hints = {};
        this.alias = [];
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
            let { namespace, vendor } = file.extra.inertia;

            this.hints[namespace] = this.viewsArePublished(namespace) ?
                this.getViewPublishedPath(namespace) :
                this.getViewVendorPath(vendor)

            this.alias.push({
                namespace,
                vendor
            })
        })
    }

    viewsArePublished(namespace) {
        let view = path.resolve(this.viewpath, 'vendor', namespace);
        return fs.existsSync(view);
    }

    getViewPublishedPath(namespace) {
        return `${this.viewpath}/vendor/${namespace}`
    }

    getViewVendorPath(vendor) {
        return `vendor/${vendor}/resources/views`;
    }

    jsAssetsArePublished(namespace) {
        let view = path.resolve(this.assetspath, 'vendor', namespace);
        return fs.existsSync(view);
    }

    getJsVendorPublishedPath(namespace) {
        return path.resolve(`${this.assetspath}/vendor/${namespace}`);
    }

    getJsVendorPath(vendor) {
        return path.resolve(`vendor/${vendor}/resources/js`);
    }

    webpackPlugins() {
        return new webpack.DefinePlugin({
            'process.env.hints' : JSON.stringify(this.hints),
            'process.env.viewpath' : JSON.stringify(this.viewpath),
        });
    }

    webpackConfig(webpackConfig) {
        webpackConfig.watchOptions = {
            ignored : ['node_modules', 'public']
        }

        webpackConfig.resolve.symlinks = false

        collect(this.alias).each((alias) => {
            webpackConfig.resolve.alias[`@${alias.namespace}`] = this.jsAssetsArePublished(alias.namespace) ?
                this.getJsVendorPublishedPath(alias.namespace) :
                this.getJsVendorPath(alias.vendor)
        })
    }
}

mix.extend('inertiaPackages', new InertiaPackages());
