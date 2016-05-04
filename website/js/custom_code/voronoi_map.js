voronoiMap = function(map, url) {

    var pointTypes = d3.map(),
        points = [],
        filteredPoints = [],
        uk = {}, //Stores data for clipping mask
        listOfMetrics,
        lastSelectedPoint,
        plotDataField;



    var voronoi = d3.geom.voronoi()
        .x(function(d) {
            return d.x;
        })
        .y(function(d) {
            return d.y;
        });


    var update_hover_panel = function() {
        d3.selectAll('.selected').classed('selected', false);

        var cell = d3.select(this),
            point = cell.datum();

        lastSelectedPoint = point;
        cell.classed('selected', true);

        var this_column = column_descriptions_data[plotDataField]

        var h_dict = {
            station_name: point.station_name,
            journey_time_orig: point.journey_time_orig,
            journey_time_dest: point.journey_time_dest,
            duration_change: point.duration_change,
            ml_orig_station_name: point.ml_orig_station_name,
            ml_dest_station_name: point.ml_dest_station_name,
            lat: point.lat,
            lng: point.lng
        };

        var source = $("#view_location_info").html();
        var template = Handlebars.compile(source);
        var html = template(h_dict);
        d3.select('#selected')
            .html(html)

        if ($("#mapoptions").is(":checked")){
        var source = $("#view_google_maps_data").html();
        var template = Handlebars.compile(source);
        var html = template(h_dict);
        d3.select('#selected_maps')
            .html(html)
        } else {
            d3.select('#selected_maps')
            .html("")
        }



    }

    var format_metric = function(m) {
        if (m <= 1 & m >= -1) {
            if (m == 0) {
                return d3.format(",")(m);
            }
            return d3.format(",.1%")(m);
        } else {
            return d3.format(",")(m);

        }
    }

    var draw_map_key_categorical = function() {

        var key_position_top = 200;
        var key_position_left = 70;
        var key_height = 300;

        var bounds = map.getBounds(),
            topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
            bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
            existing = d3.set(),
            drawLimit = bounds.pad(0.4);


        // Need a scale that turns domain into height then just draw rectanges and text
        var axis_scale = d3.scale.ordinal().domain(colScaleMLStations.domain()).rangeBands([key_height,  0])

        var svg = d3.select(map.getPanes().overlayPane).append("svg")
            .attr('id', 'map_key')
            .attr("class", "leaflet-zoom-hide")
            .style("width", map.getSize().x + 'px')
            .style("height", map.getSize().y + 'px')
            .style("margin-left", topLeft.x + "px")
            .style("margin-top", topLeft.y + "px")
            .style("pointer-events", "none");

        var key_elements = svg.append("g")
            .attr("transform", "translate(" + key_position_left + "," + key_position_top + ")")
            .selectAll(".keyrects")
            .data(colScaleMLStations.domain())
            .enter()

        key_elements
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d) {
              
                return axis_scale(d)
            })
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", function(d) {
                return colScaleMLStations(d)
            })
        
        key_elements.append("text")
            .text(function(d) {
                return d
            })

            .attr("x", 20)
            .attr("y", function(d) { return axis_scale(d) +10})






    }

    var draw_map_key_continuous = function() {

        var key_position_top = 200
        var key_position_left = 70
        var key_height = 300

        var bounds = map.getBounds(),
            topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
            bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
            existing = d3.set(),
            drawLimit = bounds.pad(0.4);

        var num_steps = 50

        var map_colour_scale = colScale;

        var axis_scale = d3.scale.linear().domain(colScale.domain()).range([key_height, key_height / 2, 0])

        var inverted_scale = axis_scale.invert;

        var svg = d3.select(map.getPanes().overlayPane).append("svg")
            .attr('id', 'map_key')
            .attr("class", "leaflet-zoom-hide")
            .style("width", map.getSize().x + 'px')
            .style("height", map.getSize().y + 'px')
            .style("margin-left", topLeft.x + "px")
            .style("margin-top", topLeft.y + "px")
            .style("pointer-events", "none");

        steps = _.map(d3.range(num_steps), function(i) {
            return i * key_height / num_steps
        })

        svg.append("g")
            .attr("transform", "translate(" + key_position_left + "," + key_position_top + ")")
            .selectAll(".keyrects")
            .data(steps)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d) {
                return d
            })
            .attr("width", 10)
            .attr("height", (key_height / num_steps) * 1.06)
            .attr("fill", function(d) {
                return map_colour_scale(inverted_scale(d))
            })

        var yAxis = d3.svg.axis()
            .scale(axis_scale)
            .orient("left")
            .ticks(10, ",0.2s")
            .tickSize(-10, 0)
            .tickFormat(format_metric)

        svg.append("g")
            .attr("transform", "translate(" + key_position_left + "," + key_position_top + ")")
            .attr("class", "y axis")
            .call(yAxis)

        svg.append("g")
            .attr("transform", "translate(90," + key_position_top + ") rotate(90)")
            .append("text")
            .text(function(d) {
                return column_descriptions_data[d3.select("#metricOptions").node().value]["key"]
            })
            .style("font-weight", "bold")
            .style("font-size", "12px")

        svg.append("g").attr("transform", "translate(" + key_position_left + "," + (key_position_top - 10) + ")")
            .append("text")
            .text("Key:")
            .style("font-weight", "bold")
            .style("font-size", "12px")
    }


    var getListOfMetrics = function() {

        var keys = _.filter(_.keys(points[0]), function(d) {
            return !_.contains(["icscode", "nlc", "station_name", "ml_ics_orig", "ml_ics_dest", "ml_orig_station_name", "ml_dest_station_name", "lng", "lat"], d)
        })

        return keys
    }

    var setColourScale = function() {
        maxmin = getMaxMin()
    }

    var getMaxMin = function() {

        plotDataField = d3.select("#metricOptions").node().value
        colourScaleOption = d3.select("#colourOptions").node().value

        var scale_type = column_descriptions_data[plotDataField]["col_scale"];

        if (scale_type == "linear" | scale_type == "log") {

            var thisFieldData = filteredPoints.map(function(thisData) {
                return parseFloat(thisData[plotDataField]);
            });

            minMetric = Math.min.apply(null, thisFieldData);
            maxMetric = Math.max.apply(null, thisFieldData);
            var mid = (maxMetric + minMetric) / 2;

            // Need to lookup the scale 
            if (column_descriptions_data[plotDataField]["domain"] == null) {
                var domain = [minMetric, mid, maxMetric]
            } else {
                domain = column_descriptions_data[plotDataField]["domain"]
            }

            colScale = d3.scale.linear()
                .domain(domain)
                .range(colourOptions[colourScaleOption]);

        } else {

            colScale = colScaleMLStations;
        }

    }



    var drawMetricSelection = function() {
        d3.select("#metricOptions").selectAll('option')
            .data(listOfMetrics)
            .enter()
            .append("option")
            .attr("value", function(d) {
                return d
            })
            .text(function(d) {
                return column_descriptions_data[d].long_name
            })

        d3.select("#metricOptions").on("change", function(d) {
            drawWithLoading()
        })

    }

    var drawColourSelection = function() {

        var data = _.keys(colourOptions)
        d3.select("#colourOptions").selectAll('option')
            .data(data)
            .enter()
            .append("option")
            .attr("value", function(d) {
                return d
            })
            .text(function(d) {
                return d
            })

        d3.select("#colourOptions").on("change", function(d) {
            drawWithLoading()
        })

    }


    var drawWithLoading = function(e) {
        d3.select('#loading').classed('visible', true);
        if (e && e.type == 'viewreset') {
            d3.select('#overlay').remove();
        }

        //Does the settimeout trigger a redraw??
        setTimeout(function() {
            draw();
            d3.select('#loading').classed('visible', false);
        }, 0);
    }

    var get_options = function() {
        plotDataField = d3.select("#metricOptions").node().value
        colourScaleOption = d3.select("#colourOptions").node().value
        clippingMaskOption = true
    }

    var draw = function() {
        d3.select('#overlay').remove();
        d3.select('#map_key').remove();

        d3.select('#selected')
            .html("<h1>Hover over voronoi areas to display statistics</h1>")

        get_options()


        var bounds = map.getBounds(),
            topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
            bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
            existing = d3.set(),
            drawLimit = bounds.pad(0.4);

        filteredPoints = points.filter(function(d) {
            var latlng = new L.LatLng(d.lat, d.lng);

            if (!drawLimit.contains(latlng)) {
                return false
            };

            var point = map.latLngToLayerPoint(latlng);

            key = point.toString();
            if (existing.has(key)) {
                return false
            };
            existing.add(key);

            // if (d.type != plotPointsFields) {
            //     return false
            // }

            d.x = point.x;
            d.y = point.y;
            return true;
        });

        setColourScale();

        var svg = d3.select(map.getPanes().overlayPane).append("svg")



        voronoi(filteredPoints).forEach(function(d) {
            d.point.cell = d;
        });

        var svg = d3.select(map.getPanes().overlayPane).append("svg")
            .attr('id', 'overlay')
            .attr("class", "leaflet-zoom-hide")
            .style("width", map.getSize().x + 'px')
            .style("height", map.getSize().y + 'px')
            .style("margin-left", topLeft.x + "px")
            .style("margin-top", topLeft.y + "px");

        var g = svg.append("g")
            .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

        var svgPoints = g.attr("class", "voronoi_areas")
            .selectAll("g")
            .data(filteredPoints)
            .enter().append("g")
            .attr("class", "point");

        var buildPathFromPoint = function(point) {
            return "M" + point.cell.join("L") + "Z";
        }

        plotDataField = d3.select("#metricOptions").node().value
        svgPoints.append("path")
            .attr("class", "point-cell")
            .attr("d", buildPathFromPoint)
            .style("fill", function(d) {
                return colScale(d[plotDataField])
            })
            .style("opacity", function(d) {
                if (clippingMaskOption) {
                    return 0.95
                } else {
                    return 0.6
                }
            })
            .on('mouseover', update_hover_panel)
            .classed("selected", function(d) {
                return lastSelectedPoint == d
            });

        g.attr("clip-path", "url(#EWClipPath)")


        var vor_points = svg.append("g")
            .selectAll("g .voronoi_points")
            .data(filteredPoints)
            .enter().append("g")
            .attr("class", "point")
            .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

        vor_points.append("circle")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .style('fill', function(d) {
                return colScaleMLStations(d.ml_orig)
            })
            .attr("r", 2);

        vor_points.append("text")
            .attr("class", "place-label")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + (d.x + parseFloat(d.label_offset_x)) + "," + (d.y + parseFloat(d.label_offset_y)) + ")";
            })
            .attr("dy", ".35em")
            .text(function(d) {
                return d.short_court_name;
            })
            .on('click', function(d) {
                a = prompt("enter offsets")
                offsets = a.split(",")
                d3.select(this).attr("transform", function(d) {
                    return "translate(" + (d.x + parseFloat(offsets[0])) + "," + (d.y + parseFloat(offsets[1])) + ")";
                })
            })


        // 
        scale_type = column_descriptions_data[plotDataField]["col_scale"]
        if (scale_type == "category") {
            draw_map_key_categorical()
        } else {
            draw_map_key_continuous()
        }

        //*******************
        //Draw clipping mask
        //*******************
        if (clippingMaskOption) {

            var allCountries = topojson.object(uk, uk.objects.subunits);
            allCountries.geometries = [allCountries.geometries[0], allCountries.geometries[4], allCountries.geometries[3]]

            function projectPoint(x, y) {
                var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                this.stream.point(point.x, point.y);
            }
            var transform = d3.geo.transform({
                point: projectPoint
            })

            var path = d3.geo.path().projection(transform);

            g.append("svg:clipPath")
                .attr("id", "EWClipPath")
                .append("svg:path")
                .datum(allCountries)
                .attr("d", path);

        }



    }

    var mapLayer = {
        onAdd: function(map) {
            map.on('viewreset moveend', drawWithLoading);
            drawWithLoading();
        }
    };

    function makeCategoryScale(points) {

        var stations1 = _.unique(points, function(d) {
            return d.ml_dest
        })
        stations1 = _.map(stations1, function(d) {
            return d.ml_dest
        })

        var stations2 = _.unique(points, function(d) {
            return d.ml_orig
        })
        stations2 = _.map(stations2, function(d) {
            return d.ml_orig
        })

        var stations = stations1.concat(stations2)
        stations = _.unique(stations)

        var colours = ["#777", 
        "#dc3912", 
        "#ff9900", 
        "#0E8917", 
        "#990099", 
        "#0099c6", 
        "#dd4477", 
        "#A6FF3C", 
        "#FF3F42", 
        "#1C3C5D", 
        "#D860DA", 
        ];

        colScaleMLStations = d3.scale.ordinal().range(colours)
    }

    map.on('ready', function() {

        d3.json("uk.json", function(uk_data) {

            uk = uk_data

            d3.csv("data/stations_results.csv", function(data) {

                points = data


                makeCategoryScale(points)
                listOfMetrics = getListOfMetrics(points)
                drawMetricSelection();
                drawColourSelection();
                setColourScale();
                map.addLayer(mapLayer);
            })



        })

    });
}
