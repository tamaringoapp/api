var data = require('../fixture/dedupe_elasticsearch_results');
var nonAsciiData = require('../fixture/dedupe_elasticsearch_nonascii_results');
var customLayerData = require('../fixture/dedupe_elasticsearch_custom_layer_results');
var onlyPostalcodeDiffersData = require('../fixture/dedupe_only_postalcode_differs');
var dedupe = require('../../../middleware/dedupe')();

module.exports.tests = {};

module.exports.tests.dedupe = function(test, common) {
  test('filter out duplicates', function(t) {
    var req = {
      clean: {
        text: 'lampeter strasburg high school',
        size: 100
      }
    };
    var res = {
      data: data
    };

    var expectedCount = 8;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.end();
    });
  });

  test('handle non-ascii gracefully', function(t) {
    var req = {
      clean: {
        size: 100
      }
    };
    var res = {
      data: nonAsciiData
    };

    var expectedCount = 4;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'none were removed');
      t.end();
    });
  });

  test('truncate results based on specified size', function(t) {
    var req = {
      clean: {
        text: 'lampeter strasburg high school',
        size: 3
      }
    };
    var res = {
      data: data
    };

    dedupe(req, res, function () {
      t.equal(res.data.length, req.clean.size, 'results have fewer items than before');
      t.end();
    });
  });

  test('truncate results based on size 1', function(t) {
    var req = {
      clean: {
        text: 'lampeter strasburg high school',
        size: 1
      }
    };
    var res = {
      data: data
    };

    dedupe(req, res, function () {
      t.equal(res.data.length, req.clean.size, 'should only return 1 result');
      t.end();
    });
  });

  test('deduplicate between custom layers and venue layers', function(t) {
    var req = {
      clean: {
        size: 20
      }
    };
    var res = {
      data: customLayerData
    };
    var expected = customLayerData[1]; // non-canonical record

    dedupe(req, res, function () {
      t.equal(res.data.length, 1, 'only one result displayed');
      t.equal(res.data[0], expected, 'non-canonical data is preferred');
      t.end();
    });
  });

  test('test records with no address except one has postalcode', function(t) {
    var req = {
      clean: {
        size: 20
      }
    };
    var res = {
      data: onlyPostalcodeDiffersData
    };
    var expected = onlyPostalcodeDiffersData[1]; // record with postcode

    dedupe(req, res, function () {
      t.equal(res.data.length, 1, 'only one result displayed');
      t.equal(res.data[0], expected, 'record with postalcode is preferred');
      t.end();
    });
  });

  test('test records with no address except one has postalcode', function(t) {
    var req = {
      clean: {
        size: 20
      }
    };
    var res = {
      data: onlyPostalcodeDiffersData
    };
    var expected = onlyPostalcodeDiffersData[1]; // record with postcode

    dedupe(req, res, function () {
      t.equal(res.data.length, 1, 'only one result displayed');
      t.equal(res.data[0], expected, 'record with postalcode is preferred');
      t.end();
    });
  });
};


module.exports.tests.priority = function(test, common) {
  test('whosonfirst takes priority over geonames, replace', function (t) {
    var req = {
      clean: {
        text: 'Lancaster',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Lancaster' },
          'source': 'geonames',
          'source_id': '123456',
          'layer': 'locality'
        },
        {
          'name': { 'default': 'Lancaster' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source, 'whosonfirst', 'whosonfirst result won');
      t.end();
    });
  });

  test('whosonfirst takes priority over geonames, no replace', function (t) {
    var req = {
      clean: {
        text: 'Lancaster',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Lancaster' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'locality'
        },
        {
          'name': { 'default': 'Lancaster' },
          'source': 'geonames',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source, 'whosonfirst', 'whosonfirst result won');
      t.end();
    });
  });

  test('openstreetmap takes priority over whosonfirst venues', function (t) {
    var req = {
      clean: {
        text: 'Lancaster Dairy Farm',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Lancaster Dairy Farm' },
          'source': 'openstreetmap',
          'source_id': '123456',
          'layer': 'venue'
        },
        {
          'name': { 'default': 'Lancaster Dairy Farm' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'venue'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source, 'openstreetmap', 'openstreetmap result won');
      t.end();
    });
  });

  test('openaddresses takes priority over openstreetmap', function (t) {
    var req = {
      clean: {
        text: '100 Main St',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': '100 Main St' },
          'source': 'openstreetmap',
          'source_id': '123456',
          'layer': 'address'
        },
        {
          'name': { 'default': '100 Main St' },
          'source': 'openaddresses',
          'source_id': '654321',
          'layer': 'address'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source, 'openaddresses', 'openaddresses result won');
      t.end();
    });
  });

  test('openaddresses with zip takes priority over openaddresses without zip', function (t) {
    var req = {
      clean: {
        text: '100 Main St',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': '100 Main St' },
          'source': 'openaddresses',
          'source_id': '123456',
          'layer': 'address',
          'address_parts': {}
        },
        {
          'name': { 'default': '100 Main St' },
          'source': 'openaddresses',
          'source_id': '654321',
          'layer': 'address',
          'address_parts': {
            'zip': '54321'
          }
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source_id, '654321', 'openaddresses result with zip won');
      t.end();
    });
  });

  test('osm with zip takes priority over openaddresses without zip', function (t) {
    var req = {
      clean: {
        text: '100 Main St',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': '100 Main St' },
          'source': 'openaddresses',
          'source_id': '123456',
          'layer': 'address',
          'address_parts': {}
        },
        {
          'name': { 'default': '100 Main St' },
          'source': 'openstreetmap',
          'source_id': '654321',
          'layer': 'address',
          'address_parts': {
            'zip': '54321'
          }
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].source_id, '654321', 'openstreetmap result with zip won');
      t.end();
    });
  });

  test('works with name aliases', function (t) {
    var req = {
      clean: {
        text: '100 Main St',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': ['100 Main St'] }, // note the array
          'source': 'openaddresses',
          'source_id': '123456'
        },
        {
          'name': { 'default': '100 Main St' },
          'source': 'openstreetmap',
          'source_id': '654321'
        }
      ]
    };

    t.doesNotThrow(() => {
      dedupe(req, res, () => {});
    });

    t.equal(res.data.length, 1, 'results have fewer items than before');
    t.end();
  });

  test('continent and locality not considered synonymous, do not replace', function (t) {
    var req = {
      clean: {
        text: 'Asia',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Asia' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'continent'
        },
        {
          'name': { 'default': 'Asia' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 2;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'no deduplication applied');
      t.end();
    });
  });
  test('locality takes priority over country, replace', function (t) {
    var req = {
      clean: {
        text: 'Singapore',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Singapore' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'country'
        },
        {
          'name': { 'default': 'Singapore' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].layer, 'locality', 'locality result won');
      t.end();
    });
  });

  test('locality takes priority over county, replace', function (t) {
    var req = {
      clean: {
        text: 'Auckland',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Auckland' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'county'
        },
        {
          'name': { 'default': 'Auckland' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].layer, 'locality', 'locality result won');
      t.end();
    });
  });

  test('localadmin takes priority over region, replace', function (t) {
    var req = {
      clean: {
        text: 'Bern',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Bern' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'region'
        },
        {
          'name': { 'default': 'Bern' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'localadmin'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].layer, 'localadmin', 'localadmin result won');
      t.end();
    });
  });

  test('locality takes priority over county, neighbourhood and localadmin, replace', function (t) {
    var req = {
      clean: {
        text: 'Parramatta',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': { 'default': 'Parramatta' },
          'source': 'whosonfirst',
          'source_id': '123456',
          'layer': 'county'
        },
        {
          'name': { 'default': 'Parramatta' },
          'source': 'whosonfirst',
          'source_id': '7890',
          'layer': 'neighbourhood'
        },
        {
          'name': { 'default': 'Parramatta' },
          'source': 'whosonfirst',
          'source_id': '0987',
          'layer': 'localadmin'
        },
        {
          'name': { 'default': 'Parramatta' },
          'source': 'whosonfirst',
          'source_id': '654321',
          'layer': 'locality'
        }
      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[0].layer, 'locality', 'locality result won');
      t.end();
    });
  });

  test('real-world test case Vientiane: two regions and one locality', function (t) {
    var req = {
      clean: {
        text: 'Vientiane',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': {
            'default': 'Vientiane',
            'eng': 'Viangchan'
          },
          'source': 'whosonfirst',
          'source_id': '85673437',
          'layer': 'region',
          'parent': {
            'continent_id': 102191569,
            'country_id': 85632241,
            'region_id': 85673437
          },
        },
        {
          'name': {
            'default': 'Vientiane (prefecture)',
            'eng': 'Viangchan',
            'dut': 'Vientiane'
          },
          'source': 'whosonfirst',
          'source_id': '85673433',
          'layer': 'region',
          'parent': {
            'continent_id': 102191569,
            'country_id': 85632241,
            'region_id': 85673433
          },
        },
        {
          'name': {
            'default': 'Vientiane',
            'eng': 'Vientiane',
            'dut': 'Vientiane'
          },
          'source': 'whosonfirst',
          'source_id': '421168913',
          'layer': 'locality',
          'parent': {
            'continent_id': 102191569,
            'country_id': 85632241,
            'region_id': 85673433,
            'county_id': 1092027747,
            'locality_id': 21168913
          },
        }
      ]
    };

    var expectedCount = 2;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results have fewer items than before');
      t.deepEqual(res.data[1].layer, 'locality', 'locality result not removed');
      t.end();
    });
  });

  test('real-world test case Pennsylvania: records without shared hierarchy should not be deduped', function (t) {
    var req = {
      clean: {
        text: 'Pennsylvania',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'name': {
            'default': 'Pennsylvania'
          },
          'source': 'whosonfirst',
          'source_id': '85688481',
          'layer': 'region',
          'parent': {
            'region_id': 85688481
          },
        },
        {
          'name': {
            'default': 'Pennsylvania'
          },
          'source': 'whosonfirst',
          'source_id': '404499535',
          'layer': 'localadmin',
          'parent': {
            'region_id': 4 //not the same as above
          }
        }
      ]
    };

    var expectedCount = 2;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results are not deduped');
      t.end();
    });
  });

  test('real-world test case Cannes: records with the same name and same coordiante should be deduped with dedupe=geo', function (t) {
    var req = {
      clean: {
        text: 'Cannes',
        size: 100,
        dedupe: 'geo'
      }
    };
    var res = {
      data:  [
        {
          'center_point': { 'lon': 7.02, 'lat': 43.55 },
          'parent': {
            'region_id': 85683323,
            'macrocounty_id': 404227597,
            'county_id': 102072227,
            'locality_id': 6446684,
            'localadmin_id': 1159321933
          },
          'name': { 'default': 'Cannes' },
          'source': 'geonames',
          'source_id': '6446684',
          'layer': 'locality',
        },
        {
          'center_point': { 'lon': 7.01, 'lat': 43.55 },
          'parent': {
            'country_id': 85633147,
            'locality_id': 101749251,
            'region_id': 85683323,
          },
          'name': { 'default': 'Cannes' },
          'source': 'whosonfirst',
          'source_id': '101749251',
          'layer': 'locality',
        },
        {
          'center_point': { 'lon': 7.012, 'lat': 43.551 },
          'parent': {
            'region_id': 85683323,
            'macrocounty_id': 404227597,
            'county_id': 102072227,
            'locality_id': 3028808,
            'localadmin_id': 1159321933
          },
          'name': { 'default': 'Cannes' },
          'source': 'geonames',
          'source_id': '3028808',
          'layer': 'locality',
        }

      ]
    };

    var expectedCount = 1;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results are deduped');
      t.end();
    });
  });

  test('real-world test case Cannes: records with the same name and (almost) same coordiante should not be deduped', function (t) {
    var req = {
      clean: {
        text: 'Cannes',
        size: 100
      }
    };
    var res = {
      data:  [
        {
          'center_point': { 'lon': 7.021, 'lat': 43.552 },
          'parent': {
            'region_id': 85683323,
            'macrocounty_id': 404227597,
            'county_id': 102072227,
            'locality_id': 6446684,
            'localadmin_id': 1159321933
          },
          'name': { 'default': 'Cannes' },
          'source': 'geonames',
          'source_id': '6446684',
          'layer': 'locality',
        },
        {
          'center_point': { 'lon': 7.003, 'lat': 43.557 },
          'parent': {
            'country_id': 85633147,
            'locality_id': 101749251,
            'region_id': 85683323,
          },
          'name': { 'default': 'Cannes' },
          'source': 'whosonfirst',
          'source_id': '101749251',
          'layer': 'locality',
        },
        {
          'center_point': { 'lon': 7.012, 'lat': 43.551 },
          'parent': {
            'region_id': 85683323,
            'macrocounty_id': 404227597,
            'county_id': 102072227,
            'locality_id': 3028808,
            'localadmin_id': 1159321933
          },
          'name': { 'default': 'Cannes' },
          'source': 'geonames',
          'source_id': '3028808',
          'layer': 'locality',
        }

      ]
    };

    var expectedCount = 3;
    dedupe(req, res, function () {
      t.equal(res.data.length, expectedCount, 'results are not deduped');
      t.end();
    });
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('[middleware] dedupe: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};
