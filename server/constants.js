
function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("PRIVATEKEY", "/etc/ssl/virtualmin/166274908676272/ssl.key");
define("CERTIFICATECRT", "/etc/ssl/virtualmin/166274908676272/ssl.cert");