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

    let chartHeaderHeight = document.querySelector('#bubbleChart header').offsetHeight;
    let chartFooterHeight = document.querySelector('#bubbleChart footer').offsetHeight;
    let chartHeight = (dashboardHeight - headerHeight - footerHeight - chartHeaderHeight - chartFooterHeight) * 5 / 6;
    let chartWidth = document.querySelector('#bubbleChart footer').clientWidth; // does not include margin, padding, or scroll bar widths

    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };

    function createViz(error, data) {

        // define mouseover and mouseout events
        function bindHover() {
            document.body.addEventListener('mousemove', function(e) {
                if (e.target.className.animVal == 'parent') {
                    let d = d3.select(e.target).data()[0];
                    let key = d.key;
                    let amount = formatAbbreviation(d.value);
                    showDetail(e, key, amount, null, null)
                }
            });

            document.body.addEventListener('mouseout', function(e) {
                if (e.target.className.animVal == 'link' || e.target.nodeName == 'rect') hideDetail();
            });
        }

        if (error) throw error;

        // stop spin.js loader
        spinner.stop();

        let results = data.value.map(function(d) {
            d.Total = +d.Value * 1000;
            d.Year = +d.Year;
            return d;
        });

        // set crossfilter
        let ndx = crossfilter(results);

        // define dimensions
        var
            treemapDim = ndx.dimension(function(d) {
                return [d.InvestmentName, d.Service, d.Category, d.BusinessArea];
            }),
            timeDim = ndx.dimension(function(d) {
                return d.Year;
            }),
            component2Dim = ndx.dimension(function(d) {
                return d.Component;
            });

        // group dimensions
        var
            all = ndx.groupAll(),
            amountByYear = timeDim.group().reduceSum(function(d) {
                return Math.round(d.Total);
            }),
            selectByComponent = component2Dim.group().reduceSum(function(d) {
                return Math.round(d.Total);
            }),
            amountByInvestmentByCategory = treemapDim.group().reduceSum(function(d) {
                return Math.round(d.Total);
            }),
            // amountByInvestmentByCategory = treemapDim.group().reduce(
            //     function(p, v) {
            //         ++p.count;
            //         p.amount += Math.round(v.Total);
            //         return p;
            //     },
            //     function(p, v) {
            //         --p.count;
            //         p.amount -= Math.round(v.Total);
            //         return p;
            //     },
            //     function() {
            //         return {
            //             count: 0,
            //             amount: 0
            //         };
            //     }
            // ),
            totalAmount = ndx.groupAll().reduceSum(function(d) {
                return Math.round(d.Total);
            });

        let maxAmount = d3.max(amountByYear.top(Infinity), function(d) {
            return d.value;
        });

        // dc.js chart types
        let yearSelect = dc.selectMenu('#years');
        let componentSelect = dc.selectMenu('#components');
        // let compositionbubbleChart = dc.bubbleChart('#component');
        let compositionTreemapChart = dc.treeMap('#component');

        // fiscal year menuselect
        yearSelect
            .dimension(timeDim)
            .group(amountByYear)
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
            .promptText(null)
            .promptValue(null);

        yearSelect.on('pretransition', function(chart) {
            // add Bootstrap styling to select input
            d3.select('#years').classed('dc-chart', false);
            chart.select('select').classed('w3-form', true);
            // // remove select all years option from select
            // let firstChild = chart.select('select').node().firstElementChild;
            // if (!firstChild.value) {
            //     d3.select(chart.select('select').node().firstElementChild).remove();
            // }
        });

        yearSelect.filter(2017);

        // fiscal year menuselect
        componentSelect
            .dimension(component2Dim)
            .group(selectByComponent)
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
            // let select = chart.select('select')
            // select
            //     .classed('form-control', true)
            //     .attr('multiple','multiple');
            // let firstChild = chart.select('select').node().firstElementChild;
            // if (!firstChild.value) {
            //     d3.select(chart.select('select').node().firstElementChild).remove();
            // }
            // $('#components>select').multiselect({numberDisplayed: 0});
        });

        // charts
        compositionTreemapChart
            .width(chartWidth)
            .height(chartHeight)
            .dimension(treemapDim)
            .group(amountByInvestmentByCategory)
            .ordinalColors(colorbrewer.Paired[9])
            .keyAccessor([
                function(d) {
                    return d.key[3];
                },
                function(d) {
                    return d.key[2];
                },
                function(d) {
                    return d.key[1];
                },
                function(d) {
                    return d.key[0];
                }
            ])
            .valueAccessor(function(d) {
                return d.value;
            })
            .margins({
                top: margins.top,
                right: margins.right,
                bottom: margins.bottom,
                left: margins.left
            })
            .renderLabel(false)
            .renderTitle(false);

        compositionTreemapChart.colorAccessor(compositionTreemapChart.valueAccessor());

        compositionTreemapChart.on('pretransition', function(chart) {
            // setResponsiveSVG(chart);
            // bindHover();
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
