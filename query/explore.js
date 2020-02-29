const _ = require('lodash');
const peliasQuery = require('pelias-query');
const defaults = require('./explore_defaults');
const textParser = require('./text_parser_pelias');
const config = require('pelias-config').generate();
const placeTypes = require('../helper/placeTypes');

// additional views (these may be merged in to pelias/query at a later date)
var views = {
    custom_boosts: require('./view/boost_sources_and_layers'),
    ngrams_strict: require('./view/ngrams_strict'),
    ngrams_last_token_only: require('./view/ngrams_last_token_only'),
    ngrams_last_token_only_multi: require('./view/ngrams_last_token_only_multi'),
    admin_multi_match_first: require('./view/admin_multi_match_first'),
    admin_multi_match_last: require('./view/admin_multi_match_last'),
    phrase_first_tokens_only: require('./view/phrase_first_tokens_only'),
    boost_exact_matches: require('./view/boost_exact_matches'),
    max_character_count_layer_filter: require('./view/max_character_count_layer_filter'),
    focus_point_filter: require('./view/focus_point_distance_filter')
};

// add abbrevations for the fields pelias/parser is able to detect.
var adminFields = placeTypes.concat(['locality_a', 'region_a', 'country_a']);

// add some name field(s) to the admin fields in order to improve venue matching
// note: this is a bit of a hacky way to add a 'name' field to the list
// of multimatch fields normally reserved for admin subquerying.
// in some cases we are not sure if certain tokens refer to admin components
// or are part of the place name (such as some venue names).
// the variable name 'add_name_to_multimatch' is arbitrary, it can be any value so
// long as there is a corresponding 'admin:*:field' variable set which defines
// the name of the field to use.
// this functionality is not enabled unless the 'input:add_name_to_multimatch'
// variable is set to a non-empty value at query-time.
adminFields = adminFields.concat(['add_name_to_multimatch']);

//------------------------------
// autocomplete query
//------------------------------
var query = new peliasQuery.layout.FilteredBooleanQuery();

// scoring boost
query.score(views.custom_boosts(config.get('api.customBoosts')));
query.score(peliasQuery.view.popularity(peliasQuery.view.leaf.match_all));

// non-scoring hard filters
query.filter(peliasQuery.view.sources);
query.filter(peliasQuery.view.layers);
query.filter(peliasQuery.view.boundary_rect);
query.filter(peliasQuery.view.categories);
query.filter(peliasQuery.view.boundary_gid);

// --------------------------------

/**
  map request variables to query variables for all inputs
  provided by this HTTP request.
**/
function generateQuery(clean) {

    const vs = new peliasQuery.Vars(defaults);

    // sources
    if (_.isArray(clean.sources) && !_.isEmpty(clean.sources)) {
        vs.var('sources', clean.sources);
    }

    // layers
    if (_.isArray(clean.layers) && !_.isEmpty(clean.layers)) {
        vs.var('layers', clean.layers);
    }

    // boundary rect
    if (_.isFinite(clean['boundary.rect.min_lat']) &&
        _.isFinite(clean['boundary.rect.max_lat']) &&
        _.isFinite(clean['boundary.rect.min_lon']) &&
        _.isFinite(clean['boundary.rect.max_lon'])) {
        vs.set({
            'boundary:rect:top': clean['boundary.rect.max_lat'],
            'boundary:rect:right': clean['boundary.rect.max_lon'],
            'boundary:rect:bottom': clean['boundary.rect.min_lat'],
            'boundary:rect:left': clean['boundary.rect.min_lon']
        });
    }

    // boundary gid
    if (_.isString(clean['boundary.gid'])) {
        vs.set({
            'boundary:gid': clean['boundary.gid']
        });
    }

    // categories
    if (clean.categories && clean.categories.length) {
        vs.var('input:categories', clean.categories);
    }

    console.log({
        type: 'explore',
        body: JSON.stringify(query.render(vs))
    });

    return {
        type: 'explore',
        body: query.render(vs)
    };
}

module.exports = generateQuery;
