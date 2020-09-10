export function getShareURL(start, end, title) {
    const payload = [start, end, title];
    return (
        window.location.href.replace(/#.*/, "") +
        "#" +
        btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    );
}

export function decodeShareURL(ret_fake = false) {
    let decoded;
    try {
        decoded = JSON.parse(
            decodeURIComponent(escape(window.atob(location.hash.slice(1))))
        );
    } catch (e) {
        console.log(e);
        return ret_fake ? {} : null;
    }
    const [start, end, title] = decoded;
    return { start, end, title }
}