"use strict";

// create spinner
let target = d3.select("#dashboard").node();
// create tooltip
let tooltip = d3.select("body").append("div").style({
    "position": "absolute",
    "z-index": "10",
    "visibility": "hidden"
}).attr({
    "class": "tooltip"
});

(function() {
    "use strict";

    // define data
    const columns = [{
        "label": "Year",
        "field": "Year",
        "format": function(d) {
            return d.Year;
        },
        "type": "integer",
        "display": false,
        "sort": false
    }, {
        "label": "Component",
        "field": "Component",
        "format": function(d) {
            return d.Component;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Investment Name",
        "field": "InvestmentName",
        "format": function(d) {
            return "<a href=# onclick=document.getElementById(&#39;itemModal&#39;).style.display=&#39;block&#39;>" + d['InvestmentName'] + "</a>";
        },
        "type": "string",
        "display": true,
        "sort": true
    }, {
        "label": "Service",
        "field": "Service",
        "format": function(d) {
            return d.Service;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Category",
        "field": "Category",
        "format": function(d) {
            return d.Category;
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Business Area",
        "field": "BusinessArea",
        "format": function(d) {
            return d['Business Area'];
        },
        "type": "string",
        "display": true,
        "sort": false
    }, {
        "label": "Total",
        "field": "Value",
        "format": function(d) {
            return currFormat(+d.Value);
        },
        "type": "double",
        "display": true,
        "sort": false
    }];

    // trigger loader
    let spinner = new Spinner(opts).spin(target);

    // dimensions for the charts
    let dashboardHeight = getSize().height;
    let headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    let footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

    const barChartHeaderHeight = document.querySelector('#barChart1 header').offsetHeight;
    const barChartFooterHeight = document.querySelector('#barChart1 footer').offsetHeight;

    const barChart1Height = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1 / 3;
    const barChartWidth = document.querySelector('#barChart1 footer').clientWidth; // does not include margin, padding, or scroll bar widths

    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };

    const legendOffset = barChartWidth - (barChartWidth * 1 / 15);

    function createViz(error, data) {

        // define mouseover and mouseout events
        function bindHover() {
            document.body.addEventListener('mousemove', function(e) {
                if (e.target.className.animVal == 'bar') {
                    let d = d3.select(e.target).data()[0];
                    let key = d.layer + '<br>' + d.data.key;
                    let amount = formatAbbreviation(d.data.value);
                    showDetail(e, key, amount, null, null)
                }
            });

            document.body.addEventListener('mouseout', function(e) {
                if (e.target.nodeName == 'rect') hideDetail();
            });
        }

        // remove empty bins when value equals zero
        // https://stackoverflow.com/questions/27305546/how-can-hide-dc-js-row-chart-values-if-values-equal-zero
        function remove_empty_bins(source_group) {
            return {
                all: function() {
                    return source_group.all().filter(function(d) {
                        return d.value != 0;
                    });
                }
            };
        }

        if (error) throw error;

        // stop spin.js loader
        spinner.stop();

        let years = [];
        let results = data.value.map(function(d) {
            d.Year = +d.Year;
            d.Value = +d.Value * 1000;
            if (years.indexOf(+d.Year) > -1) {
                years.push(+d.Year);
            }
            return d;
        });

        // set crossfilter
        let ndx = crossfilter(results);

        // define dimensions
        var
            componentDim = ndx.dimension(function(d) {
                return d.Component;
            }),
            categoryDim = ndx.dimension(function(d) {
                return d.Category;
            }),
            areaDim = ndx.dimension(function(d) {
                return d.BusinessArea;
            });

        // group dimensions
        var all = ndx.groupAll(),
            amountByComponent = componentDim.group().reduceSum(function(d) {
                return d.Value;
            }),
            solutionsBy2016 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2016 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            solutionsBy2017 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2017 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            solutionsBy2018 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2018 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            infrastructureBy2016 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2016 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            infrastructureBy2017 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2017 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            infrastructureBy2018 = categoryDim.group().reduceSum(function(d) {
                if (d.Year === 2018 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            areaBy2016 = areaDim.group().reduceSum(function(d) {
                if (d.Year === 2016) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            areaBy2017 = areaDim.group().reduceSum(function(d) {
                if (d.Year === 2017) {
                    return d.Value;
                }
                else {
                    return null;
                }
            }),
            areaBy2018 = areaDim.group().reduceSum(function(d) {
                if (d.Year === 2018) {
                    return d.Value;
                }
                else {
                    return null;
                }
            });

        // dc.js charts
        let componentSelect = dc.selectMenu('#components');
        let grouped1Chart = dc.barChart("#chart-area");
        let grouped2Chart = dc.barChart("#chart-infrastructure");
        let grouped3Chart = dc.barChart("#chart-solutions");
        // let dataTable = dc.dataTable('#data-table');

        // menuselect
        componentSelect
            .dimension(componentDim)
            .group(amountByComponent)
            // .filterDisplayed(function () {
            //     return true;
            // })
            .multiple(false)
            .numberVisible(null)
            // .order(function (a,b) {
            //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
            // })
            .title(function(d) {
                return d.key;
            })
            .promptText('All Components')
            .promptValue(null);

        componentSelect.on('pretransition', function(chart) {
            // add Bootstrap styling to select input
            d3.select('#components').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
        });

        // charts
        grouped1Chart
            .width(barChartWidth)
            .height(barChart1Height)
            .groupBars(true)
            .groupGap(20)
            .centerBar(true)
            .dimension(areaDim)
            .group(areaBy2016, "2016")
            .valueAccessor(function(d) {
                return d.value;
            })
            .stack(areaBy2017, "2017", function(d) {
                return d.value;
            })
            .stack(areaBy2018, "2018", function(d) {
                return d.value;
            })
            .ordinalColors(colorbrewer.Set1[3])
            .x(d3.scale.ordinal().domain(years))
            .elasticX(false)
            .xUnits(dc.units.ordinal)
            // .barPadding(0.15)
            // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
            .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
            .margins({
                top: margins.top,
                right: margins.right,
                bottom: margins.bottom,
                left: margins.left + 50
            })
            .renderLabel(false)
            .renderTitle(false)
            .renderHorizontalGridLines(true)
            .elasticY(true)
            .yAxisLabel("Total Value")
            .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
                return formatAbbreviation(d);
            });

        grouped1Chart.on('pretransition', function(chart) {
            setResponsiveSVG(chart);
        });

        let reduced_infrastructure2016 = remove_empty_bins(infrastructureBy2016);
        let reduced_infrastructure2017 = remove_empty_bins(infrastructureBy2017);
        let reduced_infrastructure2018 = remove_empty_bins(infrastructureBy2018);

        grouped2Chart
            .width(barChartWidth)
            .height(barChart1Height * 2)
            .groupBars(true)
            .groupGap(100)
            .centerBar(true)
            .dimension(categoryDim)
            .group(reduced_infrastructure2016, "2016")
            .keyAccessor(function(d) {
                return d.key;
            })
            .valueAccessor(function(d) {
                return d.value;
            })
            .stack(reduced_infrastructure2017, "2017", function(d) {
                return d.value;
            })
            .stack(reduced_infrastructure2018, "2018", function(d) {
                return d.value;
            })
            .ordinalColors(colorbrewer.Set1[3])
            .x(d3.scale.ordinal().domain(years))
            .elasticX(false)
            .xUnits(dc.units.ordinal)
            // .barPadding(0.15)
            // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
            .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
            .margins({
                top: margins.top,
                right: margins.right,
                bottom: margins.bottom,
                left: margins.left + 50
            })
            .renderLabel(false)
            .renderTitle(false)
            .renderHorizontalGridLines(true)
            .elasticY(true)
            .yAxisLabel("Total Value")
            .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
                return formatAbbreviation(d);
            });

        grouped2Chart.on('pretransition', function(chart) {
            setResponsiveSVG(chart);
        });

        let reduced_solutions2016 = remove_empty_bins(solutionsBy2016);
        let reduced_solutions2017 = remove_empty_bins(solutionsBy2017);
        let reduced_solutions2018 = remove_empty_bins(solutionsBy2018);

        grouped3Chart
            .width(barChartWidth)
            .height(barChart1Height * 2)
            .groupBars(true)
            .groupGap(100)
            .centerBar(true)
            .dimension(categoryDim)
            .group(reduced_solutions2016, "2016")
            .valueAccessor(function(d) {
                return d.value;
            })
            .stack(reduced_solutions2017, "2017", function(d) {
                return d.value;
            })
            .stack(reduced_solutions2018, "2018", function(d) {
                return d.value;
            })
            .ordinalColors(colorbrewer.Set1[3])
            .x(d3.scale.ordinal().domain(years))
            .elasticX(false)
            .xUnits(dc.units.ordinal)
            // .barPadding(0.15)
            // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
            .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
            .margins({
                top: margins.top,
                right: margins.right,
                bottom: margins.bottom,
                left: margins.left + 50
            })
            .renderLabel(false)
            .renderTitle(false)
            .renderHorizontalGridLines(true)
            .elasticY(true)
            .yAxisLabel("Total Value")
            .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
                return formatAbbreviation(d);
            });

        grouped3Chart.on('pretransition', function(chart) {
            setResponsiveSVG(chart);
        });

        dc.renderAll();
        bindHover();

    }

    // if this JavaScript source file resides on a SharePoint server
    // the function will return an endpoint Url pointing to a specified SharePoint list
    // if not, the endpoint will point to a json file
    function getData() {

        let test = '';
        let siteUrl = '';
        let cols = [];
        let expand = '';
        let filter = '';
        let top = '';

        // test if on SharePoint
        try {
            if (typeof _spPageContextInfo !== undefined) {
                siteUrl = _spPageContextInfo.webAbsoluteUrl;
                test = false;
            }
        }
        catch (e) {
            siteUrl = undefined;
            test = true;
        }

        function callData(siteUrl, type, title, columns, expand, filter, top) {

            let url = "",
                endpoint;

            if (!test) {
                if (type !== 'web') {
                    url = siteUrl + "/_api/web/lists/GetByTitle('" + title + "')/items?$select=" + columns + "&$expand=" + expand + "&$filter=" + filter + "&$top=" + top;
                }
                else {
                    url = siteUrl + "/_api/web/" + title;
                }
                endpoint = d3.json(url).header("accept", "application/json;odata=nometadata");

            }
            else {
                url = "../SiteAssets/data/" + title + ".json";
                endpoint = d3.json(url);
            }

            return endpoint;

        }

        for (let i = 0; i < columns.length; i++) {
            cols.push(columns[i].field);
        }
        expand = "";
        filter = "(Value ne 0)";
        top = 5000;

        let componentEndpoint = callData(siteUrl, 'list', 'ISCA', cols.toString(), expand, filter, top);

        // Get the data
        componentEndpoint.get(function(error, data) {
            createViz(error, data);
        });

    }

    getData();
})();
