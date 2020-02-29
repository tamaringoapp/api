var geo_common = require('./_geo_common');
var RECT_IS_REQUIRED = true;

// validate inputs, convert types and apply defaults
function _sanitize(raw, clean) {

    // error & warning messages
    var messages = { errors: [], warnings: [] };

    try {
        geo_common.sanitize_rect('boundary.rect', clean, raw, RECT_IS_REQUIRED);
    }
    catch (err) {
        messages.errors.push(err.message);
    }

    return messages;
}

function _expected() {
    return [
        { name: 'boundary.rect.min_lat' },
        { name: 'boundary.rect.max_lat' },
        { name: 'boundary.rect.min_lon' },
        { name: 'boundary.rect.max_lon' }];
}

module.exports = () => ({
    sanitize: _sanitize,
    expected: _expected
});
