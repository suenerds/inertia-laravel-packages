export default function(path) {
    path = path.replaceAll(".", "/")
    let [namespace, route] = path.split("::");

    let hints = process.env.hints;
    let viewPath = process.env.viewpath;

    if (namespace && hints[namespace]) {
        path = `${hints[namespace]}/${route}`;
    } else {
        path = `${viewPath}/${path}`
    }

    return import(`../../${path}.inertia.vue`).then(module => module.default)
}